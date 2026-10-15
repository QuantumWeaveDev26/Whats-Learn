CREATE TABLE `checkpoint_clears` (
	`user_id` text NOT NULL,
	`track` text NOT NULL,
	`after_mission` integer NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `track`, `after_mission`)
);
