import { env } from "cloudflare:workers";
export function getDatabase() {
  const db = (env as unknown as { DB?: D1Database }).DB;
  if (!db) throw new Error("Database is unavailable.");
  return db;
}
