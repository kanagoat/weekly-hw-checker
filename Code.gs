/**
 * Weekly HW Checker — backend (Google Apps Script)
 *
 * What it does:
 *  - Serves the question list for a given week (GET ?week=<weekId>) — text,
 *    type, and multiple-choice options only. Correct answers, hints, and
 *    solutions never leave the server via this endpoint.
 *  - Accepts a student's answers (POST), grades them against the "AnswerKey"
 *    sheet in this same spreadsheet (server-side, the student never sees it),
 *    logs every attempt to a per-week sheet named "Responses - <weekId>",
 *    and returns a JSON result with the score and a per-question breakdown.
 *  - Hints for wrong answers only unlock once a student has reached
 *    ATTEMPTS_BEFORE_HINTS attempts and is still below PASS_THRESHOLD_PERCENT
 *    (both configurable from the "Config" sheet — see below).
 *  - Full worked solutions are unlocked once a student passes.
 *  - Tracks a weekly pass streak per student, across all their per-week
 *    Responses sheets.
 *  - Enforces a short cooldown between resubmissions to discourage guess-spam.
 *  - Emails the teacher once a student is still stuck after STUCK_ALERT_ATTEMPT
 *    attempts.
 *  - After every submission, regenerates a per-week report sheet named
 *    "Report - <weekId>" and a "Term Overview" sheet (with a class-average
 *    trend chart) across all weeks.
 *  - Also auto-refreshes reports the instant you hand-edit a "Responses -
 *    <weekId>" sheet (an installed-free onEdit trigger) — no need to run
 *    "Refresh all reports" after manual edits anymore, though it's still
 *    there as a belt-and-suspenders option.
 *  - Report/Term Overview/Responses sheets are marked "warning only"
 *    protected, since they're regenerated from scratch on every refresh —
 *    a hand-edit there would just get silently overwritten otherwise.
 *
 * Sheet structure:
 *  - "AnswerKey" — every week's questions in one sheet (WeekID column
 *    distinguishes weeks). Use Data → Filter views in the Sheets UI to look
 *    at one week at a time without touching the underlying data.
 *  - "Responses - <weekId>" — one sheet per week, created automatically the
 *    first time a student submits for that week (or via the "Set up a new
 *    week" menu command). Never create these by hand.
 *  - "Report - <weekId>" / "Term Overview" — auto-generated, see above.
 *  - "Config" — optional. Two columns, Setting/Value. If present, overrides
 *    the DEFAULT_CONFIG values below (PASS_THRESHOLD_PERCENT,
 *    ATTEMPTS_BEFORE_HINTS, RESUBMIT_COOLDOWN_SECONDS, STUCK_ALERT_ATTEMPT,
 *    TEACHER_EMAIL) without touching this script. Missing/blank rows fall
 *    back to the defaults.
 *  - "Weeks" — optional, just controls the page heading (see README.md).
 *
 * One-time setup:
 *  1. Create a Google Sheet with an "AnswerKey" sheet (see README.md for
 *     exact column headers). "Config" is optional but recommended.
 *  2. In that spreadsheet: Extensions → Apps Script, paste this file in.
 *  3. Deploy → New deployment → Web app.
 *       Execute as: Me
 *       Who has access: Anyone
 *  4. Copy the web app URL into CONFIG.SCRIPT_URL in weekly-hw-template.html.
 *  5. Set TEACHER_EMAIL (in DEFAULT_CONFIG below, or in the Config sheet)
 *     to where "student is stuck" alerts should go.
 *
 * Each week you only need to add rows to AnswerKey (the "Set up a new week"
 * menu command scaffolds these for you) — this file and the HTML template
 * do not need to change.
 */

// Bump this on every deploy (Deploy → Manage deployments → Edit → New
// version). Lets you open the deployed URL with no query params and confirm
// the live Web App deployment actually matches this file.
const VERSION = '2026-09-20-v3-grades';

const ANSWER_KEY_SHEET = 'AnswerKey';
const RESPONSES_PREFIX = 'Responses - ';
const REPORT_PREFIX = 'Report - ';
const TERM_OVERVIEW_PREFIX = 'Term Overview - ';
const WEEKS_SHEET = 'Weeks';
const CONFIG_SHEET = 'Config';
const ROSTER_SHEET = 'Roster';
const RESPONSES_HEADERS = ['Timestamp', 'StudentName', 'Grade', 'WeekID', 'Attempt', 'Earned', 'Possible', 'Percent', 'Passed', 'AnswersJSON', 'FeedbackJSON'];

// Rows in AnswerKey with a blank Grade belong to this grade. Keeps every
// question written before the 9/10 split working untouched.
const DEFAULT_GRADE = '9';

// Fallback values, used whenever the "Config" sheet is missing or a row in
// it is blank. Edit the Config sheet in the spreadsheet instead of this
// object where possible — it doesn't require reopening the Apps Script editor.
const DEFAULT_CONFIG = {
  PASS_THRESHOLD_PERCENT: 80,
  ATTEMPTS_BEFORE_HINTS: 3,
  RESUBMIT_COOLDOWN_SECONDS: 20,
  STUCK_ALERT_ATTEMPT: 5,
  TEACHER_EMAIL: 'kana.goat@gmail.com'
};

