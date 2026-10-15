CREATE TABLE `billing_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event` text NOT NULL,
	`processed_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `billing_plans` (
	`sku` text PRIMARY KEY NOT NULL,
	`provider_id` text,
	`state` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `billing_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`sku` text NOT NULL,
	`kind` text NOT NULL,
	`quantity` text NOT NULL,
	`amount` text NOT NULL,
	`provider_id` text,
	`state` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `billing_one_open_checkout` ON `billing_sessions` (`user_id`,`sku`,`quantity`) WHERE "billing_sessions"."state" IN ('creating','created','authenticated','active','pending','halted');--> statement-breakpoint
CREATE UNIQUE INDEX `billing_provider_id` ON `billing_sessions` (`provider_id`);