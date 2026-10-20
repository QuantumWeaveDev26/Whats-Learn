ALTER TABLE whatsapp_reminder_log ADD COLUMN claim_token TEXT;
--> statement-breakpoint
ALTER TABLE whatsapp_reminder_log ADD COLUMN lease_expires_at INTEGER;
--> statement-breakpoint
ALTER TABLE whatsapp_reminder_log ADD COLUMN sending_at INTEGER;
--> statement-breakpoint
ALTER TABLE whatsapp_reminder_log ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE whatsapp_reminder_log ADD COLUMN message_id TEXT;
--> statement-breakpoint
ALTER TABLE whatsapp_reminder_log ADD COLUMN accepted_at TEXT;
--> statement-breakpoint
ALTER TABLE whatsapp_reminder_log ADD COLUMN receipt_status TEXT;
--> statement-breakpoint
ALTER TABLE whatsapp_reminder_log ADD COLUMN status_at INTEGER;
--> statement-breakpoint
ALTER TABLE whatsapp_reminder_log ADD COLUMN error_category TEXT;
--> statement-breakpoint
CREATE UNIQUE INDEX whatsapp_reminder_log_message_id ON whatsapp_reminder_log(message_id) WHERE message_id IS NOT NULL;
--> statement-breakpoint
ALTER TABLE whatsapp_outbox ADD COLUMN claim_token TEXT;
--> statement-breakpoint
ALTER TABLE whatsapp_outbox ADD COLUMN lease_expires_at INTEGER;
--> statement-breakpoint
ALTER TABLE whatsapp_outbox ADD COLUMN sending_at INTEGER;
--> statement-breakpoint
ALTER TABLE whatsapp_outbox ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE whatsapp_outbox ADD COLUMN message_id TEXT;
--> statement-breakpoint
ALTER TABLE whatsapp_outbox ADD COLUMN accepted_at TEXT;
--> statement-breakpoint
ALTER TABLE whatsapp_outbox ADD COLUMN receipt_status TEXT;
--> statement-breakpoint
ALTER TABLE whatsapp_outbox ADD COLUMN status_at INTEGER;
--> statement-breakpoint
ALTER TABLE whatsapp_outbox ADD COLUMN error_category TEXT;
--> statement-breakpoint
CREATE UNIQUE INDEX whatsapp_outbox_message_id ON whatsapp_outbox(message_id) WHERE message_id IS NOT NULL;
--> statement-breakpoint
