CREATE TABLE IF NOT EXISTS quality_alerts (
 id TEXT PRIMARY KEY NOT NULL,
 user_id TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('support','report')),
 item_id TEXT NOT NULL,
 state TEXT NOT NULL DEFAULT 'queued',
 attempts INTEGER NOT NULL DEFAULT 0,
 lease_token TEXT,
 lease_until INTEGER,
 next_at INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL,
 accepted_at TEXT,
 UNIQUE(kind,item_id)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS quality_alerts_queue ON quality_alerts(state,next_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS service_pulses (name TEXT PRIMARY KEY NOT NULL, checked_at TEXT NOT NULL);