function doPost(e) {
  try {
    const config = getConfig();
    const data = JSON.parse(e.postData.contents);
    const studentName = (data.studentName || '').toString().trim();
    const weekId = (data.weekId || '').toString().trim();
    const grade = normalizeGrade(data.grade);
    const answers = data.answers || {};

    if (!studentName || !weekId) {
      return jsonResponse({ error: 'studentName and weekId are required.' });
    }

    // The grade decides which question set gets graded and which sheets the
    // attempt lands in, so a value that isn't a real grade must be rejected
    // rather than silently falling back and logging into the wrong group.
    if (getAllGrades().indexOf(grade) === -1) {
      return jsonResponse({ error: 'Unknown grade: ' + grade });
    }

    const key = loadAnswerKey(weekId, grade);
    if (Object.keys(key).length === 0) {
      return jsonResponse({ error: 'No answer key found for grade ' + grade + ', ' + weekId + '.' });
    }

    // Guards the read-then-write sequence below (cooldown check, attempt
    // count, log) so two near-simultaneous requests from the same student
    // (double-click, a retried fetch) can't both read "no prior attempt"
    // before either has written to Responses.
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) {
      return jsonResponse({ error: 'Server is busy, please resubmit in a moment.' });
    }

    let attempt, earned, possible, percent, passed, hintsUnlocked, feedback, solutions;
    try {
      // Single read of this week's Responses sheet — countPreviousAttempts
      // and secondsSinceLastAttempt both work off this same snapshot instead
      // of each re-reading the sheet.
      const responsesSheet = getOrCreateResponsesSheet(weekId, grade);
      const responsesRows = responsesSheet.getDataRange().getValues();

      const secondsSince = secondsSinceLastAttempt(responsesRows, studentName, weekId);
      if (secondsSince < config.RESUBMIT_COOLDOWN_SECONDS) {
        return jsonResponse({
          error: 'cooldown',
          cooldownSecondsRemaining: Math.ceil(config.RESUBMIT_COOLDOWN_SECONDS - secondsSince)
        });
      }

      attempt = countPreviousAttempts(responsesRows, studentName, weekId) + 1;

      earned = 0;
      possible = 0;
      const graded = {};

      Object.keys(key).forEach(function (qId) {
        const k = key[qId];
        possible += k.points;
        const rawAnswer = answers[qId];
        const studentAnswer = (rawAnswer !== undefined && rawAnswer !== null)
          ? rawAnswer.toString().trim()
          : '';
        const isCorrect = checkAnswer(studentAnswer, k);
        if (isCorrect) earned += k.points;
        graded[qId] = { correct: isCorrect, hint: k.hint || '', solution: k.solution || '' };
      });

      percent = possible > 0 ? Math.round((earned / possible) * 1000) / 10 : 0;
      passed = percent >= config.PASS_THRESHOLD_PERCENT;
      hintsUnlocked = !passed && attempt >= config.ATTEMPTS_BEFORE_HINTS;

      feedback = {};
      solutions = {};
      Object.keys(graded).forEach(function (qId) {
        const g = graded[qId];
        feedback[qId] = {
          correct: g.correct,
          hint: (!g.correct && hintsUnlocked) ? g.hint : ''
        };
        if (passed) solutions[qId] = g.solution;
      });

      logResponse(responsesSheet, studentName, grade, weekId, attempt, earned, possible, percent, passed, answers, feedback);
    } finally {
      lock.releaseLock();
    }

    if (!passed && attempt === config.STUCK_ALERT_ATTEMPT) {
      notifyTeacherStuckStudent(studentName, grade, weekId, attempt, percent, config);
    }

    const streak = computeStreak(studentName, weekId, passed, grade);

    updateReport(weekId, grade);
    updateTermOverview(grade);

    return jsonResponse({
      studentName: studentName,
      grade: grade,
      weekId: weekId,
      attempt: attempt,
      attemptsBeforeHints: config.ATTEMPTS_BEFORE_HINTS,
      passThreshold: config.PASS_THRESHOLD_PERCENT,
      earned: earned,
      possible: possible,
      percent: percent,
      passed: passed,
      hintsUnlocked: hintsUnlocked,
      streak: streak,
      feedback: feedback,
      solutions: solutions
    });
  } catch (err) {
    return jsonResponse({ error: 'Server error: ' + err.message });
  }
}

function doGet(e) {
  const weekId = (e.parameter && e.parameter.week) ? String(e.parameter.week).trim() : '';

  // No week asked for: a health check that also tells the page which grades
  // exist and which weeks each one has, so the sign-in gate can build its
  // dropdowns without hardcoding anything.
  if (!weekId) {
    const grades = getAllGrades();
    const weeksByGrade = {};
    grades.forEach(function (g) { weeksByGrade[g] = getAllWeekIds(g); });
    return jsonResponse({
      status: 'ok',
      version: VERSION,
      message: 'Weekly HW checker is running.',
      grades: grades,
      weeksByGrade: weeksByGrade
    });
  }

  const grade = normalizeGrade(e.parameter && e.parameter.grade);
  const questions = loadQuestionsForWeek(weekId, grade);
  if (questions.length === 0) {
    return jsonResponse({
      error: 'No questions found for grade ' + grade + ', ' + weekId + '.',
      grades: getAllGrades()
    });
  }

  return jsonResponse({
    weekId: weekId,
    grade: grade,
    title: loadWeekTitle(weekId, grade),
    questions: questions
  });
}

/**
 * Reads the "Config" sheet (Setting | Value, one setting per row) and
 * returns a config object seeded from DEFAULT_CONFIG with any present rows
 * overriding it. Missing sheet, missing rows, or blank values all fall back
 * to the default silently.
 */
function getConfig() {
  const config = {};
  Object.keys(DEFAULT_CONFIG).forEach(function (k) { config[k] = DEFAULT_CONFIG[k]; });

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEET);
  if (!sheet) return config;

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const key = String(rows[i][0]).trim();
    const value = rows[i][1];
    if (!key || !(key in DEFAULT_CONFIG) || value === '') continue;
    config[key] = (key === 'TEACHER_EMAIL') ? String(value).trim() : Number(value);
  }
  return config;
}

/**
 * Reads AnswerKey and returns the public, non-secret fields for one week's
 * questions — id, type, title, and (for "mc") the choice texts — in the
 * same order the rows appear in the sheet. CorrectAnswer/Tolerance/Points/
 * Hint/Solution are never included here; only loadAnswerKey() (used for
 * grading) reads those.
 */
function loadQuestionsForWeek(weekId, grade) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ANSWER_KEY_SHEET);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const wanted = normalizeGrade(grade);

  const idx = {
    weekId: headers.indexOf('WeekID'),
    grade: headers.indexOf('Grade'),
    questionId: headers.indexOf('QuestionID'),
    type: headers.indexOf('Type'),
    title: headers.indexOf('Title'),
    choices: headers.indexOf('Choices')
  };

  const questions = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[idx.weekId]).trim() !== weekId) continue;
    if (!rowIsGrade(row, idx.grade, wanted)) continue;

    const type = String(row[idx.type]).trim().toLowerCase();
    const question = {
      id: String(row[idx.questionId]).trim(),
      type: type,
      title: idx.title >= 0 ? String(row[idx.title] || '') : ''
    };

    if (type === 'mc') {
      const choicesRaw = idx.choices >= 0 ? String(row[idx.choices] || '') : '';
      question.choices = choicesRaw
        .split('|')
        .map(function (s) { return s.trim(); })
        .filter(function (s) { return s.length > 0; });
    }

    questions.push(question);
  }
  return questions;
}

/** The display title for a week from the "Weeks" sheet, or a generic fallback. */
function loadWeekTitle(weekId, grade) {
  const wanted = normalizeGrade(grade);
  const fallback = 'Grade ' + wanted + ' — ' + weekId;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(WEEKS_SHEET);
  if (!sheet) return fallback;

  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idx = {
    weekId: headers.indexOf('WeekID'),
    grade: headers.indexOf('Grade'),
    title: headers.indexOf('Title')
  };
  if (idx.weekId < 0 || idx.title < 0) return fallback;

  // A row whose Grade matches wins over a row that leaves Grade blank, so a
  // Weeks sheet can carry one shared title per week and override just the
  // grades that need a different one.
  let generic = '';
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idx.weekId]).trim() !== weekId) continue;
    const title = String(rows[i][idx.title] || '').trim();
    if (!title) continue;
    const rowGrade = idx.grade >= 0 ? String(rows[i][idx.grade]).trim() : '';
    if (rowGrade && normalizeGrade(rowGrade) === wanted) return title;
    if (!rowGrade && !generic) generic = title;
  }
  return generic || fallback;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Reads the AnswerKey sheet and returns the key for one week only:
 * { questionId: { type, correct: [...accepted answers...], tolerance, points, hint, solution } }
 */
