-- Preserve unfinished chat revisions when the same mission is completed on the website.
CREATE TABLE whatsapp_saved_drafts (
 user_id text NOT NULL,
 mission_id text NOT NULL,
 quiz integer,
 body text NOT NULL,
 pending_clue text,
 updated_at text NOT NULL,
 archived_at text NOT NULL,
 PRIMARY KEY (user_id, mission_id)
);
