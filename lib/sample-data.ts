import { todayEastern, type SessionInput } from "./sessions";

// A fixed fictional dataset makes the public prototype easy to restore.
export function sampleSessions(today = todayEastern()): SessionInput[] {
  const examples: SessionInput[] = [
    {
      assignmentId: "a1",
      date: "2026-09-08",
      hours: 1.5,
      status: "attended",
      site: "Bloomfield Public Library",
      notes: "Practiced reading a job application.",
      achievementId: "",
    },
    {
      assignmentId: "a2",
      date: "2026-09-10",
      hours: 2,
      status: "attended",
      site: "Online",
      notes: "Completed a practice reading assessment.",
      achievementId: "",
    },
    {
      assignmentId: "a3",
      date: "2026-09-14",
      hours: 1.25,
      status: "attended",
      site: "Bloomfield Public Library",
      notes: "Read a library book independently.",
      achievementId: "",
    },
    {
      assignmentId: "a1",
      date: "2026-09-15",
      hours: 0,
      status: "student_absent",
      site: "Bloomfield Public Library",
      notes: "",
      achievementId: "",
    },
    {
      assignmentId: "a1",
      date: "2026-08-25",
      hours: 1,
      status: "attended",
      site: "Online",
      notes: "Reviewed vocabulary.",
      achievementId: "",
    },
    ...["01", "03", "07", "11", "16", "21"].map(
      (day): SessionInput => ({
        assignmentId: "a1",
        date: `2026-09-${day}`,
        hours: 2,
        status: "attended",
        site: "Bloomfield Public Library",
        notes:
          day === "21"
            ? "Fictional milestone: Jamie attended a school activity with their child."
            : "Reading and conversation practice.",
        achievementId: day === "21" ? "school_activities" : "",
      }),
    ),
    {
      assignmentId: "a2",
      date: "2026-09-18",
      hours: 1,
      status: "attended",
      site: "Online",
      notes: "Fictional milestone: Sam began an occupational skills course.",
      achievementId: "occupational_training",
    },
    {
      assignmentId: "a3",
      date: "2026-09-04",
      hours: 1.5,
      status: "attended",
      site: "Passaic Public Library",
      notes: "Fictional milestone recorded before tutoring stopped.",
      achievementId: "retain_employment",
    },
    {
      assignmentId: "a2",
      date: "2026-09-07",
      hours: 0,
      status: "holiday",
      site: "Online",
      notes: "",
      achievementId: "",
    },
  ];

  return examples.filter((row) => row.date <= today);
}
