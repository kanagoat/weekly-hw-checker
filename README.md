# Weekly HW Checker — what it is and how to run it

Idea: `weekly-hw-template.html` is the same page every week — you never copy
or edit it. Each week's questions (text, type, multiple-choice options) live
as rows in your Google Sheet's `AnswerKey` tab, and the page fetches that
week's questions from the server when a student opens it with `?week=week-01`
(or whichever `WeekID`) in the URL. Answers get checked NOT in the student's
browser (like a first pass with a screenshot would), but on the server — in a
Google Apps Script bound to your Google Sheet. So the grade can't be faked via
DevTools: the student physically never sees the correct answers or the
checking logic — only the question and an input box.

The student sees their result immediately on the page (percentage + a
breakdown per question), and a row with their name, score, and submission
time automatically appears in your spreadsheet — no screenshots, no manual
grading.

On top of that:
- **Hints stay locked for the first two attempts.** A wrong answer only gets
  a hint once a student has reached their 3rd attempt on that week and is
  still below the 80% pass floor.
- **Full worked solutions unlock once a student passes** — a "why" for every
  question, not just the ones they got wrong.
- **Every submission is logged as a separate attempt**, so a student can
  retry as many times as they like — with a short cooldown between
  resubmissions so it stays "think, then answer" rather than guess-spam.
- **Weekly pass streaks** are tracked and shown back to the student.
- **A live class report** ("Report - <weekId>") is rebuilt automatically
  after every submission for that week, showing the class average, how many
  students passed, and which questions the class is struggling with.
- **A Term Overview sheet with a trend chart** tracks the class average
  across every week, so you can see topic drift over the term at a glance.
- **You get emailed** if a student is still stuck after several attempts.
- Math renders properly (KaTeX) and multiple-choice option order is
  shuffled per student, straight in the page itself.

## 1. One-time setup (~20–30 minutes)

### Step 1 — create a Google Sheet
Create a new spreadsheet, e.g. "HW Checker — Year 11 Maths". Inside, create
three sheets:

**`AnswerKey` sheet** — this is where you type every question, its options,
its correct answer, hint, and solution. Students never see this sheet
directly; the page only ever receives the fields it's allowed to (`Title`,
`Type`, `Choices`) until an answer unlocks its `Hint`/`Solution`. Headers in
row 1:

| WeekID | QuestionID | Type | Title | Choices | CorrectAnswer | Tolerance | Points | Hint | Solution |
|---|---|---|---|---|---|---|---|---|---|
| week-01 | q1 | numeric | Solve $2x^2 - 3x - 5 = 0$. Give the positive root as a decimal. | | 2.5 | 0.01 | 1 | Use the quadratic formula with $a=2, b=-3, c=-5$, then pick the positive root. | $x = \dfrac{3 \pm \sqrt{9+40}}{4}$, so $x=2.5$ or $x=-1$. The positive root is $x=2.5$. |
| week-01 | q2 | text | Differentiate $y = 3x^2 - 4x + 7$. Give $\dfrac{dy}{dx}$ in the form $ax+b$. | | 6x-4\|-4+6x | | 1 | Differentiate term by term: $6x$, $-4$, $0$. | $\dfrac{dy}{dx} = 6x - 4$. |
| week-01 | q3 | mc | Which expression is equivalent to $(2x^3)^2$? | $4x^5$\|$4x^6$\|$2x^6$ | $4x^6$ | | 1 | $(2x^3)^2 = 2^2 \times (x^3)^2 = 4x^6$. | $(2x^3)^2 = 4x^6$. |
| week-01 | q4 | numeric | Solve simultaneously: $2x + y = 11$ and $x - y = 1$. Find $x$. | | 4 | 0 | 1 | Add the two equations to eliminate $y$. | Adding: $(2x+y)+(x-y)=11+1 \Rightarrow 3x=12 \Rightarrow x=4$. |

Column notes:
- **Type**: `numeric` (a number, checked against `Tolerance`), `text` (a
  string, case/whitespace-insensitive), or `mc` (multiple choice).
- **Title**: the question text students see. Can contain `$...$` LaTeX — the
  page renders it with KaTeX.
