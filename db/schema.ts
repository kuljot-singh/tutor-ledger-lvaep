import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
  check,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    assignmentId: text("assignment_id").notNull(),
    date: text("date").notNull(),
    minutes: integer("minutes").notNull(),
    status: text("status").notNull(),
    site: text("site").notNull().default(""),
    achievementId: text("achievement_id").notNull().default(""),
    notes: text("notes").notNull().default(""),
  },
  (table) => [
    uniqueIndex("idx_sessions_assignment_date").on(
      table.assignmentId,
      table.date,
    ),
    check(
      "valid_attendance",
      sql`(${table.status} = 'attended' AND ${table.minutes} BETWEEN 15 AND 480 AND ${table.minutes} % 15 = 0) OR (${table.status} IN ('student_absent', 'tutor_absent', 'holiday') AND ${table.minutes} = 0)`,
    ),
  ],
);