function loadAnswerKey(weekId, grade) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ANSWER_KEY_SHEET);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const wanted = normalizeGrade(grade);

  const idx = {
    weekId: headers.indexOf('WeekID'),
    grade: headers.indexOf('Grade'),
    questionId: headers.indexOf('QuestionID'),
    type: headers.indexOf('Type'),
    correctAnswer: headers.indexOf('CorrectAnswer'),
    tolerance: headers.indexOf('Tolerance'),
    points: headers.indexOf('Points'),
    hint: headers.indexOf('Hint'),
    solution: headers.indexOf('Solution')
  };

  const key = {};
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[idx.weekId]).trim() !== weekId) continue;
    if (!rowIsGrade(row, idx.grade, wanted)) continue;

    const qId = String(row[idx.questionId]).trim();
    const correctRaw = String(row[idx.correctAnswer]);

    key[qId] = {
      type: String(row[idx.type]).trim().toLowerCase(), // 'numeric' | 'text' | 'mc'
      // multiple accepted answers are written in one cell separated by "|"
      correct: correctRaw.split('|').map(function (s) { return s.trim(); }),
      tolerance: row[idx.tolerance] === '' ? 0 : Number(row[idx.tolerance]),
      points: row[idx.points] === '' ? 1 : Number(row[idx.points]),
      hint: idx.hint >= 0 ? String(row[idx.hint] || '') : '',
      solution: idx.solution >= 0 ? String(row[idx.solution] || '') : ''
    };
  }
  return key;
}

/**
 * Grades one student answer against the key.
 * numeric — compares numbers within `tolerance`.
 * text/mc — case/whitespace-insensitive string match, accepts multiple
 *           acceptable phrasings separated by "|" in the key.
 */
function checkAnswer(studentAnswer, key) {
  if (key.type === 'numeric') {
    const studentNum = parseFloat(studentAnswer.replace(',', '.'));
    const correctNum = parseFloat(key.correct[0].replace(',', '.'));
    if (isNaN(studentNum) || isNaN(correctNum)) return false;
    return Math.abs(studentNum - correctNum) <= (key.tolerance || 0);
  }

  const normalize = function (s) {
    return s.toLowerCase().replace(/\s+/g, '');
  };
  const normalizedAnswer = normalize(studentAnswer);
  return key.correct.some(function (acceptable) {
    return normalize(acceptable) === normalizedAnswer;
  });
}

/**
 * Normalizes whatever arrived as a grade (URL param, sheet cell, POST body)
 * into the canonical string form used in sheet names and row filters.
 * A blank becomes DEFAULT_GRADE, so pre-split AnswerKey rows still resolve.
 */
function normalizeGrade(grade) {
  const g = (grade === undefined || grade === null) ? '' : String(grade).trim();
  if (!g) return DEFAULT_GRADE;
  // "9.0" is what a Sheets numeric cell can hand back; "Grade 9"/"9 класс"
  // are what a teacher might type into the column by hand.
  const num = /(\d+)/.exec(g);
  return num ? num[1] : g;
}

/** True when a normalized grade is a plain grade number like "9" or "10". */
function isGradeNumber(grade) {
  return /^[0-9]+$/.test(String(grade));
}

/** Distinct grades present in AnswerKey, ascending (["9", "10"]). */
function getAllGrades() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ANSWER_KEY_SHEET);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const gradeIdx = headers.indexOf('Grade');
  const weekIdx = headers.indexOf('WeekID');
  const set = {};
  for (let i = 1; i < rows.length; i++) {
    if (!String(rows[i][weekIdx]).trim()) continue;
    set[gradeIdx >= 0 ? normalizeGrade(rows[i][gradeIdx]) : DEFAULT_GRADE] = true;
  }
  const grades = Object.keys(set);
  if (grades.length === 0) grades.push(DEFAULT_GRADE);
  return grades.sort(function (a, b) { return Number(a) - Number(b); });
}

/**
 * True when `row` (from AnswerKey) belongs to `grade`. When AnswerKey has no
 * Grade column at all, every row belongs to DEFAULT_GRADE — that's what makes
 * this change backward compatible with a sheet that hasn't been migrated yet.
 */
function rowIsGrade(row, gradeIdx, grade) {
  const rowGrade = gradeIdx >= 0 ? normalizeGrade(row[gradeIdx]) : DEFAULT_GRADE;
  return rowGrade === grade;
}

/** The name of the per-grade, per-week Responses sheet. */
function responsesSheetName(weekId, grade) {
  return RESPONSES_PREFIX + normalizeGrade(grade) + ' - ' + weekId;
}

/** The name of the per-grade, per-week Report sheet. */
function reportSheetName(weekId, grade) {
  return REPORT_PREFIX + normalizeGrade(grade) + ' - ' + weekId;
}

/** The name of a grade's Term Overview sheet. */
function termOverviewSheetName(grade) {
  return TERM_OVERVIEW_PREFIX + normalizeGrade(grade);
}

/**
 * Returns the "Responses - <weekId>" sheet, creating it (with headers and
 * warning-only protection) the first time it's needed for that week.
 */
function getOrCreateResponsesSheet(weekId, grade) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const name = responsesSheetName(weekId, grade);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, RESPONSES_HEADERS.length).setValues([RESPONSES_HEADERS]);
    sheet.getRange(1, 1, 1, RESPONSES_HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    protectAutoGeneratedSheet(sheet);
  }
  return sheet;
}

/** Marks an auto-generated sheet warning-only protected, if it isn't already. */
function protectAutoGeneratedSheet(sheet) {
  if (!sheet) return;
  const already = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
  if (already.length > 0) return;
  try {
    sheet.protect()
      .setWarningOnly(true)
      .setDescription('Auto-generated by HW Checker — manual edits here will be overwritten on the next refresh.');
  } catch (err) {
    // Protection is a nice-to-have; never let it block sheet creation.
  }
}

/** Counts how many times this student has already submitted this week, from an already-loaded Responses snapshot. */
function countPreviousAttempts(rows, studentName, weekId) {
  const headers = rows[0];
  const idx = {
    studentName: headers.indexOf('StudentName'),
    weekId: headers.indexOf('WeekID')
  };
  const normalizedName = studentName.trim().toLowerCase();

  let count = 0;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[idx.weekId]).trim() === weekId &&
        String(row[idx.studentName]).trim().toLowerCase() === normalizedName) {
      count++;
    }
  }
  return count;
}

