"use client";
import { useEffect, useState, useRef, type FormEvent } from "react";
import {
  BookOpen,
  Plus,
  List,
  FileText,
  ArrowRight,
  Download,
  CheckCircle2,
  Clock3,
  Users,
  CalendarDays,
  Pencil,
  Trash2,
  Printer,
  LogOut,
} from "lucide-react";
import {
  achievements,
  assignments,
  statuses,
  TERM_START,
  TERM_END,
  todayEastern,
  validateSession,
  summarize,
  toCsv,
  type Session,
  type SessionInput,
} from "../lib/sessions";

import StudentJourney from "./student-journey";
import DemoAccess, { type DemoRole } from "./demo-access";
import { displaySite } from "../lib/display";

type View = "log" | "history" | "report" | "journey";
const tutors = [...new Set(assignments.map((a) => a.tutor))];
function blankForm(): SessionInput {
  return {
    assignmentId: "",
    date: todayEastern(),
    hours: "",
    status: "attended",
    site: "",
    notes: "",
    achievementId: "",
  };
}
function displayDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date + "T12:00:00Z"));
}
function monthLabel(month: string) {
  return month
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(month + "-01T12:00:00Z"))
    : "All months";
}
async function request<T = { ok: boolean }>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("The service is unavailable. Please try again.");
  }
  if (!response.ok)
    throw new Error(
      (result as { error?: string }).error ||
        "Something went wrong. Please try again.",
    );
  return result as T;
}
export default function Home() {
  const [view, setView] = useState<View>("log");
  const [demoRole, setDemoRole] = useState<DemoRole | null>(null);
  const [accessReady, setAccessReady] = useState(false);
  const [rows, setRows] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState<SessionInput>(blankForm);
  const [tutor, setTutor] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [month, setMonth] = useState(() => todayEastern().slice(0, 7));
  const [studentId, setStudentId] = useState("a1");
  const [filterTutor, setFilterTutor] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const resetDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const savedRole = sessionStorage.getItem("tutor-ledger-demo-role");
    const frame = requestAnimationFrame(() => {
      if (savedRole === "tutor" || savedRole === "staff") {
        setDemoRole(savedRole);
        setView(savedRole === "tutor" ? "log" : "history");
      }
      setAccessReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (deleteTarget) deleteDialog.current?.showModal();
    else deleteDialog.current?.close();
  }, [deleteTarget]);
  useEffect(() => {
    if (resetOpen) resetDialog.current?.showModal();
    else resetDialog.current?.close();
  }, [resetOpen]);
  const today = todayEastern();
  async function refresh() {
    setLoading(true);
    setLoadError("");
    try {
      setRows(await request<Session[]>("/api/sessions"));
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  // Optional browser-agent integration. Ordinary browsers ignore this block.
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (tool: unknown, options: unknown) => unknown;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    try {
      Promise.resolve(
        context.registerTool(
          {
            name: "open_monthly_report",
            description:
              "Open the monthly reporting view for a month in the reporting year.",
            inputSchema: {
              type: "object",
              properties: {
                month: { type: "string", pattern: "^202[67]-[0-9]{2}$" },
              },
              required: ["month"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true },
            execute: async (input: { month: string }) => {
              if (
                !input ||
                typeof input.month !== "string" ||
                !/^\d{4}-(0[1-9]|1[0-2])$/.test(input.month) ||
                input.month < "2026-07" ||
                input.month > "2027-06"
              )
                throw new Error("Choose July 2026 through June 2027.");
              setMonth(input.month);
              setFilterTutor("");
              setView("report");
              await new Promise((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(resolve)),
              );
              return { month: input.month, view: "report" };
            },
          },
          { signal: controller.signal },
        ),
      ).catch(() => {});
    } catch {
      /* This optional integration never blocks the app. */
    }
    return () => controller.abort();
  }, []);
  const filtered = rows.filter(
    (r) =>
      (!month || r.date.startsWith(month)) &&
      (!filterTutor ||
        assignments.find((a) => a.id === r.assignmentId)?.tutor ===
          filterTutor),
  );
  const totals = summarize(filtered);
  const currentTotals = summarize(
    rows.filter((r) => r.date.startsWith(today.slice(0, 7))),
  );
  function navigate(next: View) {
    setView(next);
    setError("");
    setMessage("");
    if ((next === "report" || next === "journey") && !month)
      setMonth(today.slice(0, 7));
  }
  function field(key: keyof SessionInput, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      validateSession(form);
    } catch (e) {
      setError((e as Error).message);
      return;
    }
    setBusy(true);
    try {
      const saved = await request<Session>("/api/sessions", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({ ...form, id: editing }),
      });
      setRows((previous) =>
        [...previous.filter((r) => r.id !== saved.id), saved].sort((a, b) =>
          b.date.localeCompare(a.date),
        ),
      );
      setMessage(
        editing
          ? "Changes saved. The monthly report is up to date."
          : "Session saved. It is now included in the monthly report.",
      );
      setEditing(null);
      setForm((previous) => ({
        ...blankForm(),
        assignmentId: previous.assignmentId,
        site: previous.site,
      }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function edit(row: Session) {
    setEditing(row.id);
    setTutor(assignments.find((a) => a.id === row.assignmentId)!.tutor);
    setForm({ ...row, hours: row.minutes / 60 });
    setView("log");
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function remove(row: Session) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await request("/api/sessions?id=" + encodeURIComponent(row.id), {
        method: "DELETE",
      });
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setMessage("Record deleted. Report totals have been updated.");
      setDeleteTarget(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function loadExamples() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await request<{ added: number }>("/api/sample", {
        method: "POST",
      });
      await refresh();
      setMonth("2026-09");
      setMessage(
        `${result.added} fictional example records added. Existing records were kept.`,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function resetExamples() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await request<{ reset: number }>("/api/sample/reset", {
        method: "POST",
      });
      setEditing(null);
      setForm(blankForm());
      setTutor("");
      setMonth("2026-09");
      setFilterTutor("");
      await refresh();
      setResetOpen(false);
      setMessage(
        `Fictional demo reset to ${result.reset} original example records.`,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function enterDemo(role: DemoRole) {
    sessionStorage.setItem("tutor-ledger-demo-role", role);
    setDemoRole(role);
    setView(role === "tutor" ? "log" : "history");
  }
  function exitDemo() {
    sessionStorage.removeItem("tutor-ledger-demo-role");
    setDemoRole(null);
    setEditing(null);
    setError("");
    setMessage("");
  }
  function exportCsv() {
    const url = URL.createObjectURL(
      new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `tutor-ledger-${month || "all-months"}${filterTutor ? "-" + filterTutor.toLowerCase().replaceAll(" ", "-") : ""}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function recordTable(records: Session[], actions = true) {
    return (
      <div className="table-wrap mobile-records">
        <table>
          <caption className="sr-only">Individual session records</caption>
          <thead>
            <tr>
              <th>Date</th>
              <th>Student / tutor</th>
              <th>Attendance</th>
              <th className="number">Hours</th>
              <th>Site & achievements</th>
              {actions && (
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {records.map((row) => {
              const assignment = assignments.find(
                (a) => a.id === row.assignmentId,
              )!;
              return (
                <tr key={row.id}>
                  <td className="nowrap">{displayDate(row.date)}</td>
                  <td>
                    <button
                      className="student-link"
                      onClick={() => {
                        setStudentId(assignment.id);
                        navigate("journey");
                      }}
                    >
                      {assignment.student}
                    </button>
                    <small>{assignment.tutor}</small>
                  </td>
                  <td>
                    <span
                      className={
                        "badge " +
                        (row.status === "attended" ? "attended" : "missed")
                      }
                    >
                      {statuses[row.status]}
                    </span>
                  </td>
                  <td className="number" data-label="Hours">{row.minutes / 60}</td>
                  <td className="notes">
                    <span>{displaySite(row.site) || "—"}</span>
                    {row.achievementId && (
                      <small className="achievement-label">
                        Achievement:{" "}
                        {
                          achievements.find((g) => g.id === row.achievementId)
                            ?.label
                        }
                      </small>
                    )}
                    {row.notes && <small>{row.notes}</small>}
                  </td>
                  {actions && (
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          aria-label={`Edit ${assignment.student} on ${row.date}`}
                          disabled={busy}
                          onClick={() => edit(row)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="icon-button danger"
                          aria-label={`Delete ${assignment.student} on ${row.date}`}
                          disabled={busy}
                          onClick={() => {
                            setError("");
                            setDeleteTarget(row);
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
  if (!accessReady) {
    return (
      <div className="access-page">
        <p role="status">Loading Tutor Ledger…</p>
      </div>
    );
  }
  if (!demoRole) return <DemoAccess onEnter={enterDemo} />;

  const navigation =
    demoRole === "tutor"
      ? ([
          { key: "log", label: "Log session", icon: Plus },
          { key: "history", label: "Session history", icon: List },
          { key: "journey", label: "Student Progress", icon: Users },
        ] as const)
      : ([
          { key: "history", label: "Session history", icon: List },
          { key: "journey", label: "Student Progress", icon: Users },
          { key: "report", label: "Monthly report", icon: FileText },
        ] as const);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">
            <BookOpen size={23} />
          </span>
          <div>
            Tutor Ledger<small>LVAEP Reporting Prototype · FY 2026–2027</small>
          </div>
        </div>
        <div className="role-controls">
          <span className="year-label">
            Reporting year <strong>2026–27</strong>
          </span>
          <span className="role-chip">{demoRole === "tutor" ? "Tutor" : "Staff"} demo</span>
          <button className="switch-role" onClick={exitDemo}>
            <LogOut size={15} />
            Switch demo role
          </button>
        </div>
      </header>
      <div className="demo-banner">
        <span className="demo-tag">PUBLIC DEMO</span>
        <span>
          Fictional information only. Records are shared with all visitors. Not
          an official LVAEP system.
        </span>
      </div>
      <nav aria-label="Main navigation">
        {navigation.map((item) => (
          <button
            key={item.key}
            className={view === item.key ? "active" : ""}
            aria-current={view === item.key ? "page" : undefined}
            onClick={() => navigate(item.key)}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>
      <main>
        <section className="onboarding panel">
          <div>
            <h2>How Tutor Ledger works</h2>
            <ol>
              <li>Record attendance and session details.</li>
              <li>Review or correct previous records.</li>
              <li>Track student progress and achievements.</li>
              <li>Generate monthly staff reports.</li>
            </ol>
          </div>
          <div className="demo-actions">
            <p>
              <strong>Trying the prototype?</strong>
              <span>Load fictional examples to explore the full workflow.</span>
            </p>
            <div className="button-group">
              <button
                className="secondary"
                disabled={busy || loading || !!loadError}
                onClick={() => void loadExamples()}
              >
                Load fictional examples
              </button>
              <button
                className="text-button reset-button"
                disabled={busy || loading || !!loadError}
                onClick={() => {
                  setError("");
                  setResetOpen(true);
                }}
              >
                Reset fictional demo
              </button>
            </div>
          </div>
        </section>
        <div className="page-heading">
          <div>
            <p className="eyebrow">
              {view === "log" ? "TUTOR WORKSPACE" : "PROGRAM RECORDS"}
            </p>
            <h1>
              {view === "log"
                ? editing
                  ? "Edit session"
                  : "Log a session"
                : view === "history"
                  ? "Session history"
                  : view === "journey"
                    ? "Student Progress"
                    : "Monthly report"}
            </h1>
            <p>
              {view === "log"
                ? "Add attendance and session details."
                : view === "history"
                  ? "Review attendance, update details, and correct records."
                  : view === "journey"
                    ? "Tutoring time and learner achievements, together."
                    : "Tutoring hours and attendance, ready for staff review."}
            </p>
          </div>
          {view !== "log" && (
            <button
              className="secondary"
              disabled={busy || loading}
              onClick={() => void refresh()}
            >
              Refresh records
            </button>
          )}
        </div>
        {message && (
          <div className="notice success" role="status">
            <CheckCircle2 size={19} />
            {message}
          </div>
        )}
        {error && (
          <div className="notice error" role="alert">
            {error}
          </div>
        )}
        {loadError && (
          <div className="notice error" role="alert">
            {loadError}
            <button onClick={() => void refresh()}>Retry loading</button>
          </div>
        )}
        {view === "log" ? (
          <div className="log-layout">
            <section className="panel form-panel">
              <div className="panel-heading">
                <h2>{editing ? "Session details" : "New session"}</h2>
                <span>Required unless marked optional</span>
              </div>
              <form onSubmit={save}>
                <fieldset disabled={busy || loading || !!loadError}>
                  <div className="field-grid">
                    <label>
                      Tutor
                      <select
                        required
                        value={tutor}
                        onChange={(e) => {
                          setTutor(e.target.value);
                          field("assignmentId", "");
                        }}
                      >
                        <option value="">Select a tutor</option>
                        {tutors.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Student
                      <select
                        required
                        disabled={!tutor || busy}
                        value={form.assignmentId}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            assignmentId: e.target.value,
                            site:
                              assignments.find((a) => a.id === e.target.value)
                                ?.site || "",
                          }))
                        }
                      >
                        <option value="">
                          {tutor ? "Select a student" : "Choose a tutor first"}
                        </option>
                        {assignments
                          .filter((a) => a.tutor === tutor)
                          .map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.student}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label>
                      Session date
                      <input
                        required
                        type="date"
                        min={TERM_START}
                        max={today < TERM_END ? today : TERM_END}
                        value={form.date}
                        onInput={(e) => field("date", e.currentTarget.value)}
                        onChange={(e) => field("date", e.target.value)}
                      />
                    </label>
                    <label>
                      Attendance
                      <select
                        required
                        value={form.status}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            status: e.target.value,
                            hours: e.target.value === "attended" ? "" : 0,
                          }))
                        }
                      >
                        {Object.entries(statuses).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Hours
                      <input
                        required
                        type="number"
                        inputMode="decimal"
                        min={form.status === "attended" ? 0.25 : 0}
                        max={8}
                        step={0.25}
                        disabled={form.status !== "attended"}
                        placeholder="e.g. 1.5"
                        value={form.hours}
                        onChange={(e) => field("hours", e.target.value)}
                      />
                      <small>
                        {form.status === "attended"
                          ? "15-minute increments · 0.25 to 8 hours"
                          : "Absences and holidays count as 0 hours."}
                      </small>
                    </label>
                    <label>
                      Tutoring site <span className="optional">(optional)</span>
                      <input
                        maxLength={100}
                        placeholder="e.g. Bloomfield Public Library or Online"
                        value={displaySite(form.site)}
                        onChange={(e) => field("site", e.target.value)}
                      />
                    </label>
                  </div>
                  <label className="notes-field">
                    Achievement attained{" "}
                    <span className="optional">(optional)</span>
                    <select
                      value={form.achievementId || ""}
                      onChange={(e) => field("achievementId", e.target.value)}
                    >
                      <option value="">No achievement reported</option>
                      {[...new Set(achievements.map((a) => a.category))].map(
                        (category) => (
                          <optgroup key={category} label={category}>
                            {achievements
                              .filter((a) => a.category === category)
                              .map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.label}
                                </option>
                              ))}
                          </optgroup>
                        ),
                      )}
                    </select>
                    <small>
                      Select a learner achievement to report with this session. The session date is used as the reporting date.
                    </small>
                  </label>
                  <label className="notes-field">
                    Progress notes{" "}
                    <span className="optional">(optional)</span>
                    <textarea
                      rows={3}
                      maxLength={500}
                      placeholder="e.g. Completed a reading goal or practiced a job application."
                      value={form.notes}
                      onChange={(e) => field("notes", e.target.value)}
                    />
                    <small>
                      Record learning progress, context, or other notes.{" "}
                      {form.notes.length}/500
                    </small>
                  </label>
                  <div className="form-bottom">
                    <span>One record per student per day.</span>
                    <div className="button-group">
                      {editing && (
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => {
                            setEditing(null);
                            setForm(blankForm());
                            setTutor("");
                            setError("");
                          }}
                        >
                          Cancel edit
                        </button>
                      )}
                      <button className="primary" type="submit">
                        {busy
                          ? "Saving…"
                          : editing
                            ? "Save changes"
                            : "Save session"}
                        <ArrowRight size={17} />
                      </button>
                    </div>
                  </div>
                </fieldset>
              </form>
            </section>
            <aside className="sidebar">
              <section className="month-card">
                <p className="eyebrow">{monthLabel(today.slice(0, 7))}</p>
                <h2>This month so far</h2>
                {loading ? (
                  <p>Loading records…</p>
                ) : loadError ? (
                  <p>Totals unavailable</p>
                ) : (
                  <>
                    <div className="hero-number">
                      {currentTotals.hours}
                      <span>tutoring hours</span>
                    </div>
                    <div className="mini-stats">
                      <span>
                        <strong>{currentTotals.sessions}</strong>sessions held
                      </span>
                      <span>
                        <strong>{currentTotals.students}</strong>students
                        tutored
                      </span>
                    </div>
                  </>
                )}
                <button
                  onClick={() => {
                    setMonth(today.slice(0, 7));
                    setFilterTutor("");
                    navigate(demoRole === "staff" ? "report" : "journey");
                  }}
                >
                  {demoRole === "staff"
                    ? "View monthly report"
                    : "View student progress"}
                  <ArrowRight size={16} />
                </button>
              </section>
              <section className="help-card">
                <h3>From session to report</h3>
                <ol>
                  <li>Select your assigned student.</li>
                  <li>Record hours or an absence.</li>
                  <li>Review monthly totals automatically.</li>
                </ol>
                <p>
                  Multiple meetings in one day? Combine their hours in a single
                  record.
                </p>
              </section>
            </aside>
          </div>
        ) : view === "journey" ? (
          loading ? (
            <div className="empty panel" role="status">
              Loading saved records…
            </div>
          ) : loadError ? (
            <div className="empty panel">
              Records are unavailable. Retry loading above.
            </div>
          ) : (
            <StudentJourney
              rows={rows}
              studentId={studentId}
              onStudentChange={setStudentId}
              month={month}
              onMonthChange={setMonth}
              onEdit={demoRole === "tutor" ? edit : undefined}
            />
          )
        ) : (
          <>
            <section className="filters panel" aria-label="Report filters">
              <label>
                Month
                <input
                  type="month"
                  onInput={(e) =>
                    setMonth(
                      e.currentTarget.value ||
                        (view === "report" ? today.slice(0, 7) : ""),
                    )
                  }
                  min="2026-07"
                  max="2027-06"
                  value={month}
                  onChange={(e) =>
                    setMonth(
                      e.target.value ||
                        (view === "report" ? today.slice(0, 7) : ""),
                    )
                  }
                />
              </label>
              <label>
                Tutor
                <select
                  value={filterTutor}
                  onChange={(e) => setFilterTutor(e.target.value)}
                >
                  <option value="">All tutors</option>
                  {tutors.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              {view === "history" && (
                <button className="text-button" onClick={() => setMonth("")}>
                  Show all months
                </button>
              )}
              <div className="filter-end">
                {view === "report" && (
                  <button
                    className="secondary"
                    onClick={exportCsv}
                    disabled={!filtered.length || loading || !!loadError}
                  >
                    <Download size={17} />
                    Export CSV
                  </button>
                )}
                {view === "report" && (
                  <button
                    className="secondary"
                    onClick={() => window.print()}
                    disabled={loading || !!loadError}
                  >
                    <Printer size={17} />
                    Print / Save as PDF
                  </button>
                )}
              </div>
            </section>
            {loading ? (
              <div className="empty panel" role="status">
                Loading saved records…
              </div>
            ) : loadError ? (
              <div className="empty panel">
                Records are unavailable. Retry loading above.
              </div>
            ) : (
              <>
                {view === "report" && (
                  <>
                    <div className="report-title">
                      <h2>{monthLabel(month)}</h2>
                      <span>
                        {filterTutor || "All tutors"} · {filtered.length}{" "}
                        attendance records
                      </span>
                    </div>
                    <div className="stat-grid">
                      {[
                        {
                          label: "Tutoring hours",
                          value: totals.hours,
                          icon: Clock3,
                        },
                        {
                          label: "Sessions held",
                          value: totals.sessions,
                          icon: CalendarDays,
                        },
                        {
                          label: "Students tutored",
                          value: totals.students,
                          icon: Users,
                        },
                        {
                          label: "Absences / holidays",
                          value: totals.missed,
                          icon: List,
                        },
                      ].map((stat) => (
                        <div className="stat panel" key={stat.label}>
                          <stat.icon size={20} />
                          <strong>{stat.value}</strong>
                          <span>{stat.label}</span>
                        </div>
                      ))}
                    </div>
                    {filtered.length > 0 && (
                      <section className="panel summary-panel">
                        <div className="panel-heading">
                          <h2>By student & tutor</h2>
                          <span>Hours include attended sessions only</span>
                        </div>
                        <div className="table-wrap mobile-summary">
                          <table>
                            <caption className="sr-only">
                              Totals by tutor-student assignment
                            </caption>
                            <thead>
                              <tr>
                                <th>Student</th>
                                <th>Tutor</th>
                                <th className="number">Sessions held</th>
                                <th className="number">Absences / holidays</th>
                                <th className="number">Hours</th>
                              </tr>
                            </thead>
                            <tbody>
                              {assignments
                                .filter((a) =>
                                  filtered.some((r) => r.assignmentId === a.id),
                                )
                                .map((a) => {
                                  const summary = summarize(
                                    filtered.filter(
                                      (r) => r.assignmentId === a.id,
                                    ),
                                  );
                                  return (
                                    <tr key={a.id}>
                                      <td>
                                        <button
                                          className="student-link"
                                          onClick={() => {
                                            setStudentId(a.id);
                                            navigate("journey");
                                          }}
                                        >
                                          {a.student}
                                        </button>
                                        <small>
                                          {a.program} · {a.site}
                                        </small>
                                      </td>
                                      <td data-label="Tutor">{a.tutor}</td>
                                      <td className="number" data-label="Sessions held">
                                        {summary.sessions}
                                      </td>
                                      <td className="number" data-label="Absences / holidays">
                                        {summary.missed}
                                      </td>
                                      <td className="number" data-label="Hours">
                                        <strong>{summary.hours}</strong>
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                            <tfoot>
                              <tr>
                                <th colSpan={2}>Total</th>
                                <td className="number" data-label="Sessions held">{totals.sessions}</td>
                                <td className="number" data-label="Absences / holidays">{totals.missed}</td>
                                <td className="number" data-label="Hours">{totals.hours}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </section>
                    )}
                  </>
                )}
                <section className="panel records-panel">
                  <div className="panel-heading">
                    <h2>
                      {view === "report"
                        ? "Individual records"
                        : "Recorded sessions"}
                    </h2>
                    <span>
                      {filtered.length}{" "}
                      {filtered.length === 1 ? "record" : "records"}
                      {view === "history" ? " · " + monthLabel(month) : ""}
                    </span>
                  </div>
                  {filtered.length ? (
                    recordTable(filtered, demoRole === "tutor")
                  ) : (
                    <div className="empty">
                      <FileText size={30} />
                      <h3>No records for this selection</h3>
                      <p>
                        Choose another month or tutor, or log your first
                        session.
                      </p>
                      {demoRole === "tutor" && (
                        <button
                          className="primary"
                          onClick={() => navigate("log")}
                        >
                          <Plus size={17} />
                          Log a session
                        </button>
                      )}
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </main>
      <dialog
        ref={deleteDialog}
        className="delete-dialog"
        aria-labelledby="delete-title"
        onCancel={(event) => {
          if (busy) event.preventDefault();
          else setDeleteTarget(null);
        }}
      >
        <h2 id="delete-title">Delete this attendance record?</h2>
        <p>
          {deleteTarget &&
            `${assignments.find((a) => a.id === deleteTarget.assignmentId)?.student} · ${displayDate(deleteTarget.date)}`}
        </p>
        <p>
          The record will be removed from history and report totals. This cannot
          be undone.
        </p>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        <div className="button-group">
          <button
            className="secondary"
            autoFocus
            disabled={busy}
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </button>
          <button
            className="primary delete-confirm"
            disabled={busy}
            onClick={() => deleteTarget && void remove(deleteTarget)}
          >
            {busy ? "Deleting…" : "Delete record"}
          </button>
        </div>
      </dialog>
      <dialog
        ref={resetDialog}
        className="delete-dialog"
        aria-labelledby="reset-title"
        onCancel={(event) => {
          if (busy) event.preventDefault();
          else setResetOpen(false);
        }}
      >
        <h2 id="reset-title">Reset fictional demo?</h2>
        <p>
          Reset the shared fictional demo to its original example records? This
          will remove changes made to the demo data.
        </p>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        <div className="button-group">
          <button
            className="secondary"
            autoFocus
            disabled={busy}
            onClick={() => setResetOpen(false)}
          >
            Cancel
          </button>
          <button
            className="primary delete-confirm"
            disabled={busy}
            onClick={() => void resetExamples()}
          >
            {busy ? "Resetting…" : "Reset demo"}
          </button>
        </div>
      </dialog>
      <footer>
        <span>Tutor Ledger · CSS take-home project</span>
        <span>July 1, 2026 – June 30, 2027 · Dates use Eastern time</span>
      </footer>
    </div>
  );
}
