CREATE TABLE IF NOT EXISTS learning_sessions (user_id TEXT NOT NULL, session_key TEXT NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(user_id, session_key));
