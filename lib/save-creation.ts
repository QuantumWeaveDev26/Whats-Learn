import {reviewAccepted} from './review-summary';
import type {Review} from './ai-feedback';
import {database} from './storage';
import {practiceDay} from './play';
type Creation={missionId:string;body:string;checks:boolean[];quiz:number;reflection?:string;evaluation?:string};
/** The statements that save one creation. Callers may add their own statements in front so everything is written together. */
export function creationStatements(userId:string,data:Creation,now=new Date().toISOString()){
 const db=database();const writes:D1PreparedStatement[]=[];
 let assessed:Review|null=null;try{const r=JSON.parse(data.evaluation||'null') as Review;if(r&&Array.isArray(r.checks)&&reviewAccepted(r))assessed=r}catch{}
 if(assessed&&data.reflection&&data.reflection.trim().length>=12){
  writes.push(db.prepare("INSERT INTO practice_events (user_id,event_id,mission_id,kind,created_at) SELECT ?,?,?,'revision',? WHERE EXISTS (SELECT 1 FROM work WHERE user_id=? AND mission_id=? AND trim(body)<>? AND ? > (SELECT count(*) FROM json_each(CASE WHEN json_valid(evaluation) THEN evaluation ELSE '{}' END,'$.checks') prior_check WHERE json_extract(prior_check.value,'$.met')=1) AND EXISTS (SELECT 1 FROM json_each(CASE WHEN json_valid(evaluation) THEN evaluation ELSE '{}' END,'$.checks') old_check JOIN json_each(?,'$.checks') new_check ON lower(json_extract(old_check.value,'$.item'))=lower(json_extract(new_check.value,'$.item')) WHERE json_extract(old_check.value,'$.met')=0 AND json_extract(new_check.value,'$.met')=1)) ON CONFLICT(user_id,event_id) DO NOTHING").bind(userId,`revision:${data.missionId}`,data.missionId,now,userId,data.missionId,data.body.trim(),assessed.checks.filter(c=>c.met).length,JSON.stringify(assessed)));
 }
 writes.push(db.prepare('INSERT INTO work (user_id,mission_id,body,checks,quiz,updated_at,evaluation) VALUES (?,?,?,?,?,?,?) ON CONFLICT(user_id,mission_id) DO UPDATE SET body=excluded.body,checks=excluded.checks,quiz=excluded.quiz,updated_at=excluded.updated_at,evaluation=excluded.evaluation').bind(userId,data.missionId,data.body.trim(),JSON.stringify(data.checks),String(data.quiz),now,data.evaluation||null));
 writes.push(db.prepare("INSERT INTO practice_events (user_id,event_id,mission_id,kind,created_at) VALUES (?,?,?,'practice',?) ON CONFLICT(user_id,event_id) DO NOTHING").bind(userId,`practice:${practiceDay(now)}`,data.missionId,now));
 return writes;
}
export async function saveCreation(userId:string,data:Creation){await database().batch(creationStatements(userId,data))}