- **Choices**: `mc` only — the option texts the student picks from, separated
  by `|`, e.g. `$4x^5$|$4x^6$|$2x^6$`. Their on-screen order is shuffled per
  student; leave this blank for `numeric`/`text` questions.
- **CorrectAnswer**: for `mc`, this is the *text* of the correct option (must
  match one of the `Choices` entries) — not a letter code. For `text`/`mc`
  you can list several accepted answers separated by `|`, e.g. `6x-4|-4+6x`
  — either form is accepted.
- **Tolerance**: `numeric` only — allowed margin of error (0 = exact match,
  0.01 if the question involves decimals).
- **Points**: leave blank for 1 point; set a number to weight a question
  differently.
- **Hint**: a short hint the student sees once hints unlock for that
  question on that attempt (see below) — this is the "error breakdown".
- **Solution**: the full worked solution, shown for every question once the
  student passes. Both `Hint` and `Solution` can contain `$...$` LaTeX.
- **Watch out for Sheets auto-converting decimals to dates.** Typing `2.5`
  into `CorrectAnswer`/`Tolerance` can silently become a date like `02.05.2026`
  depending on your locale. If a numeric question always grades wrong, select
  those columns and set **Format → Number → Plain text** first, then re-type
  the value.
- **Row order is display order.** Questions for a week appear on the page in
  the same order their rows appear in `AnswerKey` — so type them top to
  bottom in the order you want students to see them.

**`Weeks` sheet** (optional, just controls the page heading) — headers:

| WeekID | Title |
|---|---|
| week-01 | HW — Week 1: Quadratics, Calculus & Simultaneous Equations |