/** Seconds since this student's last submission for this week (Infinity if none yet), from an already-loaded Responses snapshot. */
function secondsSinceLastAttempt(rows, studentName, weekId) {
  const headers = rows[0];
  const idx = {
    studentName: headers.indexOf('StudentName'),
    weekId: headers.indexOf('WeekID'),
    timestamp: headers.indexOf('Timestamp')
  };
  const normalizedName = studentName.trim().toLowerCase();

  let lastTime = null;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[idx.weekId]).trim() === weekId &&
        String(row[idx.studentName]).trim().toLowerCase() === normalizedName) {
      const t = new Date(row[idx.timestamp]).getTime();
      if (lastTime === null || t > lastTime) lastTime = t;
    }
  }
  if (lastTime === null) return Infinity;
  return (Date.now() - lastTime) / 1000;
}

/** Distinct WeekIDs that exist in AnswerKey, sorted chronologically (see compareWeekIds). */
function getAllWeekIds(grade) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ANSWER_KEY_SHEET);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const weekIdx = headers.indexOf('WeekID');
  const gradeIdx = headers.indexOf('Grade');
  // Called with no grade (e.g. from a whole-spreadsheet rebuild) it still
  // returns every week across both grades, which is what those callers want.
  const wanted = (grade === undefined || grade === null || grade === '') ? null : normalizeGrade(grade);
  const set = {};
  for (let i = 1; i < rows.length; i++) {
    const wk = String(rows[i][weekIdx]).trim();
    if (!wk) continue;
    if (wanted !== null && !rowIsGrade(rows[i], gradeIdx, wanted)) continue;
    set[wk] = true;
  }
  return Object.keys(set).sort(compareWeekIds);
}

/**
 * Sorts WeekIDs by their trailing number (e.g. "week-2" before "week-10")
 * regardless of zero-padding, so streaks and chart order stay chronological
 * whether IDs are padded ("week-01") or not ("week-1"). A WeekID with no
 * trailing number falls back to a plain string compare against the other
 * side, so an unexpected format doesn't throw — it just sorts after any
 * WeekID that does have a trailing number.
 */
function compareWeekIds(a, b) {
  const numA = trailingNumber(a);
  const numB = trailingNumber(b);
  if (numA !== null && numB !== null) return numA - numB;
  if (numA !== null) return -1;
  if (numB !== null) return 1;
  return a.localeCompare(b);
}

