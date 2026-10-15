CREATE TABLE `ai_feedback_usage` (
	`user_id` text NOT NULL,
	`day` text NOT NULL,
	`count` integer NOT NULL,
	PRIMARY KEY(`user_id`, `day`)
);
--> statement-breakpoint
CREATE TABLE `entitlements` (
	`session_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`mode` text NOT NULL,
	`sku` text NOT NULL,
	`status` text NOT NULL,
	`ends_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `entitlements_user` ON `entitlements` (`user_id`,`mode`);--> statement-breakpoint
CREATE TABLE `whatsapp_contacts` (
	`user_id` text PRIMARY KEY NOT NULL,
	`phone` text NOT NULL,
	`state` text NOT NULL,
	`language` text NOT NULL,
	`consent_at` text NOT NULL,
	`opted_out_at` text,
	`last_inbound_at` text,
	`last_reminder_at` text,
	`current_mission` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `whatsapp_phone` ON `whatsapp_contacts` (`phone`);--> statement-breakpoint
CREATE TABLE `whatsapp_events` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`processed_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `billing_sessions` ADD `mode` text DEFAULT 'test' NOT NULL;--> statement-breakpoint
ALTER TABLE `billing_sessions` ADD `payment_id` text;