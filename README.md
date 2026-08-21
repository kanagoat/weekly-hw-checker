# Weekly HW Checker — what it is and how to run it

Idea: once a week you take `weekly-hw-template.html`, copy it into a new file,
change the title and the list of questions (`QUESTIONS`), and the answers get
checked NOT in the student's browser (like a first pass with a screenshot
would), but on the server — in a Google Apps Script bound to your Google
Sheet. So the grade can't be faked via DevTools: the student physically
never sees the correct answers or the checking logic — only the question and
an input box.

The student sees their result immediately on the page (percentage + a
breakdown per question), and a row with their name, score, and submission
time automatically appears in your spreadsheet — no screenshots, no manual
grading.

On top of that:
- **Hints stay locked for the first two attempts.** A wrong answer only gets
  a hint once a student has reached their 3rd attempt on that week and is
  still below the 80% pass floor.
- **Every submission is logged as a separate attempt**, so a student can
  retry as many times as they like.
- **A live class report** ("Report - <weekId>") is rebuilt automatically
  after every submission for that week, showing the class average, how many
  students passed, and which questions the class is struggling with.

## 1. One-time setup (~20–30 minutes)

### Step 1 — create a Google Sheet
Create a new spreadsheet, e.g. "HW Checker — Year 11 Maths". Inside, create
two sheets:

**`AnswerKey` sheet** (the answer key, students never see it) — headers in row 1:

| WeekID | QuestionID | Type | CorrectAnswer | Tolerance | Points | Hint |
|---|---|---|---|---|---|---|
| week-01 | q1 | numeric | 2.5 | 0.01 | 1 | Use the quadratic formula with a=2, b=−3, c=−5, then pick the positive root. |
| week-01 | q2 | text | 6x-4\|-4+6x | | 1 | Differentiate term by term: 6x, −4, 0. |
| week-01 | q3 | mc | b | | 1 | (2x³)² = 2² × (x³)² = 4x⁶. |
| week-01 | q4 | numeric | 4 | 0 | 1 | Add the two equations to eliminate y. |

Column notes:
- **Type**: `numeric` (a number, checked against `Tolerance`), `text` (a
  string, case/whitespace-insensitive), or `mc` (multiple choice — checked
  like text against the chosen option's value, e.g. `a`/`b`/`c`).
- **CorrectAnswer**: for `text`/`mc` you can list several accepted answers
  separated by `|`, e.g. `6x-4|-4+6x` — either form is accepted.
- **Tolerance**: `numeric` only — allowed margin of error (0 = exact match,
  0.01 if the question involves decimals).
- **Hint**: a short hint the student sees once hints unlock for that
  question on that attempt (see below) — this is the "error breakdown".

**`Responses` sheet** (submission log, filled in automatically) — headers:

`Timestamp | StudentName | WeekID | Attempt | Earned | Possible | Percent | Passed | AnswersJSON | FeedbackJSON`

The script appends rows here itself — you never type into it by hand.

**`Report - <weekId>` sheets** are created automatically the first time a
student submits for that week (e.g. `Report - week-01`) and are fully
rebuilt after every later submission for that week — you don't create these
yourself, and you shouldn't hand-edit them since they get overwritten.

### Step 2 — connect Apps Script
In that same spreadsheet: **Extensions → Apps Script**. Delete the default
content, paste in the whole `Code.gs` file. Save (the floppy-disk icon).

### Step 3 — deploy as a web app
**Deploy → New deployment** → type **Web app**.
- Execute as: **Me**
- Who has access: **Anyone**

Click Deploy, approve access (Google will ask about permissions on the
sheet — normal, the script needs to read/write it). Copy the **web app
URL** — you'll need it in the HTML template.

### Step 4 — put the URL in the HTML
Open `weekly-hw-template.html`, and in the `CONFIG` block paste the copied
URL into `SCRIPT_URL`.

## 2. What to do every week

1. Copy `weekly-hw-template.html` into a new file (e.g. `week-02.html`).
2. In `CONFIG`, change `WEEK_ID` (e.g. `"week-02"`) and `PAGE_TITLE`.
3. Edit the `QUESTIONS` array — question text and `type` (correct answers
   are **not** written here — only in the Google Sheet).
4. Add new rows to `AnswerKey` with the same `WeekID` as in `CONFIG`, and the
   correct answers/hints for each `QuestionID`.
5. Send the HTML file to students (see hosting notes below).

`Code.gs` itself doesn't need to change from week to week.

## 3. Hints and multiple attempts

- A student can submit the same week's homework as many times as they want.
- The first 2 attempts never show a hint, even for wrong answers — only the
  score and correct/incorrect marks.
- From the 3rd attempt onward, if the student is still below 80%, wrong
  answers show their hint.
- Once a student reaches 80% they've passed — no hints are shown or needed.
- The attempt count is per student name (case-insensitive, trimmed) and per
  `WeekID`, so make sure students spell their name consistently.

## 4. Reading the class report

After each submission, the sheet `Report - <weekId>` is rebuilt from
scratch, using **only each student's best attempt** (their highest scoring
submission for that week — later weaker attempts don't drag the numbers
down, and neither do earlier ones). It shows:

- **Summary**: students attempted, class average, how many passed.
- **Question trends**: for every question, how many of the class's
  best-attempts got it right, out of how many, with a note flagging
  questions everyone nailed or that most of the class struggled with (e.g.
  "q3 incorrect in 14/20 students" shows up as a low `% Correct` with a
  "Most students struggled" note).
- **Student results**: each student's best score, how many attempts they
  used, and whether they passed — a quick way to see who still needs help.

## 5. How to distribute the file to students

Opening the HTML directly as a local file sometimes blocks submission
because of browser restrictions on `file://`. The reliable option is free
hosting: e.g. GitHub Pages (push the file to a repo, enable Pages in
settings) or Google Sites (embed the HTML). If Claude Code is set up to
deploy for you, you can ask it to stand up GitHub Pages for this repo — a
five-minute one-time setup.

## 6. Limitations worth knowing

- **The `text` answer type is an exact (character-for-character, ignoring
  spaces/case) string match**, not a check for mathematical equivalence. If
  you expect multiple equally correct forms (`6x-4` and `-4+6x`), list them
  all in `CorrectAnswer` separated by `|`. Full algebraic equivalence
  checking (where the system understands `2(x+3)` and `2x+6` are the same)
  isn't something Apps Script does out of the box — that's a separate,
  more involved feature.
- This system protects against faking a result via DevTools/console (the
  server is the only source of truth), but not against a student asking a
  classmate or another AI for the answer and honestly typing it in. That's
  no longer a technical problem but a question of task design (e.g. make
  some questions unlikely to have a ready-made answer online).
- Google Apps Script's free quotas comfortably cover a class or several
  classes a week — this isn't built for a whole school at scale, but it's
  more than enough for typical classroom use.
