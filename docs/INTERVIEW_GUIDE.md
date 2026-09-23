# Tutor Ledger: understand it, then explain it

This guide is for Kuljot's Columbia Software Solutions take-home. Practice the code walkthrough before using the pitch. Describe AI assistance honestly; do not imply you wrote or deeply understand the hosting framework itself.

## 60–90 second explanation

“I began with LVAEP's supplied attendance and achievement form. I identified the core workflow: tutors record daily attendance, then staff need a clear monthly report. I built a deliberately scoped replacement with saved records, corrections, validation, and CSV export.

I then researched LVAEP itself so the product would reflect adult literacy work. Its published tutoring expectation is sixteen hours per month, so the student profile shows recorded tutoring time against that reference, without judging learners. It excludes absences and homework. I also reflected ESOL and Basic Literacy, relevant tutoring locations, and the form's stopped-learner workflow.

The main addition is Student Progress. It combines sessions with achievements from the original checklist, because learner outcomes matter alongside attendance. An achievement is simply attached to the record where it is reported, keeping the implementation small.

Technically, the existing React interface saves through a validated API into hosted SQLite. I store minutes and derive report totals from records so corrections stay consistent. I used AI heavily for implementation, debugging, tests, and documentation. My responsibility is understanding the workflow, checking the evidence, and explaining the decisions. For real use, I would prioritize authentication, tutor/staff permissions, and audit history before adding features.”

Use this pitch only after reviewing the code and trying the demo yourself. Do not claim personal tests you have not performed.

## Two-minute demonstration

- **0:00–0:15:** Identify LVAEP and the fictional, shared public prototype. Enter the Tutor demo with the disclosed password and load fictional examples.
- **0:15–0:50:** Student Progress → Jamie → September 2026. Explain attended hours /16 and the family achievement. Compare Sam's program and Jordan's stopped profile with preserved history.
- **0:50–1:15:** Log a fictional record on an unused past date. Select an optional achievement. Save, refresh and find it in history.
- **1:15–1:40:** Edit it and show that the report recalculates. Filter by tutor; explain zero-hour absences.
- **1:40–2:00:** Switch to Staff, show the monthly report, and export CSV. Delete the temporary record or reset the fictional demo, then mention real permissions and audit history as next steps.

Shared data can change. Check an unused date before presenting, and never promise a fixed total. If time is tight, demonstrate editing an existing fictional row instead of rushing a new entry.

## Five-minute learning path: new functionality only

1. **Minute 1 — `lib/sessions.ts`:** Read `assignments`, `achievements`, and `MONTHLY_TUTORING_HOURS`. Explain what comes from the form, research, and fictional choices.
2. **Minute 2 — `studentProgress`:** Filter one assignment, count attended minutes for the selected month, divide by 60. Explain why last attendance excludes absences and cumulative hours includes other months.
3. **Minute 3 — `app/student-journey.tsx`:** Follow the selected learner/month into `studentProgress`. The timeline is all months, newest first. The progress bar caps visually at 16, but the number preserves actual hours above 16.
4. **Minute 4 — achievement save:** Form dropdown → `validateSession` → `achievement_id` API parameter → one additive migration. Category/label are looked up by stable ID, not copied into every row. Other uses notes for detail.
5. **Minute 5 — tests:** Explain the absence/holiday exclusion test and migration-preservation test. Change the selected month in the live profile and predict what should change before clicking.

## Architecture in plain English

There are three layers:

- **Browser:** React displays the form and tables. Its state variables remember the current form, active view, filters, loading state, and a local copy of saved records.
- **Server:** API functions receive requests. They validate inputs and ask the database to read or change rows. The browser cannot access the database binding directly.
- **Database:** D1 is hosted SQLite. It permanently stores session rows. It also enforces rules that must hold even if two requests arrive together.

The hosting starter runs the API in a Cloudflare Worker and bundles the React application with Vinext. This is platform scaffolding, not a custom architecture you need to claim to have invented. Drizzle generates schema migration SQL; actual application queries use straightforward prepared SQL statements.

### Trace one Save click

Read these functions in this order:

1. `Home` in `app/page.tsx`: `form` holds the current fields; `rows` holds fetched sessions.
2. `save(event)` prevents a full-page form submission and validates the form.
3. `request()` sends a JSON HTTP POST to `/api/sessions` (PUT for an edit). The Save button is disabled while it runs.
4. The API's `save(request, edit)` parses the JSON and runs `validateSession()` again.
5. `getDatabase()` gets the server's database connection.
6. The API binds the validated values to an INSERT or UPDATE query. The database rejects a duplicate assignment/date.
7. Only after storage succeeds does the API return the saved row. The browser updates its record list and shows success. On failure, it shows an error and preserves the inputs.
8. The report filters the saved list by month/tutor, then `summarize()` adds minutes for attended records and divides by 60.

