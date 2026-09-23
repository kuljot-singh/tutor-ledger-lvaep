"use client";

import { useState, type FormEvent } from "react";
import { BookOpen, FileText, List, Plus, Users } from "lucide-react";

export type DemoRole = "tutor" | "staff";

const roleDetails = {
  tutor: {
    label: "Tutor",
    description: "Record tutoring activity and review student progress.",
    items: [
      { label: "Log Session", icon: Plus },
      { label: "Session History", icon: List },
      { label: "Student Progress", icon: Users },
    ],
  },
  staff: {
    label: "Staff",
    description: "Review program activity and prepare monthly reports.",
    items: [
      { label: "Session History", icon: List },
      { label: "Student Progress", icon: Users },
      { label: "Monthly Report", icon: FileText },
    ],
  },
} as const;

export default function DemoAccess({
  onEnter,
}: {
  onEnter: (role: DemoRole) => void;
}) {
  const [role, setRole] = useState<DemoRole>("tutor");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== "password") {
      setError("That demo password is incorrect. Use “password” to enter.");
      return;
    }
    onEnter(role);
  }

  return (
    <div className="access-page">
      <main className="access-card">
        <div className="access-brand">
          <span className="brand-icon">
            <BookOpen size={23} />
          </span>
          <div>
            <strong>Tutor Ledger</strong>
            <small>LVAEP Reporting Prototype · FY 2026–2027</small>
          </div>
        </div>
        <div className="access-intro">
          <p className="eyebrow">DEMO ACCESS</p>
          <h1>Choose a role to explore the prototype</h1>
          <p>
            Tutor Ledger helps tutors record attendance and helps staff prepare
            monthly program reports.
          </p>
        </div>
        <form className="access-form" onSubmit={submit}>
          <fieldset>
            <legend>Demo role</legend>
            <div className="role-grid">
              {(Object.keys(roleDetails) as DemoRole[]).map((key) => {
                const details = roleDetails[key];
                return (
                  <label
                    className={`role-card ${role === key ? "selected" : ""}`}
                    key={key}
                  >
                    <input
                      type="radio"
                      name="demo-role"
                      value={key}
                      checked={role === key}
                      onChange={() => {
                        setRole(key);
                        setError("");
                      }}
                    />
                    <strong>{details.label}</strong>
                    <span>{details.description}</span>
                    <ul>
                      {details.items.map((item) => (
                        <li key={item.label}>
                          <item.icon size={16} />
                          {item.label}
                        </li>
                      ))}
                    </ul>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <label className="access-password">
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              required
            />
            <small>
              I’ll let you in on a secret… for the sake of this demo, the
              password is ‘password.’ Don’t tell anyone else though 🤫
            </small>
            <small className="serious-note">
              Demo access only — this is not real authentication. A production
              version would require authenticated accounts and server-enforced
              permissions.
            </small>
          </label>
          {error && (
            <p className="access-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary access-submit" type="submit">
            Enter {roleDetails[role].label} demo
          </button>
        </form>
        <p className="access-disclaimer">
          Public prototype · Fictional demo information only · Not an official
          LVAEP system
        </p>
      </main>
    </div>
  );
}
