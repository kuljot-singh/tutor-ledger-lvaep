# Tutor Ledger

Tutor Ledger is a prototype built for the Columbia Software Solutions take-home project for **Literacy Volunteers of America, Essex & Passaic Counties (LVAEP)**. It replaces a paper-based monthly attendance and achievement workflow with a simple web app for tutors and staff.

## Live demo

**https://tutor-ledger-kuljot.ks4573119468.chatgpt.site**

The demo uses fictional data and a shared database.

- Choose **Tutor** or **Staff** on the demo access screen.
- Demo password: `password`
- **Tutor** can log sessions, review history, and view student progress.
- **Staff** can review history, view student progress, and generate monthly reports.
- **Reset fictional demo** restores the sample dataset if previous visitors have changed it.

The demo role screen is only for showing the intended workflow; it is not real authentication.

## What it does

- Log attended sessions, tutor absences, student absences, and holidays
- Edit or delete previous records
- Track learner achievements from the supplied LVAEP form
- Show monthly tutoring progress for each student
- Generate monthly summaries by tutor and student
- Export reports as CSV
- Print or save monthly reports as PDF through the browser
- Persist records in a hosted SQLite database
- Prevent duplicate daily records for the same tutor/student assignment

## Design decisions

I started with the supplied **Student Monthly Attendance & Achievement Form** and then researched LVAEP's programs and tutoring model so the prototype would reflect the organization rather than a generic tutoring app.

| Source | What I found | How it shaped the app |
| --- | --- | --- |
| Supplied FY 2026–2027 form | Attendance is recorded by day across a July–June reporting year | Records are organized by date and use the same reporting year |
| Supplied form | Tutor absence, student absence, and holiday are separate statuses | These are saved as explicit zero-hour records |
| Supplied form | Achievements are grouped into Economic, Educational, Family, Societal/Community, and Other | The session form includes the same achievement categories |
| Supplied form | A learner can be marked as stopped with a reason | The demo includes a stopped learner while preserving past history |
| [LVAEP services](https://www.lvaep.org/our-services.html) | LVAEP offers ESOL and Basic Literacy programs | Student profiles include program information |
| [LVAEP services](https://www.lvaep.org/our-services.html) and [contact](https://www.lvaep.org/contact-us.html) | LVAEP works across multiple tutoring locations | Demo assignments include Bloomfield Public Library, Passaic Public Library, and an online example |
| [LVAEP services](https://www.lvaep.org/our-services.html) | LVAEP publishes a 16-hour monthly tutoring expectation | Student Progress shows recorded attended hours toward 16 |

## Assumptions

For the take-home scope, I made a few explicit product assumptions:

- One attendance record per tutor/student assignment per day. If there are multiple meetings in one day, their hours are combined.
- Session length is entered in 15-minute increments from 0.25 to 8 hours.
- The demo roster is fixed rather than building a full student/tutor administration system.
- One achievement can be reported with a session record, with notes for additional context.
- Only attended tutoring time counts toward the 16-hour monthly progress display.
- The reporting year is July 1, 2026 through June 30, 2027.

These are straightforward choices for the prototype and would be confirmed with LVAEP before production use.

## Architecture

**React → HTTP API → Cloudflare D1 (SQLite)**

The browser handles the form, filters, navigation, and report views. API routes validate requests and read or write session records. D1 is the source of truth for persistence.

| File | Responsibility |
| --- | --- |
| `app/page.tsx` | Main application, session form, history, and monthly report |
| `app/student-journey.tsx` | Student Progress view |
| `app/globals.css` | Layout and responsive styles |
| `lib/sessions.ts` | Demo assignments, validation, achievements, summaries, and CSV formatting |
| `app/api/sessions/route.ts` | Session CRUD API |
| `app/api/sample/route.ts` | Load fictional sample records |
| `app/api/sample/reset/route.ts` | Reset the fictional demo dataset |
| `db/schema.ts` | Database schema and constraints |
| `drizzle/` | SQL migrations |
| `tests/` | Domain and database tests |

Session duration is stored as integer minutes. A unique database index on `(assignment_id, date)` prevents duplicate daily records. Monthly totals are calculated from the underlying records rather than stored separately, so edits and deletions are reflected automatically.

Validation runs in both the browser and API, and SQL queries use bound parameters.

## Running locally

Requires Node 22.13+ and pnpm.

```sh
corepack pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
node --experimental-strip-types --test tests/sessions.test.ts
python3 tests/schema_test.py
pnpm run build
```

For a fresh local database, apply the included migrations before starting the app:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_amazing_the_captain.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_furry_black_tom.sql
pnpm run dev
```

## Testing

The project includes automated checks for:

- date and duration validation
- attendance and absence rules
- duplicate records
- learner achievements
- monthly progress and report totals
- CSV escaping
- database migrations, updates, and deletion

I also tested the deployed app for session creation, editing, deletion, refresh persistence, duplicate handling, report filters, CSV export, Student Progress, demo reset, and mobile layouts.

See [QA notes](docs/QA.md) for a concise verification summary.

## Limitations and next steps

This is a take-home prototype, not a production student-record system. The main next steps would be:

- real authenticated tutor and staff accounts
- server-side role permissions
- database-backed student, tutor, and assignment management
- edit/audit history and stale-edit protection
- server-side filtering and pagination for larger datasets
- a month-end submission or approval workflow if LVAEP needs one

## AI assistance

AI was used to help with implementation, debugging, testing, and documentation. I made the product and scope decisions, researched the client workflow, tested the final behavior, and reviewed the implementation so I could explain the core data flow and tradeoffs.

See [submission assumptions](docs/SUBMISSION.md).