/** The trailing integer in a string (e.g. "week-9" -> 9), or null if it doesn't end in digits. */
function trailingNumber(s) {
  const match = /(\d+)\s*$/.exec(s);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Number of consecutive weeks (ending at weekId) this student has passed,
 * reading each week's own "Responses - <weekId>" sheet. 0 if this attempt
 * did not pass.
 */
function computeStreak(studentName, weekId, passedThisAttempt, grade) {
  if (!passedThisAttempt) return 0;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const normalizedName = studentName.trim().toLowerCase();
  const sortedWeeks = getAllWeekIds(grade);
  const currentIndex = sortedWeeks.indexOf(weekId);

  let streak = 0;
  for (let i = currentIndex; i >= 0; i--) {
    const wk = sortedWeeks[i];
    if (wk === weekId) {
      streak++; // this attempt just passed
      continue;
    }
    const sheet = ss.getSheetByName(responsesSheetName(wk, grade));
    if (!sheet) break;

    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const idx = { studentName: headers.indexOf('StudentName'), passed: headers.indexOf('Passed') };

    let passedThisWeek = false;
    for (let r = 1; r < rows.length; r++) {
      if (String(rows[r][idx.studentName]).trim().toLowerCase() === normalizedName &&
          (rows[r][idx.passed] === true || rows[r][idx.passed] === 'TRUE')) {
        passedThisWeek = true;
        break;
      }
    }
    if (passedThisWeek) streak++;
    else break;
  }
  return streak;
}

function notifyTeacherStuckStudent(studentName, grade, weekId, attempt, percent, config) {
  try {
    MailApp.sendEmail({
      to: config.TEACHER_EMAIL,
      subject: 'HW Checker: ' + studentName + ' (grade ' + grade + ') is stuck on ' + weekId,
      body: studentName + ' (grade ' + grade + ') has submitted ' + attempt + ' attempts on ' + weekId +
        ' and is still at ' + percent + '% (needs ' + config.PASS_THRESHOLD_PERCENT + '%).\n\n' +
        'They might need some extra help with this week\'s material.'
    });
  } catch (err) {
    // Don't let a mail failure break grading.
  }
}

function logResponse(sheet, studentName, grade, weekId, attempt, earned, possible, percent, passed, answers, feedback) {
  sheet.appendRow([
    new Date(),
    studentName,
    normalizeGrade(grade),
    weekId,
    attempt,
    earned,
    possible,
    percent,
    passed,
    JSON.stringify(answers),
    JSON.stringify(feedback)
  ]);
}

/**
 * Rebuilds the "Report - <weekId>" sheet from every logged attempt for that
 * week's "Responses - <weekId>" sheet. Each student is represented only by
 * their best attempt (highest percent, ties broken by highest points
 * earned) — that single attempt's per-question breakdown feeds both the
 * class average and the per-question trend table below.
 */
function updateReport(weekId, grade) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config = getConfig();
  const gradeKey = normalizeGrade(grade);
  const responsesSheet = ss.getSheetByName(responsesSheetName(weekId, gradeKey));
  const rows = responsesSheet ? responsesSheet.getDataRange().getValues() : [RESPONSES_HEADERS];
  const headers = rows[0];
  const idx = {
    studentName: headers.indexOf('StudentName'),
    weekId: headers.indexOf('WeekID'),
    attempt: headers.indexOf('Attempt'),
    earned: headers.indexOf('Earned'),
    possible: headers.indexOf('Possible'),
    percent: headers.indexOf('Percent'),
    passed: headers.indexOf('Passed'),
    feedbackJSON: headers.indexOf('FeedbackJSON')
  };

  const bestByStudent = {};
  const attemptsByStudent = {};
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[idx.weekId]).trim() !== weekId) continue;

    const name = String(row[idx.studentName]).trim();
    const nameKey = name.toLowerCase();
    const percent = Number(row[idx.percent]);
    const earned = Number(row[idx.earned]);
    const existing = bestByStudent[nameKey];

    attemptsByStudent[nameKey] = (attemptsByStudent[nameKey] || 0) + 1;

    if (!existing || percent > existing.percent ||
        (percent === existing.percent && earned > existing.earned)) {
      bestByStudent[nameKey] = { name: name, row: row, percent: percent, earned: earned };
    }
  }

  const students = Object.keys(bestByStudent)
    .map(function (k) {
      const s = bestByStudent[k];
      s.totalAttempts = attemptsByStudent[k];
      return s;
    })
    .sort(function (a, b) { return a.name.localeCompare(b.name); });

  const studentCount = students.length;
  let totalPercent = 0;
  let passCount = 0;
  students.forEach(function (s) {
    totalPercent += s.percent;
    if (s.row[idx.passed] === true || s.row[idx.passed] === 'TRUE') passCount++;
  });
  const classAverage = studentCount > 0 ? Math.round((totalPercent / studentCount) * 10) / 10 : 0;

  const key = loadAnswerKey(weekId, gradeKey);
  const questionIds = Object.keys(key);
  const questionStats = {};
  questionIds.forEach(function (qId) { questionStats[qId] = { correct: 0, total: 0 }; });

  students.forEach(function (s) {
    let feedback = {};
    try { feedback = JSON.parse(s.row[idx.feedbackJSON]); } catch (err) { feedback = {}; }
    questionIds.forEach(function (qId) {
      if (feedback[qId]) {
        questionStats[qId].total++;
        if (feedback[qId].correct) questionStats[qId].correct++;
      }
    });
  });

  const reportName = reportSheetName(weekId, gradeKey);
  let report = ss.getSheetByName(reportName);
  if (!report) {
    report = ss.insertSheet(reportName);
  } else {
    report.clear();
  }
  protectAutoGeneratedSheet(report);

  const summaryRows = [
    ['Grade', gradeKey],
    ['Week', weekId],
    ['Last updated', new Date()],
    ['Students attempted', studentCount],
    ['Class average (best attempt)', classAverage + '%'],
    ['Passed (>= ' + config.PASS_THRESHOLD_PERCENT + '%)', passCount + ' / ' + studentCount]
  ];
  report.getRange(1, 1, summaryRows.length, 2).setValues(summaryRows);
  report.getRange(1, 1, summaryRows.length, 1).setFontWeight('bold');

  let r = summaryRows.length + 2;
  report.getRange(r, 1).setValue('Question trends (based on each student\'s best attempt)');
  report.getRange(r, 1).setFontWeight('bold');
  r++;

  const trendHeader = [['Question', 'Correct', 'Total', '% Correct', 'Note']];
  report.getRange(r, 1, 1, 5).setValues(trendHeader);
  report.getRange(r, 1, 1, 5).setFontWeight('bold');
  r++;

  const trendStartRow = r;
  if (questionIds.length > 0) {
    const trendRows = questionIds.map(function (qId) {
      const stats = questionStats[qId];
      const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 1000) / 10 : 0;
      let note = '';
      if (stats.total > 0 && stats.correct === stats.total) note = 'Everyone got this correct';
      else if (stats.total > 0 && stats.correct === 0) note = 'Nobody got this correct';
      else if (pct < 50) note = 'Most students struggled';
      return [qId, stats.correct, stats.total, pct + '%', note];
    });
    // Single batched write instead of one setValues() call per question —
    // with 20 questions x 15 weeks that difference is refreshAllReports()
    // finishing in seconds instead of timing out.
    report.getRange(trendStartRow, 1, trendRows.length, 5).setValues(trendRows);
    applyStruggleHighlighting(report, trendStartRow, questionIds.length);
  }
  r = trendStartRow + questionIds.length + 1;

  report.getRange(r, 1).setValue('Student results (best attempt per student)');
  report.getRange(r, 1).setFontWeight('bold');
  r++;

  const studentHeader = [['Student', 'Best %', 'Earned', 'Possible', 'Attempts used', 'Passed']];
  report.getRange(r, 1, 1, 6).setValues(studentHeader);
  report.getRange(r, 1, 1, 6).setFontWeight('bold');
  r++;

  if (students.length > 0) {
    const studentRows = students.map(function (s) {
      const row = s.row;
      return [s.name, s.percent + '%', row[idx.earned], row[idx.possible], s.totalAttempts, row[idx.passed]];
    });
    report.getRange(r, 1, studentRows.length, 6).setValues(studentRows);
  }

  report.autoResizeColumns(1, 6);
}

/**
 * Colors the "% Correct" column of the question-trend table (green when the
 * whole class nailed a question, red when most struggled) so problem
 * questions jump out without reading the Note column.
 */
function applyStruggleHighlighting(report, startRow, numQuestions) {
  const range = report.getRange(startRow, 4, numQuestions, 1);
  const rules = report.getConditionalFormatRules().filter(function (rule) {
    return rule.getRanges().every(function (r) { return r.getSheet().getName() !== report.getName(); });
  });
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(50)
    .setBackground('#f4cccc')
    .setRanges([range])
    .build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenNumberEqualTo(100)
    .setBackground('#d9ead3')
    .setRanges([range])
    .build());
  report.setConditionalFormatRules(rules);
}

/**
 * Rebuilds the "Term Overview" sheet: one row per week that has been
 * attempted (class average and pass count from each student's best
 * attempt that week, read from that week's own "Responses - <weekId>"
 * sheet), plus a line chart of the class average over time.
 */
