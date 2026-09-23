# Tutor Ledger

A Columbia Software Solutions take-home for **Literacy Volunteers of America, Essex & Passaic Counties (LVAEP)**. This is an unofficial prototype using fictional people only.

## Problem

Tutors record attendance; staff need reliable monthly reports. The supplied Student Monthly Attendance & Achievement Form also records learner outcomes. A replacement should make both hours and achievements visible without requiring staff to reconcile another spreadsheet.

## Product

Log attendance, correct history, review monthly totals, and export CSV. **Student Progress** brings a learner's sessions and reported achievements together, with program, site, stopped status, and progress toward the published monthly tutoring expectation. The original hosted persistence and validation remain in place.

## Try the live demo

**https://tutor-ledger-kuljot.ks4573119468.chatgpt.site**

1. Choose the **Tutor** or **Staff** demo role and enter the disclosed demo password, `password`. This changes the visible prototype workspace; it is not authentication.
2. Select **Load fictional examples**, or use **Reset fictional demo** to restore the known shared example state.
3. Open **Student Progress** for Jamie Rivera in September 2026. See ESOL, the assigned library, monthly tutoring hours, and a family achievement. Compare Sam Chen's Basic Literacy profile and Jordan Ellis's stopped example.
4. As Tutor, log, edit, or delete a fictional record; refresh to confirm database persistence. As Staff, review the monthly report, export CSV, or use the browser print dialog to save a PDF.

All visitors share these records. Example totals may change after public edits. Do not promise fixed totals in a demo. Loading samples is additive; Reset restores the full fictional dataset. No real student data should be entered; the demo role and disclosed password do not authenticate anyone.

## Designing for LVAEP

Research checked September 22, 2026. LVAEP is the client; Bloomfield Public Library is a relevant location, not the client identity.

