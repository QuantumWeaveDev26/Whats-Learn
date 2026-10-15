CREATE TABLE `practice_events` (
	`user_id` text NOT NULL,
	`event_id` text NOT NULL,
	`mission_id` text NOT NULL,
	`kind` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `event_id`)
);