function updateTermOverview(grade) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const gradeKey = normalizeGrade(grade);
  const weekIds = getAllWeekIds(gradeKey);
  const weekData = {};

  weekIds.forEach(function (weekId) {
    const sheet = ss.getSheetByName(responsesSheetName(weekId, gradeKey));
    if (!sheet) return;
    const rows = sheet.getDataRange().getValues();
    if (rows.length < 2) return;

    const headers = rows[0];
    const idx = {
      studentName: headers.indexOf('StudentName'),
      percent: headers.indexOf('Percent'),
      earned: headers.indexOf('Earned'),
      passed: headers.indexOf('Passed')
    };

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const name = String(row[idx.studentName]).trim().toLowerCase();
      if (!name) continue;
      const percent = Number(row[idx.percent]);
      const earned = Number(row[idx.earned]);
      const passedVal = row[idx.passed];

      if (!weekData[weekId]) weekData[weekId] = {};
      const existing = weekData[weekId][name];
      if (!existing || percent > existing.percent ||
          (percent === existing.percent && earned > existing.earned)) {
        weekData[weekId][name] = { percent: percent, passed: (passedVal === true || passedVal === 'TRUE') };
      }
    }
  });

  const summary = weekIds
    .filter(function (wk) { return !!weekData[wk]; })
    .map(function (wk) {
      const students = Object.keys(weekData[wk]).map(function (k) { return weekData[wk][k]; });
      const count = students.length;
      const avg = count > 0
        ? Math.round((students.reduce(function (s, x) { return s + x.percent; }, 0) / count) * 10) / 10
        : 0;
      const passCount = students.filter(function (x) { return x.passed; }).length;
      return { weekId: wk, students: count, average: avg, passed: passCount };
    });

  const overviewName = termOverviewSheetName(gradeKey);
  let sheet = ss.getSheetByName(overviewName);
  if (!sheet) {
    sheet = ss.insertSheet(overviewName);
  } else {
    sheet.getCharts().forEach(function (chart) { sheet.removeChart(chart); });
    sheet.clear();
  }
  protectAutoGeneratedSheet(sheet);

  sheet.getRange(1, 1, 1, 4).setValues([['Week', 'Students', 'Class Average %', 'Passed']]);
  sheet.getRange(1, 1, 1, 4).setFontWeight('bold');

  if (summary.length > 0) {
    const dataRows = summary.map(function (s) { return [s.weekId, s.students, s.average, s.passed]; });
    sheet.getRange(2, 1, dataRows.length, 4).setValues(dataRows);

    const chart = sheet.newChart()
      .setChartType(Charts.ChartType.LINE)
      .addRange(sheet.getRange(2, 1, summary.length, 1))
      .addRange(sheet.getRange(2, 3, summary.length, 1))
      .setPosition(2, 6, 0, 0)
      .setOption('title', 'Grade ' + gradeKey + ' — Class Average Over Time')
      .setOption('legend', { position: 'none' })
      .setOption('vAxis', { title: 'Average %', minValue: 0, maxValue: 100 })
      .setOption('hAxis', { title: 'Week' })
      .build();
    sheet.insertChart(chart);
  }

  sheet.autoResizeColumns(1, 4);
}

/**
 * Restricts a range of AnswerKey's Type column to numeric/text/mc via a
 * dropdown, so a typo there can't silently break grading for that question.
 */
function applyTypeValidation(sheet, startRow, numRows) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const col = headers.indexOf('Type') + 1;
  if (col <= 0) return;
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['numeric', 'text', 'mc'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(startRow, col, numRows, 1).setDataValidation(rule);
}

/**
 * Adds the "HW Checker" menu when the spreadsheet is opened. Simple trigger —
 * runs automatically, no deployment or extra authorization needed. If you
 * just added this function, reopen the spreadsheet once for the menu to show up.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('HW Checker')
    .addItem('Set up a new week', 'newWeekSetup')
    .addItem('Refresh all reports', 'refreshAllReports')
    .addSeparator()
    .addItem('First-time setup: 1) Init structure', 'initializeStructure')
    .addItem('First-time setup: 2) Rebuild reports batch 1', 'refreshReportsBatch1')
    .addItem('First-time setup: 3) Rebuild reports batch 2', 'refreshReportsBatch2')
    .addItem('First-time setup: 4) Rebuild reports batch 3', 'refreshReportsBatch3')
    .addItem('First-time setup: 5) Update term overview', 'updateAllTermOverviews')
    .addItem('First-time setup: 6) Create weekly filter views', 'createWeeklyFilterViews')
    .addItem('First-time setup: 7) Fix filter view sort order', 'renumberWeeklyFilterViews')
    .addToUi();
}

/**
 * Installed-free onEdit trigger: whenever a "Responses - <weekId>" sheet is
 * hand-edited (or a script other than this one's own doPost writes to it),
 * immediately rebuild that week's Report and the Term Overview — no need to
 * run "Refresh all reports" manually anymore. Wrapped defensively so a
 * mid-edit glitch can never break the sheet itself.
 */
function onEdit(e) {
  try {
    if (!e || !e.range) return;
    const sheetName = e.range.getSheet().getName();
    if (sheetName.indexOf(RESPONSES_PREFIX) !== 0) return;
    // "Responses - 9 - week-01" -> grade "9", week "week-01". Anything that
    // doesn't split cleanly is a sheet we don't own, so leave it alone.
    const rest = sheetName.substring(RESPONSES_PREFIX.length);
    const sep = rest.indexOf(' - ');
    if (sep === -1) return;
    const grade = normalizeGrade(rest.substring(0, sep));
    const weekId = rest.substring(sep + 3).trim();
    if (!weekId) return;
    updateReport(weekId, grade);
    updateTermOverview(grade);
  } catch (err) {
    // Never let a formatting/edit hiccup break the sheet.
  }
}

/**
 * Recomputes every "Report - <weekId>" sheet and "Term Overview" from each
 * week's Responses sheet's current contents. The onEdit trigger above now
 * does this automatically after manual edits — this menu item is kept as a
 * manual fallback (e.g. right after restoring from version history).
 */
function refreshAllReports() {
  const grades = getAllGrades();
  let total = 0;
  grades.forEach(function (grade) {
    getAllWeekIds(grade).forEach(function (weekId) {
      updateReport(weekId, grade);
      total++;
    });
    updateTermOverview(grade);
  });

  const msg = 'Reports refreshed for ' + total + ' grade-week(s) across ' + grades.length + ' grade(s).';
  try {
    SpreadsheetApp.getUi().alert(msg);
  } catch (err) {
    Logger.log(msg);
  }
}

/**
 * Menu command: scaffolds a new week — appends 20 blank question rows to
 * AnswerKey (WeekID/QuestionID/Points filled in, everything else left for
 * you to fill in, with a dropdown on Type) and creates the matching
 * "Responses - <weekId>" sheet ahead of time.
 */
