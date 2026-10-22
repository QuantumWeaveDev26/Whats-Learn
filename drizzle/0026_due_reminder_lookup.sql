CREATE INDEX IF NOT EXISTS whatsapp_contacts_due_idx ON whatsapp_contacts(state,remind_state,remind_hour,user_id);
