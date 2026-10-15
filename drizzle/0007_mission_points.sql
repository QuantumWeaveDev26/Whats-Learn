CREATE TABLE `mission_clues` (
	`user_id` text NOT NULL,
	`mission_id` text NOT NULL,
	`clue` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `mission_id`, `clue`)
);
--> statement-breakpoint
CREATE TABLE `mission_scores` (
	`user_id` text NOT NULL,
	`mission_id` text NOT NULL,
	`day` text NOT NULL,
	`understanding` integer NOT NULL,
	`practical` integer NOT NULL,
	`clues` integer NOT NULL,
	`deduction` integer NOT NULL,
	`points` integer NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `mission_id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mission_scores_one_per_day` ON `mission_scores` (`user_id`,`day`);