CREATE TABLE `learner_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`goal` text NOT NULL,
	`track` text NOT NULL,
	`level` text NOT NULL,
	`language` text NOT NULL,
	`minutes` text NOT NULL,
	`updated_at` text NOT NULL
);
