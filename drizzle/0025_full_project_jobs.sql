CREATE TABLE IF NOT EXISTS full_project_jobs (
 id TEXT PRIMARY KEY NOT NULL,
 user_id TEXT NOT NULL,
 mission_id TEXT NOT NULL,
 request_key TEXT NOT NULL,
 artifact_hash TEXT NOT NULL,
 script TEXT NOT NULL,
 state TEXT NOT NULL,
 command_id TEXT,
 created_at TEXT NOT NULL,
 expires_at TEXT NOT NULL,
 exit_code INTEGER,
 output TEXT NOT NULL DEFAULT '',
 UNIQUE(user_id,request_key)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS full_project_jobs_limits ON full_project_jobs(user_id,created_at,state);