### Data model

| Field | Example | Why it exists |
| --- | --- | --- |
| `id` | Generated UUID | Identifies a row for editing/deleting |
| `assignment_id` | `a1` | Links the fixed tutor/student pair without copying names into each row |
| `date` | `2026-09-10` | A calendar day, not a timestamp |
| `minutes` | `90` | Stores 1.5 hours as an integer |
| `status` | `attended` | Separates held sessions from tutor/student absence or holiday |
| `site` | `Online` | Optional meeting location from the source form |
| `achievement_id` | `school_activities` | Optional stable checklist choice; category/label come from the shared catalog |
| `notes` | `Completed a reading goal` | Optional achievement information |

One student has one assignment in this demo, so counting unique assignments among attended records counts tutored students. This would need a separate student ID if a student could have multiple tutors.

## Likely technical questions

**Why this project instead of dock scheduling?**  
It has a clear user journey and a concrete source form. I could complete entry, validation, persistence, corrections, and reporting within the intended scope. Berth sizing and date-range conflicts would introduce a different set of rules.

**Why React and SQLite? Could it be simpler?**  
Vanilla JavaScript could handle the UI. React was already supported by the cloud hosting starter and keeps the form, filters, and totals in sync through state. SQLite suits small structured records. I avoided adding a separate server service or a state-management library. The hosting starter is more infrastructure than the application logic itself requires.

**Why not localStorage?**  
It would survive a reload in one browser, but staff and tutors on different devices would not share the same records. The hosted database is one shared source of truth.

**Why store minutes?**  
It makes duration a whole number. For example, 1.25 hours is 75 minutes. Summing integers avoids accumulating decimal-rounding problems and makes the 15-minute rule easy to enforce.

**How do you validate dates?**  
The value must be a real `YYYY-MM-DD` calendar day, within the form's reporting year, and no later than today in Eastern time. A format check alone would accept a nonexistent day like September 31, so validation also checks that parsing and converting the date returns the same day.

**What happens if two people create the same daily record at once?**  
The unique database index on assignment and date allows only one. The second request receives a conflict response, and the UI tells the user to edit the existing record. A client-only duplicate check would be vulnerable to a race.

**What happens if two people edit the same record?**  
The last completed update wins. There is no version check or audit history yet. A later version could save a revision number and reject stale edits, asking the second editor to reload.

**Why validate twice?**  
Browser validation gives immediate feedback. Server validation is necessary because someone can call the API directly or modify the browser's code. Database checks add another guard for attendance consistency and uniqueness.

**Why one record per day? What if there are two meetings?**  
The source form has one cell per day and student. This version combines their hours. The report's “sessions held” is therefore a count of attended days, an assumption to confirm with the client. If separate meetings matter, I'd add meeting times or a distinct meeting ID and change the uniqueness rule.

**How do monthly reports work?**  
Dates are stored consistently, so filtering by the `YYYY-MM` prefix selects the month. Filtering by tutor finds the relevant assignments. The same filtered rows drive the summary, detail table, and CSV. Only attended rows add hours. Distinct attended assignments count the tutored students.

**Why not save a monthly total in the database?**  
A saved total could fall out of sync after edits or deletion. Deriving it from the records avoids that extra consistency problem. At a larger scale, I'd calculate it with server-side SQL aggregates.

**What protects against SQL injection?**  
Prepared statements use placeholders and bound values rather than pasting user input into SQL. React displays notes as text instead of interpreting them as HTML. CSV export also quotes cells and prefixes formula-like text so a spreadsheet does not execute it as a formula.

**What if saving fails?**  
The server returns an error and the form keeps its values. It shows success only after the database responds successfully. If a network response is lost after an insert commits, retrying the same date will hit the unique rule; the user can refresh history to check the existing row. More general retry handling could use an idempotency key.

**Who can view or edit records?**  
Everyone with this public demo's URL. The Tutor/Staff demo access screen only changes visible navigation; its disclosed password is not security. For real deployment, authentication and server-enforced tutor/staff authorization are the first requirements. I would not enter real student records into this demo.

**Why hardcode the roster?**  
The requested workflow starts with already-assigned students. A fixed fictional roster lets me demonstrate that workflow without inventing roster administration. In production I'd put students, tutors, and assignments in related database tables and restrict who can change them.

