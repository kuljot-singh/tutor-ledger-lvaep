import { getDatabase } from "../../../db";
import { validateSession } from "../../../lib/sessions";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers });
}
function failure(error: unknown) {
  console.error("Session storage failed", error);
  if (String(error).includes("UNIQUE constraint"))
    return json(
      {
        error:
          "A record already exists for this student and date. Edit that record to correct it or combine the day’s hours.",
      },
      409,
    );
  return json(
    {
      error:
        "We could not reach the records. Your input is still here; please try again.",
    },
    503,
  );
}
export async function GET() {
  try {
    const result = await getDatabase()
      .prepare(
        "SELECT id, assignment_id AS assignmentId, date, minutes, status, site, notes, achievement_id AS achievementId FROM sessions ORDER BY date DESC, assignment_id",
      )
      .all();
    return json(result.results);
  } catch (error) {
    return failure(error);
  }
}
async function save(request: Request, edit: boolean) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  let row;
  try {
    row = validateSession(body);
  } catch (error) {
    return json({ error: (error as Error).message }, 400);
  }
  const recordId = (body as Record<string, unknown>).id;
  if (edit && (typeof recordId !== "string" || recordId.length > 80))
    return json({ error: "Choose a record to edit." }, 400);
  try {
    const db = getDatabase();
    const id = edit ? (recordId as string) : crypto.randomUUID();
    const values = [
      row.assignmentId,
      row.date,
      row.minutes,
      row.status,
      row.site,
      row.notes,
      row.achievementId || "",
    ];
    if (edit) {
      const result = await db
        .prepare(
          "UPDATE sessions SET assignment_id=?, date=?, minutes=?, status=?, site=?, notes=?, achievement_id=? WHERE id=?",
        )
        .bind(...values, id)
        .run();
      if (!result.meta.changes)
        return json(
          { error: "This record was removed. Refresh the history." },
          404,
        );
    } else {
      await db
        .prepare(
          "INSERT INTO sessions (assignment_id,date,minutes,status,site,notes,achievement_id,id) VALUES (?,?,?,?,?,?,?,?)",
        )
        .bind(...values, id)
        .run();
    }
    return json({ id, ...row }, edit ? 200 : 201);
  } catch (error) {
    return failure(error);
  }
}
export const POST = (request: Request) => save(request, false);
export const PUT = (request: Request) => save(request, true);
export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id || id.length > 80)
    return json({ error: "Choose a record to delete." }, 400);
  try {
    const result = await getDatabase()
      .prepare("DELETE FROM sessions WHERE id=?")
      .bind(id)
      .run();
    if (!result.meta.changes)
      return json(
        { error: "This record was already removed. Refresh the history." },
        404,
      );
    return json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
