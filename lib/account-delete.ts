import {env} from 'cloudflare:workers';
import {database} from './storage';
/**
 * Erases a learner's data from this site's database (and private files). Payment records are kept as the privacy policy says (tax and accounting law); they are not touched here.
 * One marker row stays in the points ledger (opaque id, zero points, no personal data) so a welcome balance can never be granted twice, even if the login is removed later than the data.
 */
const TABLES=['quality_replies','quality_reports','quality_support','quality_events','quality_audit','learner_context','learning_sessions','concept_drafts','skill_practice','whatsapp_saved_drafts','whatsapp_drafts','whatsapp_link_codes','whatsapp_tutor_usage','whatsapp_reminder_log','whatsapp_outbox','checkpoint_clears','practice_events','proofs','work','learner_profiles','ai_feedback_usage','submission_reviews','whatsapp_contacts','mission_scores','mission_clues','reward_claims','uploads'] as const;
export async function deleteAccountData(userId:string,now=new Date()){
 const db=database();const bucket=(env as unknown as {BUCKET?:R2Bucket}).BUCKET;
 // Stored files go first. If a file cannot be removed, nothing else is deleted and the request fails, so the learner can retry rather than lose track of a file.
 const keys=await db.prepare('SELECT r2_key FROM uploads WHERE user_id=?').bind(userId).all();
 if(keys.results.length){if(!bucket)throw new Error('File storage unavailable');for(const k of keys.results)await bucket.delete(String(k.r2_key))}
 await db.batch([db.prepare('DELETE FROM quality_audit WHERE actor_user_id=?').bind(userId),...TABLES.map(t=>db.prepare(`DELETE FROM ${t} WHERE user_id=?`).bind(userId)),
  db.prepare('DELETE FROM point_ledger WHERE user_id=?').bind(userId),
  db.prepare("INSERT INTO point_ledger (user_id,kind,ref,delta,created_at) VALUES (?,'starting','start',0,?)").bind(userId,now.toISOString())]);
}
