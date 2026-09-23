import { getDatabase } from "../../../db";
import { sampleSessions } from "../../../lib/sample-data";
import { validateSession } from "../../../lib/sessions";

export async function POST() {
  // Repeat loading never overwrites a visitor's saved records.
  const examples = sampleSessions();
  try {
    const db = getDatabase();
    const results = await db.batch(
      examples.map((input) => {
        const r = validateSession(input);
        return db
          .prepare(
            "INSERT INTO sessions (id,assignment_id,date,minutes,status,site,notes,achievement_id) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT (assignment_id,date) DO NOTHING",
          )
          .bind(
            crypto.randomUUID(),
            r.assignmentId,
            r.date,
            r.minutes,
            r.status,
            r.site,
            r.notes,
            r.achievementId || "",
          );
      }),
    );
    return Response.json({
      added: results.reduce((n, r) => n + (r.meta.changes || 0), 0),
    });
  } catch (error) {
    console.error("Sample loading failed", error);
    return Response.json(
      { error: "Could not load examples. Please try again." },
      { status: 503 },
    );
  }
}