| Source | Observation | Product decision |
| --- | --- | --- |
| Supplied FY 2026–2027 form | July–June grid, one cell per day | Same reporting year; one record per assignment/day is our interpretation |
| Supplied form | Tutor absence, student absence, holiday | Explicit zero-hour records, distinct from no record |
| Supplied form | Economic, Educational, Family, Societal/Community, Other achievements | Optional structured achievement; actual checklist labels in `lib/sessions.ts` |
| Supplied form | STOPPED and reason | Fixed stopped learner example retains history |
| [LVAEP services](https://www.lvaep.org/our-services.html) | Adult literacy, ESOL and Basic Literacy | Program metadata and adult-facing presentation |
| [LVAEP services](https://www.lvaep.org/our-services.html), [contact](https://www.lvaep.org/contact-us.html) | Multi-site operation; Bloomfield and Passaic library locations | Fictional assignments use those locations; Online is a demo choice |
| [LVAEP services](https://www.lvaep.org/our-services.html) | Minimum 16 tutoring hours monthly, with homework stated separately | Neutral attended-time progress out of 16; no homework credit |
| Product interpretation of attendance plus outcomes | Staff benefit from seeing a learner's history together | Student Progress, not a new case-management system |

The PDF was supplied for this exercise and inspected; it is not redistributed here. The muted green is a visual interpretation, not an official brand specification. The fictional assignments are not claims about actual LVAEP participants.

## Assumptions and scope

- Fixed fictional roster: two tutors, three learners, one assignment each. Program/site/status are illustrative constants; no roster administration.
- One daily record per assignment; combine same-day meetings. “Sessions held” means attended daily records, not individual meeting times.
- **0.25–8 hours in quarter-hour increments** is our assumption, not a published LVAEP rule. Store whole minutes. Real dates, within FY 2026–2027, no later than today in Eastern time.
- One optional achievement per attendance record. The record date is the **report date**, not necessarily attainment date. Other requires an explanation in notes. An achievement may be reported with a zero-hour record without adding tutoring time.
- The same 16-hour reference is displayed across the fictional tutoring roster; applicability across programs, partial months and stopped periods needs staff confirmation. Stopped profiles explicitly mark it as historical context.
- Cumulative hours and last attendance describe **records in this demo**, not a verified lifetime history. Timeline includes all recorded months; only the progress card changes with the month filter.
- A roster site is an assigned location; a session's optional site can differ. No historic assignment versioning.
- No homework credit, recurring schedule, office notification, approval/locking or follow-up scoring. These need requirements, not guesses.

## Architecture

**React form → HTTP API → Cloudflare D1 (SQLite)**

React stores the current form, selected view, and a fetched copy of the records. The database is the source of truth. Refresh reloads it; the app never treats browser storage as the permanent record. The site uses the supplied Vinext hosting starter, TypeScript, plain CSS, and direct SQL queries. No extra application framework or state-management library was added.

| File | Responsibility |
| --- | --- |
| `app/page.tsx` | Session form, history, report, and user feedback |
| `app/student-journey.tsx` | Learner profile, monthly progress, all-month timeline |
| `app/globals.css` | Layout, typography, and responsive styles |
| `lib/sessions.ts` | Fixed assignments, date/hour validation, totals, CSV formatting |
| `app/api/sessions/route.ts` | GET, POST, PUT, and DELETE requests |
| `app/api/sample/route.ts` | Explicitly load fictional examples without overwriting existing records |
| `app/api/sample/reset/route.ts` | Restore the shared public demo to its fixed fictional example state |
| `db/schema.ts` | Sessions table and database constraints |
| `db/index.ts` | Access the database binding |
| `drizzle/` | Versioned SQL migration generated from the schema |
| `tests/` | Validation, reporting, CSV, and schema tests |
| `docs/INTERVIEW_GUIDE.md` | Explanation, walkthrough, tradeoffs, and questions |

Each row has `id`, `assignment_id`, `date`, `minutes`, `status`, `site`, `notes`, and `achievement_id`. A unique index on `(assignment_id, date)` rejects duplicate daily records, including simultaneous inserts. Database checks also enforce attendance/minute consistency. Hours are stored as whole minutes; reports divide by 60.

Validation runs in both the UI and API. SQL uses bound parameters. Failed requests preserve form values. Reports are calculated from filtered records, rather than storing totals that could become stale. This modest, one-year demo loads all records; a larger deployment should filter and aggregate on the server.

## Development in a cloud terminal

The live app needs only a browser. The source can also run in a Node 22.13+ cloud environment; no Docker or desktop app is required. The project uses its existing pnpm lockfile.

```sh
corepack pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
node --experimental-strip-types --test tests/sessions.test.ts
python3 tests/schema_test.py
pnpm run build
```

For a fresh local development database, apply the included migration **once** after building:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_amazing_the_captain.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_furry_black_tom.sql
pnpm run dev
```

In this managed build environment, Sites supervises preview and publishes the Worker plus the D1 migration. The logical `DB` binding is declared in `.openai/hosting.json`; no database secret belongs in client code. Deploying elsewhere requires configuring that host's equivalent database binding.

## Testing

Run the commands above. Domain tests cover validation, CSV safety, monthly progress isolation, absence/holiday exclusion, achievements, and totals above 16. SQLite tests execute both actual migrations, check legacy-row preservation, constraints, achievement persistence, edits/deletion, and non-overwriting conflict behavior. See [QA evidence](docs/QA.md) for production browser checks and limitations; a terminal POST is not used as browser evidence.

## Tradeoffs and next steps

Before real use: authenticated tutor/staff accounts with server-enforced authorization, audit/edit history, database-backed student/tutor/assignment management, and requirements confirmed with staff. A calendar view may also help if users prefer it. Concurrent edits remain last-write-wins; deletion is permanent after confirmation. Refresh manually to see other visitors' edits. Loading all records suits the small demo; larger programs need server-side filtering/pagination. No extra framework or state-management library was added.

See [interview guide](docs/INTERVIEW_GUIDE.md) and [submission answer](docs/SUBMISSION.md).

## AI assistance

AI assisted implementation, debugging, testing, and documentation. Product decisions, requirements interpretation, client research, scope, verification, and understanding the core workflow are the applicant's responsibility. This is not a claim that the applicant manually wrote every line. The guide supports learning and honest explanation; statements about personal verification should only be made after performing it.