**What did you leave out from the PDF?**  
Recurring day/time schedule, office notification, annual grid printing, and homework credit remain outside scope. Stopped status is represented in the fictional roster. The checklist is implemented as one optional reported achievement per attendance record, with notes for context.

**How did you test it?**  
Automated tests cover invalid dates, future dates, hour limits, quarter-hour increments, zero-hour absences, bounded text, report totals, and CSV escaping. The real migration is exercised in disposable SQLite for uniqueness, attendance consistency, update, and deletion. Browser checks cover save, reload persistence, edits, duplicate feedback, month/tutor filtering, empty results, and exported CSV totals. See `QA.md` for the exact evidence and limitations.

**How much did AI do?**  
AI helped write, debug, test, and document the implementation. My responsibility is to understand and explain the product rules and data flow and verify the behavior. I would not claim to have manually authored every line. I can demonstrate understanding by tracing Save and modifying a validation rule with its tests.

## Actual weaknesses an interviewer could identify

| Weakness | Effect | Priority |
| --- | --- | --- |
| No identity or permissions | Public records can be read/changed by anyone | Required before real use |
| Fixed roster and reporting year | Staff cannot manage assignments or roll into another year | Next client-facing scope |
| Last-write-wins edits; permanent deletion | No conflict resolution or audit trail | Before sensitive operational use |
| One reported achievement per daily record | Multiple milestones and true attainment dates need a richer model | Confirm with staff |
| Daily record treated as a session | Meeting counts can undercount multiple meetings in one day | Confirm terminology/rule |
| Loads all records into the browser | Does not scale to a large multi-year program | Later; use server filtering/pagination |
| No submission/approval process | Staff review a live report, not a locked month-end submission | Client-dependent |

These do not require expanding the take-home into a full production system. Explain them accurately and prioritize access control before cosmetic additions.

## A short learning session before the interview

1. Explain in your own words the difference between `form`, `rows`, and the database.
2. Trace a 1.5-hour save into a 90-minute database row and back into the report.
3. Point to the frontend validation, server validation, and unique database index.
4. Explain why an absence has a row but no hours.
5. Change the maximum hours in a practice copy and update the corresponding tests and database constraint. Explain why changing only the HTML input is insufficient.
6. Show the report for one tutor and explain exactly which rows are included.
7. Give an honest answer about AI assistance and identify one tradeoff you would revisit with the client.

If you cannot explain a line yet, ask about it. Understanding the small core matters more than memorizing framework terminology.

## New product questions

**What does Student Progress add?** It connects attendance to learner outcomes already present in the source form. It is a reading view over the same records, so it does not introduce another source of truth.

**How does 16-hour progress work?** Select the learner and month, include only `attended` rows, sum minutes, divide by 60. All three absence/holiday types contribute zero. The display is neutral recorded information, not an assessment of motivation or need. The source lists homework separately.

**How are achievements represented?** One optional stable ID per attendance row, with a catalog mapping it to a source-form category and label. The date means reported on that record. Existing rows get an empty default when the new column is added. Other requires notes. This is deliberately smaller than independent goal tracking.

**Why is status not editable?** The take-home demonstrates the stopped workflow and historical retention through the fixed fictional roster. Full roster management would introduce permissions, re-enrollment and assignment history requirements. It does not prevent corrections to historical records.

## Questions to confirm with LVAEP

1. Can one learner have multiple tutors, and how should hours be attributed?
2. Should same-day meetings be combined, or counted separately?
3. Does the 16-hour expectation apply to every program and partial month?
4. How exactly is independent homework credited and distinguished from tutoring?
5. Are achievements reported when attained or at reporting periods? Can several be reported together?
6. Should staff approve or lock monthly submissions, and who may correct older attendance?
7. How should stopped learners, reasons and re-enrollment be recorded?
8. Which site/program breakdowns and external report formats matter most?

These are unresolved requirements, not claims that the client is doing something wrong.

## Ten concepts to study

1. React form state versus saved database records.
2. POST/PUT/DELETE and the request/response flow.
3. Frontend feedback versus mandatory server validation.
4. Database uniqueness/constraints and a simultaneous-insert race.
5. Integer minutes and the quarter-hour assumption.
6. Derived reports instead of separately stored totals.
7. Absence versus no record; missing data cannot explain its cause.
8. Achievement IDs, catalog lookup and additive migration defaults.
9. Attended-only progress, month filtering and historical timelines.
10. Authentication versus authorization, audit history and last-write-wins edits.

## What I would build next

Authenticate tutor and staff accounts and enforce their permissions on the server. Add an audit trail and stale-edit protection. Move student, tutor, and assignment management into the database. Confirm the questions above with staff, then consider a calendar view if users prefer one.
