CREATE TABLE practical_drafts (
 user_id TEXT NOT NULL,
 mission_id TEXT NOT NULL,
 level TEXT NOT NULL,
 body TEXT NOT NULL,
 quiz INTEGER,
 metadata TEXT NOT NULL,
 pending_clue TEXT,
 revision INTEGER NOT NULL,
 write_token TEXT NOT NULL,
 source TEXT NOT NULL,
 status TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 PRIMARY KEY (user_id,mission_id,level)
);
