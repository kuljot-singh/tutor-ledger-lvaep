CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`assignment_id` text NOT NULL,
	`date` text NOT NULL,
	`minutes` integer NOT NULL,
	`status` text NOT NULL,
	`site` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	CONSTRAINT "valid_attendance" CHECK(("sessions"."status" = 'attended' AND "sessions"."minutes" BETWEEN 15 AND 480 AND "sessions"."minutes" % 15 = 0) OR ("sessions"."status" IN ('student_absent', 'tutor_absent', 'holiday') AND "sessions"."minutes" = 0))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_sessions_assignment_date` ON `sessions` (`assignment_id`,`date`);