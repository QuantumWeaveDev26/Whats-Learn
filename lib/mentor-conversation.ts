import {readSession,writeSession} from './learning-session';
import {database} from './storage';

type Turn={question:string;answer?:string};
type Conversation={missionId:string;turns:Turn[];updatedAt:number};
export type MentorMemorySettings={shared:boolean};
const day=24*60*60*1000;
const key=(channel:'whatsapp'|'web')=>`mentor-conversation:${channel}`;
export async function mentorMemorySettings(userId:string):Promise<MentorMemorySettings>{return {shared:(await readSession<MentorMemorySettings>(userId,'mentor-memory-settings'))?.shared===true};}
export async function setMentorMemorySettings(userId:string,shared:boolean){await writeSession(userId,'mentor-memory-settings',{shared});if(!shared)await database().prepare("DELETE FROM learning_sessions WHERE user_id=? AND session_key='mentor-conversation:shared'").bind(userId).run();return {shared};}
export async function clearMentorMemory(userId:string){await database().prepare("DELETE FROM learning_sessions WHERE user_id=? AND session_key IN ('mentor-conversation:web','mentor-conversation:whatsapp','mentor-conversation:shared','mentor-reply-preferences')").bind(userId).run();}
/** Optional shared context is bounded, account scoped and never assessment evidence. */
export async function recentMentorTurn(userId:string,channel:'whatsapp'|'web',missionId:string):Promise<Turn|null>{
 const setting=await mentorMemorySettings(userId),keys=setting.shared?[key(channel),'mentor-conversation:shared']:[key(channel)];
 const records=await Promise.all(keys.map(async k=>{const c=await readSession<Conversation>(userId,k);const ttl=k.endsWith(':shared')?7*day:day;if(!c||c.missionId!==missionId||!Array.isArray(c.turns)||Date.now()-c.updatedAt>ttl){if(c)await database().prepare('DELETE FROM learning_sessions WHERE user_id=? AND session_key=?').bind(userId,k).run();return null;}return c;}));
 return records.filter((c):c is Conversation=>!!c).sort((a,b)=>b.updatedAt-a.updatedAt)[0]?.turns.at(-1)||null;
}
export async function rememberMentorTurn(userId:string,channel:'whatsapp'|'web',missionId:string,question:string,answer:string){
 const cleanQuestion=question.trim().slice(0,500),cleanAnswer=answer.trim().slice(0,1800);if(cleanQuestion.length<2)return;
 const prior=await readSession<Conversation>(userId,key(channel));
 const turns=prior?.missionId===missionId&&Date.now()-prior.updatedAt<=day&&Array.isArray(prior.turns)?prior.turns:[];
 if(turns.at(-1)?.question!==cleanQuestion||turns.at(-1)?.answer!==cleanAnswer)turns.push({question:cleanQuestion,answer:cleanAnswer});
 const value={missionId,turns:turns.slice(-2),updatedAt:Date.now()};await writeSession(userId,key(channel),value);
 if((await mentorMemorySettings(userId)).shared)await writeSession(userId,'mentor-conversation:shared',value);
}
export async function rememberMentorQuestion(userId:string,channel:'whatsapp'|'web',missionId:string,question:string){await rememberMentorTurn(userId,channel,missionId,question,'');}