function newWeekSetup() {
  const ui = SpreadsheetApp.getUi();

  const gradeResp = ui.prompt('Set up a new week',
    'Which grade is this week for? (' + getAllGrades().join(' / ') + ')',
    ui.ButtonSet.OK_CANCEL);
  if (gradeResp.getSelectedButton() !== ui.Button.OK) return;
  const grade = normalizeGrade(gradeResp.getResponseText());
  if (!isGradeNumber(grade)) {
    ui.alert('"' + gradeResp.getResponseText() + '" is not a grade number. Enter e.g. 9 or 10.');
    return;
  }

  // Week numbering runs per grade, so grade 10 can start at week-01 even
  // while grade 9 is already at week-13.
  const existing = getAllWeekIds(grade);
  const numbers = existing.map(trailingNumber).filter(function (n) { return n !== null; });
  const nextNum = numbers.length > 0 ? Math.max.apply(null, numbers) + 1 : 1;
  const suggested = 'week-' + (nextNum < 10 ? '0' + nextNum : String(nextNum));

  const resp = ui.prompt('Set up a new week',
    'WeekID for the new grade ' + grade + ' week (leave blank to use ' + suggested + '):',
    ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  const weekId = resp.getResponseText().trim() || suggested;

  if (existing.indexOf(weekId) !== -1) {
    ui.alert('Grade ' + grade + ' already has questions for "' + weekId + '" in AnswerKey. Pick a different WeekID.');
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const answerSheet = ss.getSheetByName(ANSWER_KEY_SHEET);
  const headers = answerSheet.getRange(1, 1, 1, answerSheet.getLastColumn()).getValues()[0];
  const gradeCol = headers.indexOf('Grade');
  if (gradeCol < 0) {
    ui.alert('AnswerKey has no "Grade" column yet. Run "First-time setup: 1) Init structure" once, then try again.');
    return;
  }

  // Written by header position rather than a fixed column order, so
  // rearranging AnswerKey's columns can't silently scramble new rows.
  const startRow = answerSheet.getLastRow() + 1;
  const newRows = [];
  for (let i = 1; i <= 20; i++) {
    const row = [];
    for (let c = 0; c < headers.length; c++) row.push('');
    row[headers.indexOf('WeekID')] = weekId;
    row[gradeCol] = grade;
    row[headers.indexOf('QuestionID')] = 'q' + i;
    row[headers.indexOf('Points')] = 1;
    newRows.push(row);
  }
  answerSheet.getRange(startRow, 1, newRows.length, headers.length).setValues(newRows);
  applyTypeValidation(answerSheet, startRow, newRows.length);

  getOrCreateResponsesSheet(weekId, grade);

  ui.alert(
    'Set up grade ' + grade + ', ' + weekId + ':\n\n' +
    '• 20 blank question rows added to AnswerKey (rows ' + startRow + '–' + (startRow + 19) + ') — fill in Type, Title, CorrectAnswer, Hint, and Solution for each.\n' +
    '• A "' + responsesSheetName(weekId, grade) + '" sheet is ready for submissions.\n\n' +
    'Once filled in, students reach it at ?week=' + weekId + '&grade=' + grade + '.'
  );
}

/**
 * One-time structure migration/setup — run this once from the Apps Script
 * editor (select initializeStructure in the function dropdown, then Run)
 * after pasting in this version of the script. Safe to re-run; every step
 * is a no-op if already done.
 *  1. Creates the "Config" sheet (with DEFAULT_CONFIG values) if missing.
 *  2. Migrates any legacy single "Responses" sheet's rows into the new
 *     per-week "Responses - <weekId>" sheets, then removes the legacy sheet.
 *  3. Applies warning-only protection to existing Report/Term Overview/
 *     Responses sheets.
 *  4. Applies the Type-column dropdown to existing AnswerKey rows.
 */
function initializeStructure() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 0. AnswerKey "Grade" column. Added at the end so existing columns keep
  //    their positions, and backfilled with DEFAULT_GRADE because every
  //    question written before the 9/10 split is a grade 9 question.
  const answerKey = ss.getSheetByName(ANSWER_KEY_SHEET);
  const akHeaders = answerKey.getRange(1, 1, 1, answerKey.getLastColumn()).getValues()[0];
  if (akHeaders.indexOf('Grade') === -1) {
    const col = akHeaders.length + 1;
    answerKey.getRange(1, col).setValue('Grade').setFontWeight('bold');
    const lastRow = answerKey.getLastRow();
    if (lastRow > 1) {
      const fill = [];
      for (let i = 2; i <= lastRow; i++) fill.push([DEFAULT_GRADE]);
      answerKey.getRange(2, col, fill.length, 1).setValues(fill);
    }
    Logger.log('Added Grade column to AnswerKey and backfilled ' + Math.max(0, lastRow - 1) + ' row(s) as grade ' + DEFAULT_GRADE + '.');
  }

  // 0b. Rename pre-split sheets ("Responses - week-01" -> "Responses - 9 -
  //     week-01") so their history follows them into the grade-aware naming.
  ss.getSheets().forEach(function (sheet) {
    const nm = sheet.getName();
    [RESPONSES_PREFIX, REPORT_PREFIX].forEach(function (prefix) {
      if (nm.indexOf(prefix) !== 0) return;
      const rest = nm.substring(prefix.length);
      // Already migrated names contain " - " after the grade; skip those.
      if (rest.indexOf(' - ') !== -1) return;
      const renamed = prefix + DEFAULT_GRADE + ' - ' + rest;
      if (ss.getSheetByName(renamed)) return;
      sheet.setName(renamed);
      Logger.log('Renamed "' + nm + '" -> "' + renamed + '".');
    });
  });

  const legacyOverview = ss.getSheetByName('Term Overview');
  if (legacyOverview && !ss.getSheetByName(termOverviewSheetName(DEFAULT_GRADE))) {
    legacyOverview.setName(termOverviewSheetName(DEFAULT_GRADE));
    Logger.log('Renamed "Term Overview" -> "' + termOverviewSheetName(DEFAULT_GRADE) + '".');
  }

  // 1. Config sheet.
  let config = ss.getSheetByName(CONFIG_SHEET);
  if (!config) {
    config = ss.insertSheet(CONFIG_SHEET);
    config.getRange(1, 1, 1, 2).setValues([['Setting', 'Value']]);
    config.getRange(1, 1, 1, 2).setFontWeight('bold');
    const rows = Object.keys(DEFAULT_CONFIG).map(function (k) { return [k, DEFAULT_CONFIG[k]]; });
    config.getRange(2, 1, rows.length, 2).setValues(rows);
    config.setFrozenRows(1);
    config.autoResizeColumns(1, 2);
    Logger.log('Created Config sheet.');
  }

  // 2. Migrate legacy "Responses" sheet, if it still exists.
  const legacy = ss.getSheetByName('Responses');
  if (legacy) {
    const rows = legacy.getDataRange().getValues();
    if (rows.length > 1) {
      const headers = rows[0];
      const weekIdx = headers.indexOf('WeekID');
      const byWeek = {};
      for (let i = 1; i < rows.length; i++) {
        const wk = String(rows[i][weekIdx]).trim();
        if (!wk) continue;
        if (!byWeek[wk]) byWeek[wk] = [];
        byWeek[wk].push(rows[i]);
      }
      Object.keys(byWeek).forEach(function (weekId) {
        const sheet = getOrCreateResponsesSheet(weekId, DEFAULT_GRADE);
        sheet.getRange(sheet.getLastRow() + 1, 1, byWeek[weekId].length, headers.length)
          .setValues(byWeek[weekId]);
        Logger.log('Migrated ' + byWeek[weekId].length + ' row(s) into ' + responsesSheetName(weekId, DEFAULT_GRADE) + '.');
      });
    }
    ss.deleteSheet(legacy);
    Logger.log('Removed legacy Responses sheet.');
  }

  // 3. Protect existing auto-generated sheets.
  getAllGrades().forEach(function (grade) {
    getAllWeekIds(grade).forEach(function (weekId) {
      protectAutoGeneratedSheet(ss.getSheetByName(reportSheetName(weekId, grade)));
      protectAutoGeneratedSheet(ss.getSheetByName(responsesSheetName(weekId, grade)));
    });
    protectAutoGeneratedSheet(ss.getSheetByName(termOverviewSheetName(grade)));
  });

  // 4. Type-column validation on existing AnswerKey rows.
  const answerSheet = ss.getSheetByName(ANSWER_KEY_SHEET);
  const lastRow = answerSheet.getLastRow();
  if (lastRow > 1) applyTypeValidation(answerSheet, 2, lastRow - 1);

  Logger.log('initializeStructure complete. Now run refreshReportsBatch1, ' +
    'refreshReportsBatch2, refreshReportsBatch3, then updateTermOverview ' +
    '(each separately, from the function dropdown) to rebuild all reports ' +
    'without hitting the 6-minute execution limit.');
}

/**
 * refreshAllReports() rebuilds all 15 weeks' reports in one execution, which
 * can exceed Apps Script's 6-minute limit the first time (empty reports,
 * full sheet creation + formatting for every week). These batch functions
 * split that same work into three manual runs instead — run each one from
 * the function dropdown, then run updateAllTermOverviews() separately. Only
 * needed for this kind of first-time bulk rebuild; the onEdit trigger and
 * normal submissions call updateReport() for a single week at a time and
 * never come close to the limit.
 */
function refreshReportsBatch1() { refreshReportsBatch(0, 10); }
function refreshReportsBatch2() { refreshReportsBatch(10, 10); }
function refreshReportsBatch3() { refreshReportsBatch(20, 10); }

/** Rebuilds the Term Overview sheet for every grade (menu step 5). */
function updateAllTermOverviews() {
  const grades = getAllGrades();
  grades.forEach(function (grade) { updateTermOverview(grade); });
  Logger.log('Term Overview rebuilt for grade(s): ' + grades.join(', '));
}

function refreshReportsBatch(startIndex, count) {
  const pairs = [];
  getAllGrades().forEach(function (grade) {
    getAllWeekIds(grade).forEach(function (weekId) { pairs.push({ grade: grade, weekId: weekId }); });
  });
  const slice = pairs.slice(startIndex, startIndex + count);
  slice.forEach(function (p) {
    updateReport(p.weekId, p.grade);
    Logger.log('Report refreshed for grade ' + p.grade + ', ' + p.weekId + '.');
  });
  Logger.log('Batch complete: ' + slice.map(function (p) { return p.grade + '/' + p.weekId; }).join(', ') +
    ' (' + pairs.length + ' grade-week pairs in total).');
}

/**
 * Creates a saved Filter View per week in AnswerKey ("Week 1 (week-01)",
 * "Week 2 (week-02)", ...) so you can switch which week's 20 rows are
 * visible from the filter-view dropdown in the toolbar, without touching
 * the underlying data. Run once from the Apps Script editor.
 *
 * Requires the "Google Sheets API" advanced service enabled first:
 * in the Apps Script editor, Services (+) → Google Sheets API → Add.
 *
 * Safe to re-run — skips any week that already has a filter view whose
 * title matches.
 */
function createWeeklyFilterViews() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(ANSWER_KEY_SHEET);
  const sheetId = sheet.getSheetId();
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const weekIdx = headers.indexOf('WeekID');
  const gradeIdx = headers.indexOf('Grade');
  const numCols = headers.length;
  const numRows = rows.length;

  const existing = Sheets.Spreadsheets.get(ss.getId(), { fields: 'sheets(filterViews(title))' });
  const existingTitles = {};
  (existing.sheets || []).forEach(function (s) {
    (s.filterViews || []).forEach(function (fv) { existingTitles[fv.title] = true; });
  });

  const requests = [];
  getAllGrades().forEach(function (grade) {
    getAllWeekIds(grade).forEach(function (weekId, i) {
      const title = filterViewTitle(i + 1, weekId, grade);
      if (existingTitles[title]) return;

      const criteria = {};
      criteria[weekIdx] = { condition: { type: 'TEXT_EQ', values: [{ userEnteredValue: weekId }] } };
      if (gradeIdx >= 0) {
        criteria[gradeIdx] = { condition: { type: 'TEXT_EQ', values: [{ userEnteredValue: grade }] } };
      }

      requests.push({
        addFilterView: {
          filter: {
            title: title,
            range: {
              sheetId: sheetId,
              startRowIndex: 0,
              endRowIndex: numRows,
              startColumnIndex: 0,
              endColumnIndex: numCols
            },
            criteria: criteria
          }
        }
      });
    });
  });

  if (requests.length > 0) {
    Sheets.Spreadsheets.batchUpdate({ requests: requests }, ss.getId());
    Logger.log('Created ' + requests.length + ' filter view(s).');
  } else {
    Logger.log('All filter views already exist — nothing to do.');
  }
}

