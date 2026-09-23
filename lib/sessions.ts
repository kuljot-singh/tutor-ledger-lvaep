// Fixed fictional assignments keep this take-home focused on reporting.
export const assignments = [
  {
    id: "a1",
    tutor: "Alex Morgan",
    student: "Jamie Rivera",
    program: "ESOL",
    site: "Bloomfield Public Library",
    status: "Active",
    stoppedReason: "",
  },
  {
    id: "a2",
    tutor: "Alex Morgan",
    student: "Sam Chen",
    program: "Basic Literacy",
    site: "Online",
    status: "Active",
    stoppedReason: "",
  },
  {
    id: "a3",
    tutor: "Taylor Brooks",
    student: "Jordan Ellis",
    program: "ESOL",
    site: "Passaic Public Library",
    status: "Stopped",
    stoppedReason: "Work schedule changed (fictional example)",
  },
];

// Labels transcribed from the supplied attendance/achievement form.
// Store a stable choice ID, deriving the category and label in one place.
export const achievements = [
  { id: "enter_employment", category: "Economic", label: "Enter Employment" },
  { id: "retain_employment", category: "Economic", label: "Retain Employment" },
  {
    id: "leave_assistance",
    category: "Economic",
    label: "Leave public assistance",
  },
  {
    id: "work_project",
    category: "Educational",
    label: "Achieve work-based project learner goal",
  },
  {
    id: "occupational_training",
    category: "Educational",
    label: "Enter Occupational Skills Training Program",
  },
  {
    id: "postsecondary",
    category: "Educational",
    label: "Enter Postsecondary Education",
  },
  {
    id: "diploma",
    category: "Educational",
    label: "Obtain High School Diploma",
  },
  {
    id: "help_school",
    category: "Family",
    label: "Help more frequently with school",
  },
  {
    id: "teacher_contact",
    category: "Family",
    label: "Increase contact with child(ren)'s teachers",
  },
  {
    id: "school_activities",
    category: "Family",
    label: "More involvement in child(ren)'s school activities",
  },
  {
    id: "purchase_books",
    category: "Family",
    label: "Purchase books or magazines",
  },
  { id: "read_children", category: "Family", label: "Read to child(ren)" },
  {
    id: "visit_library",
    category: "Family",
    label: "Visit the library (with/for child(ren))",
  },
  {
    id: "citizenship",
    category: "Societal / Community",
    label: "Obtain citizenship",
  },
  {
    id: "civics",
    category: "Societal / Community",
    label: "Achieve civics skills",
  },
  {
    id: "community",
    category: "Societal / Community",
    label: "Increase involvement in community activities",
  },
  {
    id: "vote",
    category: "Societal / Community",
    label: "Vote or register to vote",
  },
  {
    id: "other",
    category: "Other",
    label: "Other achievement — describe in notes",
  },
];
export const MONTHLY_TUTORING_HOURS = 16;
export function studentProgress(
  rows: Session[],
  assignmentId: string,
  month: string,
) {
  const records = rows.filter((r) => r.assignmentId === assignmentId);
  const attended = records.filter((r) => r.status === "attended");
  return {
    monthlyHours: summarize(attended.filter((r) => r.date.startsWith(month)))
      .hours,
    totalHours: summarize(attended).hours,
    lastAttended:
      attended
        .map((r) => r.date)
        .sort()
        .at(-1) ?? null,
    timeline: [...records].sort((a, b) => b.date.localeCompare(a.date)),
  };
}

