/**
 * Weekly HW Checker — backend (Google Apps Script)
 *
 * Что делает:
 *  - Принимает ответы ученика (POST), сверяет их с ключом ответов на листе
 *    "AnswerKey" ЭТОГО ЖЕ Google Sheet (сервер, ученик её не видит),
 *    пишет результат на лист "Responses" и возвращает JSON с оценкой
 *    и разбором по каждому вопросу.
 *
 * Настройка (один раз):
 *  1. Создай Google Sheet с двумя листами: "AnswerKey" и "Responses"
 *     (см. README.md — там точные заголовки колонок).
 *  2. В этой таблице: Extensions → Apps Script, вставь сюда этот файл.
 *  3. Deploy → New deployment → Web app.
 *       Execute as: Me
 *       Who has access: Anyone
 *  4. Скопируй URL веб-приложения — он идёт в CONFIG.SCRIPT_URL
 *     в weekly-hw-template.html.
 *
 * Каждую неделю нужно менять только СОДЕРЖИМОЕ листа AnswerKey
 * (новые строки с новым WeekID) — этот файл трогать не нужно.
 */

const ANSWER_KEY_SHEET = 'AnswerKey';
const RESPONSES_SHEET = 'Responses';
const PASS_THRESHOLD_PERCENT = 80;

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const studentName = (data.studentName || '').toString().trim();
    const weekId = (data.weekId || '').toString().trim();
    const answers = data.answers || {};

    if (!studentName || !weekId) {
      return jsonResponse({ error: 'studentName и weekId обязательны' });
    }

    const key = loadAnswerKey(weekId);
    if (Object.keys(key).length === 0) {
      return jsonResponse({ error: 'Нет ключа ответов для weekId: ' + weekId });
    }

    let earned = 0;
    let possible = 0;
    const feedback = {};

    Object.keys(key).forEach(function (qId) {
      const k = key[qId];
      possible += k.points;
      const rawAnswer = answers[qId];
      const studentAnswer = (rawAnswer !== undefined && rawAnswer !== null)
        ? rawAnswer.toString().trim()
        : '';
      const isCorrect = checkAnswer(studentAnswer, k);
      if (isCorrect) earned += k.points;
      feedback[qId] = {
        correct: isCorrect,
        hint: isCorrect ? '' : (k.hint || '')
      };
    });

    const percent = possible > 0 ? Math.round((earned / possible) * 1000) / 10 : 0;

    logResponse(studentName, weekId, earned, possible, percent, answers, feedback);

    return jsonResponse({
      studentName: studentName,
      weekId: weekId,
      earned: earned,
      possible: possible,
      percent: percent,
      passed: percent >= PASS_THRESHOLD_PERCENT,
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
 * Читает лист AnswerKey и возвращает объект-ключ только для нужной недели:
 * { questionId: { type, correct: [...варианты...], tolerance, points, hint } }
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
      // несколько допустимых вариантов ответа пишутся в ячейке через "|"
      correct: correctRaw.split('|').map(function (s) { return s.trim(); }),
      tolerance: row[idx.tolerance] === '' ? 0 : Number(row[idx.tolerance]),
      points: row[idx.points] === '' ? 1 : Number(row[idx.points]),
      hint: idx.hint >= 0 ? String(row[idx.hint] || '') : ''
    };
  }
  return key;
}

/**
 * Сверяет ответ ученика с ключом.
 * numeric — сравнение чисел с допуском (tolerance).
 * text/mc — сравнение строк без учёта регистра/пробелов,
 *           допускает несколько правильных формулировок через "|" в ключе.
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

function logResponse(studentName, weekId, earned, possible, percent, answers, feedback) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(RESPONSES_SHEET);
  sheet.appendRow([
    new Date(),
    studentName,
    weekId,
    earned,
    possible,
    percent,
    JSON.stringify(answers),
    JSON.stringify(feedback)
  ]);
}
