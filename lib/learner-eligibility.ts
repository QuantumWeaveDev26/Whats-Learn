import {database} from './storage';
/** Enforce the age range the learner supplied; this is not independent age verification. */
export async function guestOnlyLearner(userId:string){const row=await database().prepare('SELECT answers FROM learner_context WHERE user_id=?').bind(userId).first<{answers:string}>();return !!row&&JSON.parse(row.answers).ageBand==='under-18';}
export async function restrictToGuest(userId:string){const db=database(),at=new Date().toISOString();
 await db.prepare("INSERT OR IGNORE INTO learner_context(user_id,answers,skipped,completed_at) VALUES (?,?,1,?)").bind(userId,JSON.stringify({ageBand:'under-18'}),at).run();
 if(!await guestOnlyLearner(userId))throw Error('These answers were already submitted and cannot be edited.');
 await db.batch([
 db.prepare("UPDATE whatsapp_contacts SET state='opted_out',remind_state='off',opted_out_at=?,updated_at=? WHERE user_id=?").bind(at,at,userId),
 db.prepare('DELETE FROM whatsapp_link_codes WHERE user_id=?').bind(userId)
]);}
