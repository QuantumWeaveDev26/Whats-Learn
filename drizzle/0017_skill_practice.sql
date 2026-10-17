-- Account-scoped formative practice. Never a course completion or reward record.
CREATE TABLE skill_practice (
 user_id text NOT NULL,
 task_key text NOT NULL,
 mission_id text NOT NULL,
 skill text NOT NULL,
 answer text NOT NULL,
 accepted integer NOT NULL DEFAULT 0,
 attempts integer NOT NULL DEFAULT 1,
 mistakes integer NOT NULL DEFAULT 0,
 feedback text NOT NULL,
 follow_up text NOT NULL,
 created_at text NOT NULL,
 PRIMARY KEY (user_id, task_key)
);