/**
 * "Week N (week-NN)" titles with an unpadded N sort alphabetically in the
 * filter-view popup, not numerically — "Week 10" ends up listed before
 * "Week 2". Zero-padding N to two digits makes alphabetical order match
 * numeric order for any class up to 99 weeks long.
 */
function filterViewTitle(weekNumber, weekId, grade) {
  const padded = weekNumber < 10 ? '0' + weekNumber : String(weekNumber);
  return 'G' + normalizeGrade(grade) + ' Week ' + padded + ' (' + weekId + ')';
}

/**
 * One-time fix for filter views already created with the old unpadded
 * "Week N (...)" titles (from before filterViewTitle() zero-padded them) —
 * renames them in place so they sort correctly in the popup. Safe to re-run;
 * already-padded titles are left alone. Run once from the Apps Script editor
 * after updating this file, if createWeeklyFilterViews() was run before this
 * fix landed.
 */
function renumberWeeklyFilterViews() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const existing = Sheets.Spreadsheets.get(ss.getId(), { fields: 'sheets(filterViews(filterViewId,title))' });

  const requests = [];
  (existing.sheets || []).forEach(function (s) {
    (s.filterViews || []).forEach(function (fv) {
      const match = /^(?:G([0-9]+) )?Week ([0-9]+) \((week-.+)\)$/.exec(fv.title || '');
      if (!match) return;
      const newTitle = filterViewTitle(parseInt(match[2], 10), match[3], match[1] || DEFAULT_GRADE);
      if (newTitle === fv.title) return;
      requests.push({
        updateFilterView: {
          filter: { filterViewId: fv.filterViewId, title: newTitle },
          fields: 'title'
        }
      });
    });
  });

  if (requests.length > 0) {
    Sheets.Spreadsheets.batchUpdate({ requests: requests }, ss.getId());
    Logger.log('Renamed ' + requests.length + ' filter view(s) to zero-padded titles.');
  } else {
    Logger.log('All filter view titles are already zero-padded — nothing to do.');
  }
}
