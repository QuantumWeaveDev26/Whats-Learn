-- App games: weekly best scores, friend squads. New tables only; nothing existing changes.
CREATE TABLE IF NOT EXISTS `game_scores` (
	`user_id` text NOT NULL,
	`game` text NOT NULL,
	`week` text NOT NULL,
	`score` integer NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `game`, `week`)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `game_scores_board_idx` ON `game_scores` (`game`,`week`,`score`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `game_squads` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`owner_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `game_squads_code_idx` ON `game_squads` (`code`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `game_squad_members` (
	`squad_id` text NOT NULL,
	`user_id` text NOT NULL,
	`joined_at` text NOT NULL,
	PRIMARY KEY(`squad_id`, `user_id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `game_squad_members_user_idx` ON `game_squad_members` (`user_id`);
