CREATE TABLE `signals` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`digest` text NOT NULL,
	`checked_at` text NOT NULL,
	`changed_at` text NOT NULL,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `work` (
	`user_id` text NOT NULL,
	`mission_id` text NOT NULL,
	`body` text NOT NULL,
	`checks` text NOT NULL,
	`quiz` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `mission_id`)
);