export const statuses = {
  attended: "Attended",
  student_absent: "Student absent",
  tutor_absent: "Tutor absent",
  holiday: "Holiday",
};
export type Status = keyof typeof statuses;
export type Session = {
  id: string;
  assignmentId: string;
  date: string;
  minutes: number;
  status: Status;
  site: string;
  notes: string;
  achievementId?: string;
};
export type SessionInput = {
  assignmentId: string;
  date: string;
  hours: string | number;
  status: string;
  site: string;
  notes: string;
  achievementId?: string;
};
export const TERM_START = "2026-07-01";
export const TERM_END = "2027-06-30";
export function todayEastern() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function validateSession(
  input: unknown,
  today = todayEastern(),
): Omit<Session, "id"> {
  if (!input || typeof input !== "object")
    throw new Error("Enter the session details.");
  const value = input as Record<string, unknown>;
  if (!assignments.some((a) => a.id === value.assignmentId))
    throw new Error("Choose an assigned tutor and student.");
  const date = value.date;
  if (
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(date)) ||
    new Date(date).toISOString().slice(0, 10) !== date
  )
    throw new Error("Enter a valid session date.");
  if (date < TERM_START || date > TERM_END)
    throw new Error("Choose a date in the July 2026–June 2027 reporting year.");
  if (date > today) throw new Error("Session dates cannot be in the future.");
  if (
    typeof value.status !== "string" ||
    !Object.hasOwn(statuses, value.status)
  )
    throw new Error("Choose an attendance status.");
  const status = value.status as Status;
  if (!["string", "number"].includes(typeof value.hours) || value.hours === "")
    throw new Error("Enter the number of hours.");
  const hours = Number(value.hours);
  if (!Number.isFinite(hours))
    throw new Error("Enter a valid number of hours.");
  if (
    status === "attended" &&
    (hours < 0.25 || hours > 8 || !Number.isInteger(hours * 4))
  )
    throw new Error("Use 0.25–8 hours, in 15-minute (0.25-hour) increments.");
  if (status !== "attended" && hours !== 0)
    throw new Error("Absences and holidays must have zero hours.");
  if (typeof value.site !== "string" || value.site.trim().length > 100)
    throw new Error("Keep the tutoring site to 100 characters.");
  if (typeof value.notes !== "string" || value.notes.trim().length > 500)
    throw new Error("Keep achievement notes to 500 characters.");
  const achievementId = value.achievementId ?? "";
  if (
    typeof achievementId !== "string" ||
    (achievementId !== "" && !achievements.some((a) => a.id === achievementId))
  )
    throw new Error("Choose an achievement from the list, or leave it blank.");
  if (achievementId === "other" && !value.notes.trim())
    throw new Error("Describe the other achievement in notes.");
  return {
    achievementId,
    assignmentId: value.assignmentId as string,
    date,
    minutes: hours * 60,
    status,
    site: value.site.trim(),
    notes: value.notes.trim(),
  };
}
export function summarize(rows: Session[]) {
  const attended = rows.filter((r) => r.status === "attended");
  return {
    hours: attended.reduce((sum, r) => sum + r.minutes, 0) / 60,
    sessions: attended.length,
    students: new Set(attended.map((r) => r.assignmentId)).size,
    missed: rows.length - attended.length,
  };
}
export function csvCell(value: unknown) {
  let text = String(value ?? "");
  // Prevent spreadsheet applications from treating user-entered text as a formula.
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export function toCsv(rows: Session[]) {
  const lines: unknown[][] = [
    [
      "Date",
      "Tutor",
      "Student",
      "Attendance",
      "Hours",
      "Tutoring site",
      "Achievement notes",
      "Program",
      "Assigned site",
      "Achievement category",
      "Achievement",
    ],
  ];
  for (const row of rows) {
    const a = assignments.find((a) => a.id === row.assignmentId)!;
    lines.push([
      row.date,
      a.tutor,
      a.student,
      statuses[row.status],
      row.minutes / 60,
      row.site,
      row.notes,
      a.program,
      a.site,
      achievements.find((g) => g.id === row.achievementId)?.category || "",
      achievements.find((g) => g.id === row.achievementId)?.label || "",
    ]);
  }
  return (
    "\uFEFF" + lines.map((line) => line.map(csvCell).join(",")).join("\r\n")
  );
}
