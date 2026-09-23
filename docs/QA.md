# QA and verification

Verification completed on September 22, 2026.

Live site: https://tutor-ledger-kuljot.ks4573119468.chatgpt.site/

## Automated checks

- TypeScript type checking passed.
- Production build passed.
- Domain tests cover date and duration validation, attendance statuses, monthly progress, achievements, report totals, and CSV safety.
- SQLite tests run the actual migrations and cover persistence, uniqueness constraints, updates, deletion, and achievement storage.

## Manual production checks

The deployed site was tested for:

- loading and resetting fictional demo data
- creating, editing, and deleting session records
- persistence after refresh
- duplicate-record handling
- Tutor and Staff demo roles
- Student Progress across multiple learners and months
- stopped-learner history
- monthly report filtering
- CSV export
- browser Print / Save as PDF
- responsive layouts on iPhone Safari

The demo uses a shared public database, so exact sample totals can change if another visitor edits the data. Resetting the fictional demo restores the intended example state.

## Known limitations

- Demo roles are not real authentication or authorization.
- Concurrent edits use last-write-wins behavior.
- Deletion is permanent after confirmation.
- The demo uses a fixed roster and a single reporting year.
- The browser currently loads the full demo dataset rather than using server-side pagination.
