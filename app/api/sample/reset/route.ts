import { getDatabase } from "../../../../db";
import { sampleSessions } from "../../../../lib/sample-data";
import { validateSession } from "../../../../lib/sessions";

export async function POST() {
  // Validate the full known state before removing any shared demo rows.
  const examples = sampleSessions().map((input) => validateSession(input));
  try {
    const db = getDatabase();
    await db.batch([
      db.prepare("DELETE FROM sessions"),
      ...examples.map((row) =>
        db
          .prepare(
            "INSERT INTO sessions (id,assignment_id,date,minutes,status,site,notes,achievement_id) VALUES (?,?,?,?,?,?,?,?)",
          )
          .bind(
            crypto.randomUUID(),
            row.assignmentId,
            row.date,
            row.minutes,
            row.status,
            row.site,
            row.notes,
            row.achievementId || "",
          ),
      ),
    ]);
    return Response.json({ reset: examples.length });
  } catch (error) {
    console.error("Sample reset failed", error);
    return Response.json(
      { error: "Could not reset the fictional demo. Please try again." },
      { status: 503 },
    );
  }
}
