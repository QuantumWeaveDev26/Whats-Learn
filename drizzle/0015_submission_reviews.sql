CREATE TABLE submission_reviews (
 user_id TEXT NOT NULL,
 mission_id TEXT NOT NULL,
 body_hash TEXT NOT NULL,
 review TEXT NOT NULL,
 created_at TEXT NOT NULL,
 PRIMARY KEY(user_id,mission_id,body_hash)
);

--> statement-breakpoint
ALTER TABLE work ADD COLUMN evaluation TEXT;
