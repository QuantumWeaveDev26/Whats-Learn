CREATE TABLE IF NOT EXISTS learner_context (
 user_id TEXT PRIMARY KEY,
 answers TEXT NOT NULL,
 skipped INTEGER NOT NULL DEFAULT 0,
 completed_at TEXT NOT NULL
);
