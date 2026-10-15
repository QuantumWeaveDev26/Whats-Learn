CREATE TABLE `point_ledger` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`ref` text NOT NULL,
	`delta` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `point_ledger_once` ON `point_ledger` (`user_id`,`kind`,`ref`);--> statement-breakpoint
CREATE INDEX `point_ledger_user` ON `point_ledger` (`user_id`);
--> statement-breakpoint
-- Points earned before the ledger existed are carried over once (these scores were already net of any clue deduction).
INSERT INTO `point_ledger` (`user_id`,`kind`,`ref`,`delta`,`created_at`) SELECT `user_id`,'mission',`mission_id`,`points`,`created_at` FROM `mission_scores`;