import {database} from './storage';
import {practiceDay} from './play';
type Creation={missionId:string;body:string;checks:boolean[];quiz:number;reflection?:string};
/** The statements that save one creation. Callers may add their own statements in front so everything is written together. */
export function creationStatements(userId:string,data:Creation,now=new Date().toISOString()){
 const db=database();const writes:D1PreparedStatement[]=[];
 if(data.reflection&&data.reflection.trim().length>=12){
  writes.push(db.prepare("INSERT INTO practice_events (user_id,event_id,mission_id,kind,created_at) SELECT ?,?,?,'revision',? WHERE EXISTS (SELECT 1 FROM work WHERE user_id=? AND mission_id=? AND trim(body)<>?) ON CONFLICT(user_id,event_id) DO NOTHING").bind(userId,`revision:${data.missionId}`,data.missionId,now,userId,data.missionId,data.body.trim()));
 }
 writes.push(db.prepare('INSERT INTO work (user_id,mission_id,body,checks,quiz,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(user_id,mission_id) DO UPDATE SET body=excluded.body,checks=excluded.checks,quiz=excluded.quiz,updated_at=excluded.updated_at').bind(userId,data.missionId,data.body.trim(),JSON.stringify(data.checks),String(data.quiz),now));
 writes.push(db.prepare("INSERT INTO practice_events (user_id,event_id,mission_id,kind,created_at) VALUES (?,?,?,'practice',?) ON CONFLICT(user_id,event_id) DO NOTHING").bind(userId,`practice:${practiceDay(now)}`,data.missionId,now));
 return writes;
}
export async function saveCreation(userId:string,data:Creation){await database().batch(creationStatements(userId,data))}
