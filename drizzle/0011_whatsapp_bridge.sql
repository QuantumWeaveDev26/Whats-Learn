-- v50: WhatsApp learning bridge (n8n). Additive only: nothing is dropped or rewritten.
-- Existing whatsapp_contacts rows were never verified: verified_at stays NULL, so the bridge ignores them until the learner links again.
ALTER TABLE `whatsapp_contacts` ADD `verified_at` text;--> statement-breakpoint
ALTER TABLE `whatsapp_contacts` ADD `remind_state` text DEFAULT 'off' NOT NULL;--> statement-breakpoint
ALTER TABLE `whatsapp_contacts` ADD `remind_hour` integer DEFAULT 19 NOT NULL;--> statement-breakpoint
ALTER TABLE `whatsapp_contacts` ADD `remind_freq` text DEFAULT 'daily' NOT NULL;--> statement-breakpoint
ALTER TABLE `whatsapp_contacts` ADD `quiet_start` integer DEFAULT 21 NOT NULL;--> statement-breakpoint
ALTER TABLE `whatsapp_contacts` ADD `quiet_end` integer DEFAULT 8 NOT NULL;--> statement-breakpoint
CREATE TABLE `whatsapp_link_codes` (
	`user_id` text PRIMARY KEY NOT NULL,
	`phone` text NOT NULL,
	`code_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bridge_nonces` (
	`nonce` text PRIMARY KEY NOT NULL,
	`seen_at` integer NOT NULL,
	`body_hash` text NOT NULL,
	`status` integer,
	`response` text
);
--> statement-breakpoint
CREATE TABLE `whatsapp_tutor_usage` (
	`user_id` text NOT NULL,
	`day` text NOT NULL,
	`count` integer NOT NULL,
	PRIMARY KEY(`user_id`, `day`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_drafts` (
	`user_id` text PRIMARY KEY NOT NULL,
	`mission_id` text NOT NULL,
	`quiz` integer,
	`body` text,
	`pending_clue` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `whatsapp_outbox` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`ref` text NOT NULL,
	`payload` text NOT NULL,
	`state` text DEFAULT 'queued' NOT NULL,
	`claimed_at` integer,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `whatsapp_outbox_once` ON `whatsapp_outbox` (`user_id`,`kind`,`ref`);--> statement-breakpoint
CREATE TABLE `whatsapp_reminder_log` (
	`user_id` text NOT NULL,
	`slot` text NOT NULL,
	`state` text NOT NULL,
	`claimed_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `slot`)
);
