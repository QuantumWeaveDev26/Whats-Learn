import {readSession,writeSession} from './learning-session';

type Turn={question:string;answer?:string};
type Conversation={missionId:string;turns:Turn[];updatedAt:number};
const ttl=24*60*60*1000;
const key=(channel:'whatsapp'|'web')=>`mentor-conversation:${channel}`;

/** Keep only a tiny, private, channel-specific window for natural clarification follow-ups. */
export async function recentMentorTurn(userId:string,channel:'whatsapp'|'web',missionId:string):Promise<Turn|null>{
 const c=await readSession<Conversation>(userId,key(channel));
 if(!c||c.missionId!==missionId||Date.now()-c.updatedAt>ttl)return null;
 return c.turns.at(-1)||null;
}
export async function rememberMentorTurn(userId:string,channel:'whatsapp'|'web',missionId:string,question:string,answer:string){
 const cleanQuestion=question.trim().slice(0,500),cleanAnswer=answer.trim().slice(0,1800);
 if(cleanQuestion.length<2)return;
 const prior=await readSession<Conversation>(userId,key(channel));
 const turns=prior?.missionId===missionId&&Date.now()-prior.updatedAt<=ttl?prior.turns:[];
 turns.push({question:cleanQuestion,answer:cleanAnswer});
 await writeSession(userId,key(channel),{missionId,turns:turns.slice(-2),updatedAt:Date.now()});
}
export async function rememberMentorQuestion(userId:string,channel:'whatsapp'|'web',missionId:string,question:string){
 await rememberMentorTurn(userId,channel,missionId,question,'');
}
