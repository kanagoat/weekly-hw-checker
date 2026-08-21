/**
 * Weekly HW Checker — backend (Google Apps Script)
 *
 * What it does:
 *  - Accepts a student's answers (POST), grades them against the "AnswerKey"
 *    sheet in this same spreadsheet (server-side, the student never sees it),
 *    logs every attempt to "Responses", and returns a JSON result with the
 *    score and a per-question breakdown.
 *  - Hints for wrong answers only unlock once a student has reached
 *    ATTEMPTS_BEFORE_HINTS attempts and is still below PASS_THRESHOLD_PERCENT.
 *  - After every submission, regenerates a per-week report sheet named
 *    "Report - <weekId>" with the class average, pass count, per-question
 *    trend breakdown, and each student's best attempt.
 *
 * One-time setup:
 *  1. Create a Google Sheet with two sheets: "AnswerKey" and "Responses"
 *     (see README.md for exact column headers).
 *  2. In that spreadsheet: Extensions → Apps Script, paste this file in.
 *  3. Deploy → New deployment → Web app.
 *       Execute as: Me
 *       Who has access: Anyone
 *  4. Copy the web app URL into CONFIG.SCRIPT_URL in weekly-hw-template.html.
 *
 * Each week you only need to add new rows to AnswerKey (a new WeekID) —
 * this file does not need to change.
 */

const ANSWER_KEY_SHEET = 'AnswerKey';
const RESPONSES_SHEET = 'Responses';
const PASS_THRESHOLD_PERCENT = 80;
const ATTEMPTS_BEFORE_HINTS = 3;

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const studentName = (data.studentName || '').toString().trim();
    const weekId = (data.weekId || '').toString().trim();
    const answers = data.answers || {};

    if (!studentName || !weekId) {
      return jsonResponse({ error: 'studentName and weekId are required.' });
    }

    const key = loadAnswerKey(weekId);
    if (Object.keys(key).length === 0) {
      return jsonResponse({ error: 'No answer key found for weekId: ' + weekId });
    }

    const attempt = countPreviousAttempts(studentName, weekId) + 1;

    let earned = 0;
    let possible = 0;
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
      graded[qId] = { correct: isCorrect, hint: k.hint || '' };
    });

    const percent = possible > 0 ? Math.round((earned / possible) * 1000) / 10 : 0;
    const passed = percent >= PASS_THRESHOLD_PERCENT;
    const hintsUnlocked = !passed && attempt >= ATTEMPTS_BEFORE_HINTS;

    const feedback = {};
    Object.keys(graded).forEach(function (qId) {
      const g = graded[qId];
      feedback[qId] = {
        correct: g.correct,
        hint: (!g.correct && hintsUnlocked) ? g.hint : ''
      };
    });

    logResponse(studentName, weekId, attempt, earned, possible, percent, passed, answers, feedback);
    updateReport(weekId);

    return jsonResponse({
      studentName: studentName,
      weekId: weekId,
      attempt: attempt,
      attemptsBeforeHints: ATTEMPTS_BEFORE_HINTS,
      passThreshold: PASS_THRESHOLD_PERCENT,
      earned: earned,
      possible: possible,
      percent: percent,
      passed: passed,
      hintsUnlocked: hintsUnlocked,
      feedback: feedback
    });
  } catch (err) {
    return jsonResponse({ error: 'Server error: ' + err.message });
  }
}

function doGet(e) {
  return jsonResponse({ status: 'ok', message: 'Weekly HW checker is running.' });
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Reads the AnswerKey sheet and returns the key for one week only:
 * { questionId: { type, correct: [...accepted answers...], tolerance, points, hint } }
 */
function loadAnswerKey(weekId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ANSWER_KEY_SHEET);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];

  const idx = {
    weekId: headers.indexOf('WeekID'),
    questionId: headers.indexOf('QuestionID'),
    type: headers.indexOf('Type'),
    correctAnswer: headers.indexOf('CorrectAnswer'),
    tolerance: headers.indexOf('Tolerance'),
    points: headers.indexOf('Points'),
    hint: headers.indexOf('Hint')
  };

  const key = {};
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[idx.weekId]).trim() !== weekId) continue;

    const qId = String(row[idx.questionId]).trim();
    const correctRaw = String(row[idx.correctAnswer]);

    key[qId] = {
      type: String(row[idx.type]).trim().toLowerCase(), // 'numeric' | 'text' | 'mc'
      // multiple accepted answers are written in one cell separated by "|"
      correct: correctRaw.split('|').map(function (s) { return s.trim(); }),
      tolerance: row[idx.tolerance] === '' ? 0 : Number(row[idx.tolerance]),
      points: row[idx.points] === '' ? 1 : Number(row[idx.points]),
      hint: idx.hint >= 0 ? String(row[idx.hint] || '') : ''
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

/** Counts how many times this student has already submitted this week. */
function countPreviousAttempts(studentName, weekId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(RESPONSES_SHEET);
  const rows = sheet.getDataRange().getValues();
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

function logResponse(studentName, weekId, attempt, earned, possible, percent, passed, answers, feedback) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(RESPONSES_SHEET);
  sheet.appendRow([
    new Date(),
    studentName,
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
 * week. Each student is represented only by their best attempt (highest
 * percent, ties broken by highest points earned) — that single attempt's
 * per-question breakdown feeds both the class average and the per-question
 * trend table below.
 */
function updateReport(weekId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const responsesSheet = ss.getSheetByName(RESPONSES_SHEET);
  const rows = responsesSheet.getDataRange().getValues();
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

  const key = loadAnswerKey(weekId);
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

  const reportSheetName = 'Report - ' + weekId;
  let report = ss.getSheetByName(reportSheetName);
  if (!report) {
    report = ss.insertSheet(reportSheetName);
  } else {
    report.clear();
  }

  const summaryRows = [
    ['Week', weekId],
    ['Last updated', new Date()],
    ['Students attempted', studentCount],
    ['Class average (best attempt)', classAverage + '%'],
    ['Passed (>= ' + PASS_THRESHOLD_PERCENT + '%)', passCount + ' / ' + studentCount]
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

  questionIds.forEach(function (qId) {
    const stats = questionStats[qId];
    const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 1000) / 10 : 0;
    let note = '';
    if (stats.total > 0 && stats.correct === stats.total) note = 'Everyone got this correct';
    else if (stats.total > 0 && stats.correct === 0) note = 'Nobody got this correct';
    else if (pct < 50) note = 'Most students struggled';
    report.getRange(r, 1, 1, 5).setValues([[qId, stats.correct, stats.total, pct + '%', note]]);
    r++;
  });
  r++;

  report.getRange(r, 1).setValue('Student results (best attempt per student)');
  report.getRange(r, 1).setFontWeight('bold');
  r++;

  const studentHeader = [['Student', 'Best %', 'Earned', 'Possible', 'Attempts used', 'Passed']];
  report.getRange(r, 1, 1, 6).setValues(studentHeader);
  report.getRange(r, 1, 1, 6).setFontWeight('bold');
  r++;

  students.forEach(function (s) {
    const row = s.row;
    report.getRange(r, 1, 1, 6).setValues([[
      s.name,
      s.percent + '%',
      row[idx.earned],
      row[idx.possible],
      s.totalAttempts,
      row[idx.passed]
    ]]);
    r++;
  });

  report.autoResizeColumns(1, 6);
}