If a `WeekID` has no row here (or the sheet doesn't exist), the page just
shows a generic "Homework — week-01" heading — everything else still works.

**`Responses` sheet** (submission log, filled in automatically) — headers:

`Timestamp | StudentName | WeekID | Attempt | Earned | Possible | Percent | Passed | AnswersJSON | FeedbackJSON`

The script appends rows here itself — you never type into it by hand.

**`Report - <weekId>` sheets** are created automatically the first time a
student submits for that week (e.g. `Report - week-01`) and are fully
rebuilt after every later submission for that week — you don't create these
yourself, and you shouldn't hand-edit them since they get overwritten.

**`Term Overview` sheet** is likewise auto-created/rebuilt after every
submission, with one row per week (students attempted, class average,
passed) and a line chart of the class average trend — don't hand-edit it.

**Reports only recompute on a real submission.** If you manually edit or
delete rows in `Responses` (e.g. clearing out test data), the `Report -`
and `Term Overview` sheets won't reflect that until either the next student
submits, or you use **HW Checker → Refresh all reports** in the spreadsheet's
menu bar (appears next to Help once `Code.gs` is saved — reopen the sheet if
you don't see it yet). The first time you use it, Google will ask you to
authorize the script again — that's normal, approve it the same way as the
original deployment.

### Step 2 — connect Apps Script
In that same spreadsheet: **Extensions → Apps Script**. Delete the default
content, paste in the whole `Code.gs` file. Save (the floppy-disk icon).

### Step 3 — set your email and deploy as a web app
Near the top of `Code.gs`, set `TEACHER_EMAIL` to the address that should get
"a student is stuck" alerts.

**Deploy → New deployment** → type **Web app**.
- Execute as: **Me**
- Who has access: **Anyone**

Click Deploy, approve access (Google will ask about permissions on the
sheet **and** on sending email as you — both normal, the script needs them
to grade and to send stuck-student alerts). Copy the **web app URL** —
you'll need it in the HTML template.

### Step 4 — put the URL in the HTML
Open `weekly-hw-template.html`, and in the `CONFIG` block paste the copied
URL into `SCRIPT_URL`. That's the only edit this file ever needs — you won't
touch it again from week to week.

## 2. What to do every week

1. Add rows to `AnswerKey` for the new week — pick a `WeekID` (e.g.
   `week-02`), then one row per question with its `Title`, `Type`, `Choices`
   (if `mc`), `CorrectAnswer`, `Hint`, and `Solution`.
2. Optionally add a matching row to `Weeks` for a nicer page heading.
3. Send students the link, with that week's `WeekID` appended as a `?week=`
   parameter, e.g.:
   `https://your-hosting-url/weekly-hw-template.html?week=week-02`

Neither `Code.gs` nor `weekly-hw-template.html` need to change — the page is
shared across every week, it just reads different rows depending on the link.

## 3. Hints and multiple attempts

- A student can submit the same week's homework as many times as they want.
- The first 2 attempts never show a hint, even for wrong answers — only the
  score and correct/incorrect marks.
- From the 3rd attempt onward, if the student is still below 80%, wrong
  answers show their hint.
- Once a student reaches 80% they've passed — no hints are shown or needed.
- The attempt count is per student name (case-insensitive, trimmed) and per
  `WeekID`, so make sure students spell their name consistently.
- **Resubmissions are rate-limited** to one every `RESUBMIT_COOLDOWN_SECONDS`
  (20s by default) per student per week, so a countdown appears instead of
  letting someone spam-guess. This is enforced on the server, not just the
  page, so it can't be bypassed by refreshing.
- **Passing unlocks the full worked solution** for every question (not just
  the ones answered wrong) — a "why", not just a hint, once mastery is shown.
- **Weekly pass streaks**: passing this week and every week before it (back
  to the first `WeekID` with no gap) builds a streak, shown to the student
  as "🔥 N-week pass streak!" once N ≥ 2.
- **You get an email** (to `TEACHER_EMAIL` in `Code.gs`) the moment a student
  reaches `STUCK_ALERT_ATTEMPT` (5 by default) attempts on a week and still
  hasn't passed — a nudge to step in before they give up.

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

## 5. Tracking the whole term

The `Term Overview` sheet rebuilds after every submission with one row per
week (`Week | Students | Class Average % | Passed`) across every `WeekID`
that's been attempted so far, plus a line chart of the class average over
time — open it any time to see whether the class is trending up or down,
without stitching together each week's `Report -` sheet by hand.

## 6. How to distribute the file to students

Opening the HTML directly as a local file sometimes blocks submission
because of browser restrictions on `file://`. The reliable option is free
hosting: e.g. GitHub Pages (push the file to a repo, enable Pages in
settings) or Google Sites (embed the HTML). If Claude Code is set up to
deploy for you, you can ask it to stand up GitHub Pages for this repo — a
five-minute one-time setup.

Whatever the hosting URL turns out to be, every week you share the *same*
file with a different `?week=` value — no new file, no redeploy, just a
different link (or the same link with the value changed, if you're
distributing it some other way than a fresh URL each time).

## 7. Limitations worth knowing

- **The `text` answer type is an exact (character-for-character, ignoring
  spaces/case) string match**, not a check for mathematical equivalence. If
  you expect multiple equally correct forms (`6x-4` and `-4+6x`), list them
  all in `CorrectAnswer` separated by `|`. Full algebraic equivalence
  checking (where the system understands `2(x+3)` and `2x+6` are the same)
  isn't something Apps Script does out of the box — that's a separate,
  more involved feature.
- This system protects against faking a result via DevTools/console (the
  server is the only source of truth), but not against a student asking a
  classmate or another AI for the answer and honestly typing it in. Shuffling
  multiple-choice order and adding a resubmission cooldown make casual
  guessing/copying harder, but sharing a final numeric answer is still a
  question of task design (e.g. make some questions unlikely to have a
  ready-made answer online), not something the system can fully block.
- Multiple-choice order is reshuffled **on page load**, not per-submission —
  a student who reloads gets a new shuffle, but it stays fixed for that one
  sitting.
- KaTeX loads from a CDN (`cdn.jsdelivr.net`); if a student's network blocks
  that domain, math falls back to showing the raw `$...$` text instead of
  rendering.
- Google Apps Script's free quotas comfortably cover a class or several
  classes a week — this isn't built for a whole school at scale, but it's
  more than enough for typical classroom use. `MailApp` alerts count against
  your daily email quota too (well within range for classroom-size stuck
  alerts).
