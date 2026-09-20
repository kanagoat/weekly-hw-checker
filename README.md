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
- **Two grades share one page.** Questions carry a `Grade` (9 or 10); the
  student confirms their grade and name before anything loads, and only that
  grade's questions are ever sent to the browser. Every response sheet,
  report, streak and class average is kept separate per grade.
- **A live class report** ("Report - <grade> - <weekId>") is rebuilt automatically
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

| WeekID | QuestionID | Type | Title | Choices | CorrectAnswer | Tolerance | Points | Hint | Solution | Grade |
|---|---|---|---|---|---|---|---|---|---|
| week-01 | q1 | numeric | Solve $2x^2 - 3x - 5 = 0$. Give the positive root as a decimal. | | 2.5 | 0.01 | 1 | Use the quadratic formula with $a=2, b=-3, c=-5$, then pick the positive root. | $x = \dfrac{3 \pm \sqrt{9+40}}{4}$, so $x=2.5$ or $x=-1$. The positive root is $x=2.5$. |
| week-01 | q2 | text | Differentiate $y = 3x^2 - 4x + 7$. Give $\dfrac{dy}{dx}$ in the form $ax+b$. | | 6x-4\|-4+6x | | 1 | Differentiate term by term: $6x$, $-4$, $0$. | $\dfrac{dy}{dx} = 6x - 4$. |
| week-01 | q3 | mc | Which expression is equivalent to $(2x^3)^2$? | $4x^5$\|$4x^6$\|$2x^6$ | $4x^6$ | | 1 | $(2x^3)^2 = 2^2 \times (x^3)^2 = 4x^6$. | $(2x^3)^2 = 4x^6$. |
| week-01 | q4 | numeric | Solve simultaneously: $2x + y = 11$ and $x - y = 1$. Find $x$. | | 4 | 0 | 1 | Add the two equations to eliminate $y$. | Adding: $(2x+y)+(x-y)=11+1 \Rightarrow 3x=12 \Rightarrow x=4$. |

Column notes:
- **Grade**: which group the question belongs to — `9` or `10`. A blank
  `Grade` counts as `9`, so questions written before the two-group split keep
  working untouched. The same `WeekID` can exist in both grades: grade 9's
  `week-01` and grade 10's `week-01` are entirely separate question sets with
  separate response sheets, reports and class averages.
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

| WeekID | Grade | Title |
|---|---|---|
| week-01 | 9 | HW — Week 1: Quadratics, Calculus & Simultaneous Equations |
| week-01 | 10 | HW — Week 1: Limits |
| week-02 |  | HW — Week 2 (both grades) |

`Grade` here is optional: a row that names a grade applies to that grade
only, and a row that leaves it blank is the shared fallback for every grade
that has no row of its own.

