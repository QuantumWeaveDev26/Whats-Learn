CREATE TABLE `auth_attempts` (
	`key` text PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reward_claims` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`track` text NOT NULL,
	`title` text NOT NULL,
	`plan` text NOT NULL,
	`days` integer NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`reviewed_at` text
);
--> statement-breakpoint
CREATE TABLE `uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`mission_id` text NOT NULL,
	`r2_key` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`bytes` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `uploads_user_mission` ON `uploads` (`user_id`,`mission_id`);