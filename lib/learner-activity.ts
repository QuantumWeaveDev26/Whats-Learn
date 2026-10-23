import {database} from './storage';
import {missions} from './missions';
/** Opening an account or receiving welcome points is not a learning attempt. */
export async function hasLearningActivity(userId:string){
 const db=database();
 const [work,draft,starter]=await Promise.all([
  db.prepare('SELECT mission_id,quiz FROM work WHERE user_id=?').bind(userId).all<{mission_id:string;quiz:number}>(),
  db.prepare("SELECT mission_id FROM practical_drafts WHERE user_id=? AND status='active' AND length(trim(body))>0 LIMIT 1").bind(userId).first<{mission_id:string}>(),
  db.prepare("SELECT 1 AS started FROM learning_sessions WHERE user_id=? AND (session_key LIKE 'starter:%' OR session_key LIKE 'starter-draft:%') AND json_valid(payload) AND length(trim(json_extract(CASE WHEN json_valid(payload) THEN payload ELSE '{}' END,'$.body')))>0 LIMIT 1").bind(userId).first()
 ]);
 return !!starter||!!draft&&missions.some(m=>m.id===draft.mission_id)||work.results.some(w=>missions.some(m=>m.id===w.mission_id&&m.answer===Number(w.quiz)));
}