If a `WeekID` has no row here (or the sheet doesn't exist), the page just
shows a generic "Homework — week-01" heading — everything else still works.

**`Responses - <grade> - <weekId>` sheets** (submission log, one per grade
per week, filled in automatically — e.g. `Responses - 9 - week-01`,
`Responses - 10 - week-01`) — headers:

`Timestamp | StudentName | Grade | WeekID | Attempt | Earned | Possible | Percent | Passed | AnswersJSON | FeedbackJSON`

Each sheet is created the first time a student submits for that week (or
ahead of time via **HW Checker → Set up a new week**, see below). The script
appends rows here itself — you never type into it by hand. Splitting
responses per week (instead of one giant combined sheet) keeps each sheet
short and makes it easy to eyeball one week's submissions at a glance.

**`Report - <grade> - <weekId>` sheets** are created automatically the first
time a student submits for that grade's week (e.g. `Report - 9 - week-01`)
and are fully rebuilt after every later submission for it — you don't create
these yourself, and you shouldn't hand-edit them since they get overwritten.

**`Term Overview - <grade>` sheets** (one per grade, e.g.
`Term Overview - 9`) are likewise auto-created/rebuilt after every
submission, with one row per week (students attempted, class average,
passed) and a line chart of that grade's class-average trend — don't
hand-edit them.

**Reports auto-update on any change, not just new submissions.** An
installed-free `onEdit` trigger watches every `Responses - <grade> - <weekId>` sheet —
the instant you hand-edit one (e.g. deleting a test row), that week's
`Report -` sheet and `Term Overview` rebuild automatically, no extra step
needed. **HW Checker → Refresh all reports** in the spreadsheet's menu bar
still exists as a manual fallback (e.g. right after restoring an older
version from File → Version history) — appears next to Help once `Code.gs`
is saved (reopen the sheet if you don't see it yet). The first time you use
any menu item, Google will ask you to authorize the script again — that's
normal, approve it the same way as the original deployment.

**`Report -`, `Responses - <weekId>`, and `Term Overview` sheets are
warning-only protected** (a yellow "you're editing a protected sheet"
prompt appears before you can edit one) since they're rebuilt from scratch
on every refresh — a hand-edit there would otherwise get silently
overwritten. Protection is a soft warning, not a hard block, so restoring
from Version history or intentional cleanup is never locked out.

**`Config` sheet** (optional, two columns: `Setting | Value`) lets you
change grading/alert behavior without touching `Code.gs` at all:

| Setting | Value |
|---|---|
| PASS_THRESHOLD_PERCENT | 80 |
| ATTEMPTS_BEFORE_HINTS | 3 |
| RESUBMIT_COOLDOWN_SECONDS | 20 |
| STUCK_ALERT_ATTEMPT | 5 |
| TEACHER_EMAIL | you@example.com |

A missing sheet, or a blank/missing row for any one setting, silently falls
back to the built-in default — so you only need to add the rows you
actually want to change.

### Step 2 — connect Apps Script
In that same spreadsheet: **Extensions → Apps Script**. Delete the default
content, paste in the whole `Code.gs` file. Save (the floppy-disk icon).

### Step 3 — set your email and deploy as a web app
Near the top of `Code.gs`, set `TEACHER_EMAIL` (inside `DEFAULT_CONFIG`) to
the address that should get "a student is stuck" alerts — or set it later in
the `Config` sheet instead, without touching this file again.

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

**If you ever edit `Code.gs` later** (a bug fix, a tweak), saving in the
Apps Script editor is not enough on its own — the deployed web app keeps
serving the old code until you also go **Deploy → Manage deployments →
Edit (pencil icon) → Version: New version → Deploy**. This reuses the same
URL, so `weekly-hw-template.html` never needs to change. You can confirm
which code is actually live by opening the web app URL with no `?week=`
parameter — it returns `{"status":"ok","version":"...",...}`, and that
`version` should match the `VERSION` constant at the top of `Code.gs`.

## 2. What to do every week

1. **HW Checker → Set up a new week** in the spreadsheet's menu bar — it
   first asks **which grade** the week is for, suggests that grade's next
   `WeekID` (grade 10 can still be on `week-03` while grade 9 is on
   `week-14` — the numbering runs per grade), then scaffolds 20 blank rows
   in `AnswerKey` with `Grade` and `WeekID` already filled in (and a dropdown
   applied to `Type`) and creates that grade's `Responses - <grade> -
   <weekId>` sheet ahead of time. You can also just add rows to `AnswerKey`
   by hand with a new `WeekID` and `Grade` if you prefer.
2. Fill in `Title`, `Type`, `Choices` (if `mc`), `CorrectAnswer`, `Hint`, and
   `Solution` for each of that week's rows.
3. Optionally add a matching row to `Weeks` for a nicer page heading.
4. Send each group its link, with the `WeekID` and `Grade` as URL
   parameters, e.g.:
   `https://your-hosting-url/weekly-hw-template.html?week=week-02&grade=9`
   `https://your-hosting-url/weekly-hw-template.html?week=week-02&grade=10`

Neither `Code.gs` nor `weekly-hw-template.html` need to change — the page is
shared across every week and both grades, it just reads different rows
depending on the link.

**Viewing one week's questions at a time in `AnswerKey`.** Since every
week's questions live in the same sheet, use **Data → Filter views** (or the
filter-view icon in the toolbar) to switch between "G9 Week 01 (week-01)",
"G10 Week 01 (week-01)", etc. (grade-prefixed and zero-padded so they group
by grade and sort in order in the popup, not "Week 1, Week 10, Week
11...Week 2") — each shows only that grade-week's 20
rows without touching the underlying data or affecting what other people
see. These are created automatically for existing weeks; for a week added
by hand (not via the menu command) add a matching filter view the same way,
or re-run `createWeeklyFilterViews` from the Apps Script editor.

## 3. Two grades on one page

When a student opens the link they get a short gate first — their grade and
their full name — and nothing else loads until they press **Show my
homework**. Only then does the page ask the server for questions, and the
server only ever sends back the questions for *that* grade. A 9th-grader
cannot see the 10th-grade set by editing the page, because it was never sent
to their browser.

Once they press the button, the grade and name are locked for the rest of
the page. That matters: attempts, the resubmit cooldown and the pass streak
are all keyed to the exact name string, so letting someone retype it halfway
through would quietly split one student's history into two.

If the link already carries `&grade=9`, the grade dropdown doesn't appear at
all — the student just confirms their name. That's the recommended way to
share it, since it removes the one thing they can get wrong.

**What this does and doesn't prove.** This is routing, not authentication.
It guarantees each group sees and is graded against its own questions, and
it keeps every report, average and streak separate per grade. It does *not*
prove identity: a student can still type a classmate's name, or pick the
other grade if you sent them the plain link. Treat the name as a label the
student chooses, the same as writing it on a paper worksheet.

To make it a real identity check you need accounts rather than typed names —
see the note at the end of "Limitations worth knowing".

## 4. Hints and multiple attempts

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

## 5. Reading the class report

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

## 6. Tracking the whole term

The `Term Overview` sheet rebuilds after every submission with one row per
week (`Week | Students | Class Average % | Passed`) across every `WeekID`
that's been attempted so far, plus a line chart of the class average over
time — open it any time to see whether the class is trending up or down,
without stitching together each week's `Report -` sheet by hand.

## 7. How to distribute the file to students

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

## 8. Limitations worth knowing

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
- **The typed name is not an identity.** The grade + name gate routes each
  group to its own questions and keeps the reports separate, but a student
  can type whatever name they like. A misspelling also starts a fresh attempt
  history, which is why it's worth telling students to spell their name the
  same way every week.

  Turning this into a real check means signing in with school accounts
  instead of typing a name. Apps Script can only read *Google* identities via
  `Session.getActiveUser()`, so a school on **Microsoft 365 / Entra ID** needs
  the OAuth route: register an app in Entra ID (SPA redirect URI pointing at
  the hosted page, single-tenant, `User.Read`), have the page acquire a token
  at sign-in, send it with the submission, and have `Code.gs` verify it by
  calling Microsoft Graph `/me` with `UrlFetchApp` — a forged or expired
  token simply fails that call. The verified UPN then replaces the typed
  name, and a `Roster` sheet mapping UPN → grade replaces the grade dropdown
  entirely, so nobody picks their own group. This needs an Entra ID app
  registration from school IT (tenant ID + client ID) and should be tested
  against one real student account first, since tenants differ on whether
  `User.Read` needs admin consent.
