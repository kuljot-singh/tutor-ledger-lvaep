import { displaySite } from "../lib/display";
import {
  assignments,
  achievements,
  statuses,
  studentProgress,
  MONTHLY_TUTORING_HOURS,
  type Session,
} from "../lib/sessions";

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date + "T12:00:00Z"));
}

export default function StudentJourney({
  rows,
  studentId,
  onStudentChange,
  month,
  onMonthChange,
  onEdit,
}: {
  rows: Session[];
  studentId: string;
  onStudentChange: (id: string) => void;
  month: string;
  onMonthChange: (month: string) => void;
  onEdit?: (row: Session) => void;
}) {
  const student = assignments.find((a) => a.id === studentId)!;
  const progress = studentProgress(rows, studentId, month);
  return (
    <div className="journey">
      <section className="filters panel" aria-label="Student Progress filters">
        <label>
          Student profile
          <select
            value={studentId}
            onChange={(e) => onStudentChange(e.target.value)}
          >
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.student}
              </option>
            ))}
          </select>
        </label>
        <label>
          Progress month
          <input
            type="month"
            min="2026-07"
            max="2027-06"
            value={month}
            onInput={(e) => {
              if (e.currentTarget.value) onMonthChange(e.currentTarget.value);
            }}
            onChange={(e) => {
              if (e.target.value) onMonthChange(e.target.value);
            }}
          />
        </label>
        <small>Fictional learners and assignments</small>
      </section>
      <section className="panel journey-profile" aria-label="Student profile">
        <div>
          <p className="eyebrow">LEARNER PROFILE</p>
          <h2>{student.student}</h2>
          <p>
            {student.program} · {student.site}
          </p>
          <p>Tutor: {student.tutor}</p>
          <span
            className={`badge ${student.status === "Active" ? "attended" : "missed"}`}
          >
            {student.status}
          </span>
          {student.stoppedReason && (
            <p className="stopped-reason">
              {student.stoppedReason}. Historical records are retained.
            </p>
          )}
        </div>
        <div className="journey-progress">
          <h3>Monthly tutoring progress</h3>
          <p>
            {new Intl.DateTimeFormat("en-US", {
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            }).format(new Date(month + "-01T12:00:00Z"))}
          </p>
          <p className="progress-number">
            {progress.monthlyHours} / {MONTHLY_TUTORING_HOURS}{" "}
            <span>hours recorded</span>
          </p>
          <progress
            aria-label="Monthly tutoring hours recorded"
            value={Math.min(progress.monthlyHours, MONTHLY_TUTORING_HOURS)}
            max={MONTHLY_TUTORING_HOURS}
          />
          <small>
            LVAEP publishes a minimum of 16 tutoring hours per month. Attended
            tutoring only; homework is not included. This is recorded time, not
            a judgment of the learner.
          </small>
          {student.status === "Stopped" && (
            <small>
              Stopped learner: the reference is shown for historical context,
              not a current obligation.
            </small>
          )}
        </div>
      </section>
      <div className="journey-facts">
        <p>
          <strong>{progress.totalHours} hours</strong>
          <small>Cumulative tutoring in these demo records</small>
        </p>
        <p>
          <strong>
            {progress.lastAttended
              ? dateLabel(progress.lastAttended)
              : "No attended sessions"}
          </strong>
          <small>Last attended session in these records</small>
        </p>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <h2>Activity &amp; achievements</h2>
          <span>All recorded months · newest first</span>
        </div>
        {progress.timeline.length === 0 ? (
          <div className="empty">
            <p>
              No records yet for this learner. Log a session or load fictional
              examples from Log session.
            </p>
          </div>
        ) : (
          <ol className="journey-timeline">
            {progress.timeline.map((row) => {
              const achievement = achievements.find(
                (a) => a.id === row.achievementId,
              );
              return (
                <li key={row.id}>
                  <time dateTime={row.date}>{dateLabel(row.date)}</time>
                  <div className="timeline-content">
                    {achievement && (
                      <div className="milestone">
                        <p className="eyebrow">
                          ACHIEVEMENT · {achievement.category}
                        </p>
                        <h3>{achievement.label}</h3>
                        <small>Reported with this attendance record</small>
                      </div>
                    )}
                    <p>
                      <strong>
                        {row.status === "attended"
                          ? "Tutoring session"
                          : statuses[row.status]}
                      </strong>{" "}
                      · {row.status === "attended" ? row.minutes / 60 : 0} hours
                    </p>
                    {row.site && <small>{displaySite(row.site)}</small>}
                    {row.notes && <p className="timeline-note">{row.notes}</p>}
                  </div>
                  {onEdit && (
                    <button
                      className="text-button"
                      aria-label={`Edit progress record on ${row.date}`}
                      onClick={() => onEdit(row)}
                    >
                      Edit
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
