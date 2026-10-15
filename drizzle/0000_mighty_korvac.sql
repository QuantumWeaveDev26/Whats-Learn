CREATE TABLE `proofs` (
	`user_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`content` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `lesson_id`)
);
