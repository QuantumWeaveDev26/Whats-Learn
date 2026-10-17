import {loadEvidence} from './learning-memory';
import {learningStyleCodes,learningStyle} from './learning-styles';
import {z} from 'zod';
import {languageCodes} from './languages';
import {saveMissionWork} from './mission-points';
import {database} from './storage';
import {missions} from './missions';
import {precheck} from './submission';
import {defaultProfile,type Profile} from './personalization';
import {learningPath,type PracticeRecord} from './learning-engine';

export const profileSchema=z.object({goal:z.enum(['job','switch','upskill','team','freelance','business','build','explore']),track:z.enum(['marketing','development','filmmaking','storytelling']),level:z.enum(['beginner','practising','experienced']),language:z.enum(languageCodes),minutes:z.enum(['5','10','15','25','30','flexible']),style:z.enum(learningStyleCodes).optional()}).strict();
export const workSchema=z.object({missionId:z.string().max(20),body:z.string().trim().min(40).max(9000),checks:z.array(z.boolean()).length(5),quiz:z.number().int().min(0).max(10),reflection:z.string().trim().max(500).optional()}).strict();
export async function loadLearning(userId:string){
  const db=database();
  const [row,result]=await Promise.all([db.prepare('SELECT goal,track,level,language,minutes,style FROM learner_profiles WHERE user_id=?').bind(userId).first(),db.prepare('SELECT mission_id,body,checks,quiz,updated_at FROM work WHERE user_id=? ORDER BY updated_at DESC').bind(userId).all()]);
  const parsed=profileSchema.safeParse(row);
  const profile=parsed.success?parsed.data:defaultProfile;
  const work=result.results.map(w=>({...w,quiz:Number(w.quiz)})) as unknown as (PracticeRecord & {body:string;updated_at:string})[];
  const evidence=await loadEvidence(userId);
  return {profile,hasProfile:parsed.success,work,evidence,path:learningPath(profile,work,'adaptive',false,evidence)};
}
export async function saveProfile(userId:string,raw:unknown){
  const input=profileSchema.parse(raw);
  const previous=input.style===undefined?await database().prepare('SELECT style FROM learner_profiles WHERE user_id=?').bind(userId).first<{style:string}>():null;
  const p={...input,style:learningStyle(input.style??previous?.style)};
  await database().prepare('INSERT INTO learner_profiles (user_id,goal,track,level,language,minutes,updated_at,style) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET goal=excluded.goal,track=excluded.track,level=excluded.level,language=excluded.language,minutes=excluded.minutes,updated_at=excluded.updated_at,style=excluded.style').bind(userId,p.goal,p.track,p.level,p.language,p.minutes,new Date().toISOString(),p.style).run();
  await database().prepare('UPDATE whatsapp_contacts SET language=? WHERE user_id=?').bind(p.language,userId).run();
  return p;
}
export async function submitWork(userId:string,raw:unknown){
  const p=workSchema.parse(raw);const mission=missions.find(m=>m.id===p.missionId);
  if(!mission)throw new Error('Unknown challenge. Request the programme catalogue first.');
  const bad=precheck(mission,p);if(bad)return {saved:false,feedback:bad,hint:mission.task};
  const award=await saveMissionWork(userId,p);
  if(!award.saved)return {saved:false,feedback:award.message,hint:mission.task};
  const state=await loadLearning(userId);
  return {saved:true,points:award.score?.points??0,award:award.status,feedback:award.message+' Practice XP recognises participation, not certified mastery. Updating this creation does not award duplicate XP.',progress:state.path.progress,next:{id:state.path.nextMissionId,reason:state.path.reason}};
}
