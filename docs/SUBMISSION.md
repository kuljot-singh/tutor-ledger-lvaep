# CSS submission: assumptions / design decisions

I interpreted the original grid as one attendance record per student assignment per day, combining same-day meetings, within July–June FY 2026–2027. Absence types are explicit zero-hour records rather than missing entries. Durations are stored as whole minutes; quarter-hour increments and a daily 0.25–8 hour range are assumptions to confirm with staff. Monthly reports are derived from the underlying records so edits remain consistent.

I used a fixed fictional roster to focus on the tutor-to-staff reporting workflow. LVAEP research informed program/site details and neutral progress toward its published 16 tutoring hours per month; homework is excluded. Student Progress combines attendance with achievements from the supplied form. One optional achievement is attached to its reporting record, and a stopped learner retains history.

This shared public prototype has no authentication and must not contain real student information. Server-enforced tutor/staff access, audit history, roster administration, and requirements confirmed with staff would be production priorities. AI assisted implementation, debugging, tests, and documentation; I am responsible for understanding and explaining the decisions and core workflow.
