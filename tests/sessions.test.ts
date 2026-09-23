import test from "node:test";
import assert from "node:assert/strict";
// Node 22 can run this pure TypeScript file without a test framework.
// @ts-ignore Node requires the extension; the app bundler resolves it normally.
import { validateSession, summarize, toCsv, studentProgress } from "../lib/sessions.ts";
const valid = {
  assignmentId: "a1",
  date: "2026-09-10",
  hours: 1.5,
  status: "attended",
  site: " Library ",
  notes: " Reading goal ",
};
const validate = (input: unknown) => validateSession(input, "2026-09-22");
test("stores hours as whole minutes and trims optional text", () => {
  assert.deepEqual(validate(valid), {
    assignmentId: "a1",
    date: "2026-09-10",
    minutes: 90,
    achievementId: "",
    status: "attended",
    site: "Library",
    notes: "Reading goal",
  });
});
test("rejects missing or unknown assignment and invalid attendance", () => {
  for (const input of [
    null,
    {},
    { ...valid, assignmentId: "not-real" },
    { ...valid, status: "constructor" },
  ])
    assert.throws(() => validate(input));
});
test("rejects invalid calendar days, future dates, and dates outside the reporting year", () => {
  for (const date of [
    "2026-09-31",
    "2026-02-30",
    "not a date",
    "2026-09-23",
    "2026-06-30",
    "2027-07-01",
  ])
    assert.throws(() => validate({ ...valid, date }));
});
test("accepts reporting-year boundaries when they are not in the future", () => {
  assert.equal(validate({ ...valid, date: "2026-07-01" }).date, "2026-07-01");
  assert.equal(
    validateSession({ ...valid, date: "2027-06-30" }, "2027-06-30").date,
    "2027-06-30",
  );
});
test("enforces quarter-hour increments and 0.25–8 hour limits", () => {
  for (const hours of ["", 0, -1, 8.25, 1.1, "no", NaN, Infinity, null, []])
    assert.throws(() => validate({ ...valid, hours }));
  assert.equal(validate({ ...valid, hours: 0.25 }).minutes, 15);
  assert.equal(validate({ ...valid, hours: 8 }).minutes, 480);
});
test("all absence codes require exactly zero hours", () => {
  for (const status of ["student_absent", "tutor_absent", "holiday"]) {
    assert.equal(validate({ ...valid, status, hours: 0 }).minutes, 0);
    assert.throws(() => validate({ ...valid, status, hours: 1 }));
  }
});
test("bounds free text and rejects malformed optional fields", () => {
  assert.throws(() => validate({ ...valid, site: "x".repeat(101) }));
  assert.throws(() => validate({ ...valid, notes: "x".repeat(501) }));
  assert.throws(() => validate({ ...valid, site: null }));
});
test("monthly totals exclude absences and count each tutored student once", () => {
  const rows = [
    { id: "1", ...validate(valid) },
    { id: "2", ...validate({ ...valid, date: "2026-09-11", hours: 0.25 }) },
    {
      id: "3",
      ...validate({
        ...valid,
        assignmentId: "a2",
        status: "student_absent",
        hours: 0,
      }),
    },
  ];
  assert.deepEqual(summarize(rows), {
    hours: 1.75,
    sessions: 2,
    students: 1,
    missed: 1,
  });
  assert.deepEqual(summarize([]), {
    hours: 0,
    sessions: 0,
    students: 0,
    missed: 0,
  });
});
test("CSV preserves notes and neutralizes formula-like text", () => {
  const csv = toCsv([
    { id: "1", ...validate({ ...valid, notes: "=1+1", site: 'Library, "A"' }) },
  ]);
  assert.ok(csv.includes('"\'=1+1"'));
  assert.ok(csv.includes('"Library, ""A"""'));
  assert.equal(csv.split("\r\n").length, 2);
});

test("progress isolates learner/month and excludes every non-attended status", () => {
  const row = { id: "one", ...validate(valid) };
  const rows = [
    row,
    { ...row, id: "aug", date: "2026-08-10", minutes: 120 },
    { ...row, id: "other", assignmentId: "a2", minutes: 480 },
    ...(["student_absent", "tutor_absent", "holiday"] as const).map(
      (status, i) => ({
        ...row,
        id: String(i),
        date: "2026-09-22",
        status,
        minutes: 0,
      }),
    ),
  ];
  const result = studentProgress(rows, "a1", "2026-09");
  assert.equal(result.monthlyHours, 1.5);
  assert.equal(result.totalHours, 3.5);
  assert.equal(result.lastAttended, "2026-09-10");
  assert.equal(result.timeline.length, 5);
  assert.equal(result.timeline[0].date, "2026-09-22");
  assert.equal(studentProgress(rows, "a1", "2026-07").monthlyHours, 0);
  assert.equal(studentProgress([], "a1", "2026-09").lastAttended, null);
});
test("progress shows actual hours above the reference, without truncating totals", () => {
  const rows = [1, 2, 3].map((i) => ({
    id: String(i),
    ...validate({ ...valid, date: `2026-09-0${i}`, hours: 8 }),
  }));
  assert.equal(studentProgress(rows, "a1", "2026-09").monthlyHours, 24);
});
test("achievement choices are optional, validated and preserved in CSV", () => {
  assert.equal(validate(valid).achievementId, "");
  assert.throws(() => validate({ ...valid, achievementId: "made_up" }));
  assert.throws(() => validate({ ...valid, achievementId: [] }));
  assert.throws(() =>
    validate({ ...valid, achievementId: "other", notes: " " }),
  );
  assert.equal(
    validate({ ...valid, achievementId: "other" }).achievementId,
    "other",
  );
  const row = {
    id: "goal",
    ...validate({ ...valid, achievementId: "school_activities" }),
  };
  assert.equal(
    studentProgress([row], "a1", "2026-09").timeline[0].achievementId,
    "school_activities",
  );
  const csv = toCsv([row]);
  assert.ok(csv.includes('"Family"'));
  assert.ok(csv.includes("More involvement in child(ren)'s school activities"));
  assert.ok(csv.includes('"ESOL"'));
});
