import {database} from './storage';
export const normalizeControlCommand=(text:string)=>text.trim().toLowerCase().replace(/\s+/g,' ').replace(/[\s.!?,;:…]+$/u,'');
export const stopCommands=['stop','unsubscribe','end','optout','opt out','रुको','बंद','ನಿಲ್ಲಿಸಿ'];
export async function pauseReminders(userId:string){await database().prepare("UPDATE whatsapp_contacts SET remind_state='off',updated_at=? WHERE user_id=?").bind(new Date().toISOString(),userId).run()}
/** Stop delivery without erasing linked learner work. Explicit unlink is separate. */
export async function stopMessages(userId:string){const db=database(),at=new Date().toISOString();await db.batch([db.prepare("UPDATE whatsapp_contacts SET state='opted_out',remind_state='off',opted_out_at=?,updated_at=? WHERE user_id=?").bind(at,at,userId),db.prepare('DELETE FROM whatsapp_link_codes WHERE user_id=?').bind(userId)])}
