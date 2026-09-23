# CSS submission: assumptions and design decisions

I treated the supplied attendance and achievement form as the starting point for the workflow. The prototype uses one attendance record per tutor/student assignment per day and follows the July–June FY 2026–2027 reporting year. Tutor absence, student absence, and holiday are saved as explicit zero-hour records so they are distinguishable from a missing entry.

Session length is stored as whole minutes, with 15-minute increments from 0.25 to 8 hours for this prototype. Monthly totals are calculated from the underlying records rather than stored separately, so edits and deletions are reflected automatically.

I kept the roster fixed so I could focus on the core tutor-to-staff workflow. Research on LVAEP informed the ESOL and Basic Literacy examples, tutoring locations, and the 16-hour monthly progress display. Student Progress combines attendance history with achievements from the supplied form, and the demo includes a stopped learner whose previous records remain visible.

For production use, the first additions would be real authenticated accounts, server-side tutor/staff permissions, database-backed roster management, and an audit trail for edits. The public demo uses fictional data only.

AI assisted with implementation, debugging, testing, and documentation. I made the product decisions, researched the workflow, tested the final behavior, and reviewed the implementation so I could explain the core design and tradeoffs.
