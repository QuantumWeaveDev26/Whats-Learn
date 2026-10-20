CREATE TABLE quality_replies (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL, channel TEXT NOT NULL,
 mission_id TEXT, question TEXT NOT NULL, answer TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX quality_replies_owner_time ON quality_replies(user_id,created_at);
CREATE TABLE quality_reports (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL, reply_id TEXT NOT NULL,
 reason TEXT NOT NULL, note TEXT NOT NULL, channel TEXT NOT NULL, mission_id TEXT,
 question_excerpt TEXT NOT NULL, answer_excerpt TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'received', resolution TEXT NOT NULL DEFAULT '',
 idempotency_key TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, resolved_at TEXT,
 UNIQUE(user_id,idempotency_key)
);
CREATE INDEX quality_reports_state_time ON quality_reports(status,created_at);
CREATE TABLE quality_support (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL, category TEXT NOT NULL, description TEXT NOT NULL,
 report_id TEXT, status TEXT NOT NULL DEFAULT 'received', resolution TEXT NOT NULL DEFAULT '',
 idempotency_key TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, resolved_at TEXT,
 UNIQUE(user_id,idempotency_key)
);
CREATE INDEX quality_support_state_time ON quality_support(status,created_at);
CREATE TABLE quality_events (
 id TEXT PRIMARY KEY, user_id TEXT, channel TEXT NOT NULL, category TEXT NOT NULL,
 correlation_id TEXT NOT NULL, created_at TEXT NOT NULL,
 UNIQUE(channel,category,correlation_id)
);
CREATE INDEX quality_events_time ON quality_events(created_at);
CREATE TABLE quality_audit (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL, item_kind TEXT NOT NULL, item_id TEXT NOT NULL,
 actor_user_id TEXT NOT NULL, actor_email TEXT NOT NULL, from_status TEXT NOT NULL,
 to_status TEXT NOT NULL, resolution TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX quality_audit_item ON quality_audit(item_kind,item_id,created_at);
