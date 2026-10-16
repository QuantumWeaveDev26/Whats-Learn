import {needsMembership,membershipRequired} from './mission-access';
import {missions} from './missions';
import {checkWriting} from './writing-check';
import {answerText,precheck} from './submission';
import {lockFor} from './progression';
import {practiceDay} from './play';
import {clueDeduction,clueIds,dailyLimitMessage,decideAward,guestLimitNote,pointsGate,scoreMission,scoreSummary,type ClueId,type Score} from './mission-score';
import {readGuestWork} from './guest-work';
import {readGuestCheckpoints} from './guest-checkpoints';
/**
 * Guest version of mission points. Guests have no account, so points, clues and the daily limit are kept in this browser only
 * (localStorage, like the rest of guest progress). They do not follow the learner to another device or browser, and clearing site data resets them.
 * Signing in keeps them on the server instead. This is practice progress, not a certificate.
 */
const KEY='whatslearn-guest-points-v1';
export type GuestScore={mission_id:string;day:string;understanding:number;practical:number;clues:number;deduction:number;points:number};
type Store={scores:GuestScore[];clues:Record<string,string[]>};
function read():Store{
 try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');const scores=Array.isArray(v.scores)?v.scores.filter((s:GuestScore)=>missions.some(m=>m.id===s?.mission_id)&&typeof s.day==='string'&&Number.isFinite(s.points)):[];
  const clues:Record<string,string[]>={};if(v.clues&&typeof v.clues==='object')for(const [id,list] of Object.entries(v.clues))if(missions.some(m=>m.id===id)&&Array.isArray(list))clues[id]=[...new Set((list as string[]).filter(c=>(clueIds as readonly string[]).includes(c)))];
  return {scores:[...new Map<string,GuestScore>(scores.map((s:GuestScore)=>[s.mission_id,s])).values()],clues};
 }catch{return {scores:[],clues:{}}}
}
function write(s:Store){try{localStorage.setItem(KEY,JSON.stringify(s));return true}catch{return false}}
export function readGuestPoints(now=new Date()){const s=read();const today=practiceDay(now.toISOString());return {scores:s.scores,clues:Object.fromEntries(Object.entries(s.clues).filter(([id])=>!s.scores.some(x=>x.mission_id===id))) as Record<string,string[]>,today,todayUsed:s.scores.some(x=>x.day===today),totalPoints:s.scores.reduce((n,x)=>n+x.points,0)}}
export function recordGuestClue(missionId:string,clue:ClueId){
 const s=read();const total=(s.clues[missionId]||[]).length;if(s.scores.some(x=>x.mission_id===missionId)||!(clueIds as readonly string[]).includes(clue))return {recorded:false,used:s.clues[missionId]||[],clues:total,deduction:clueDeduction(total)};
 const list=s.clues[missionId]||[];const isNew=!list.includes(clue);if(isNew)s.clues[missionId]=[...list,clue];const ok=write(s);const n=(s.clues[missionId]||[]).length;return {recorded:ok&&isNew,used:s.clues[missionId]||[],clues:n,deduction:clueDeduction(n)};
}
export type GuestResult={saved:boolean;status:'awarded'|'practice'|'duplicate'|'daily-limit'|'rejected';score?:Score;message:string};
/** Decides what saving this mission earns on this device. Call before saving the guest work; save the work only when `saved` is true. */
export function guestAward(data:{missionId:string;body:string;checks:boolean[];quiz:number},now=new Date()):GuestResult{
 const mission=missions.find(m=>m.id===data.missionId);if(!mission)return {saved:false,status:'rejected',message:'Unknown mission.'};
 if(needsMembership(mission))return {saved:false,status:'rejected',message:membershipRequired};
 const bad=precheck(mission,data);if(bad)return {saved:false,status:'rejected',message:bad};
 const lock=lockFor(mission,new Set(readGuestWork().map(w=>w.mission_id)),readGuestCheckpoints());if(lock.locked)return {saved:false,status:'rejected',message:lock.message+' '+guestLimitNote};
 const s=read();const day=practiceDay(now.toISOString());
 const decision=decideAward({scoredBefore:s.scores.some(x=>x.mission_id===mission.id),hasWork:readGuestWork().some(w=>w.mission_id===mission.id),dayUsedByOther:s.scores.some(x=>x.day===day)});
 if(decision==='daily-limit')return {saved:false,status:'daily-limit',message:`${dailyLimitMessage} ${guestLimitNote}`};
 if(decision==='duplicate')return {saved:true,status:'duplicate',message:'Saved as practice. This mission has already earned its points, and points are not awarded twice.'};
 if(decision==='practice')return {saved:true,status:'practice',message:'Saved as practice. Earlier missions stay open to practise, but they do not earn the same points again.'};
 const text=answerText(mission,data.body);const writing=checkWriting(mission,text,data.checks);const gate=pointsGate(mission,text,writing);
 if(!gate.ok)return {saved:false,status:'rejected',message:gate.message+' Your work has not been saved, so you can try again.'};
 const score=scoreMission({understandingCorrect:data.quiz===mission.answer,writing,clues:(s.clues[mission.id]||[]).length});
 s.scores.push({mission_id:mission.id,day,understanding:score.understanding,practical:score.practical,clues:score.clues,deduction:score.deduction,points:score.points});
 if(!write(s))return {saved:false,status:'rejected',message:'Points could not be saved on this device, so nothing was saved. Free some browser storage and try again.'};
 return {saved:true,status:'awarded',score,message:`Both questions are complete. ${scoreSummary(score)}. ${guestLimitNote} This was a quick check on this site, not an AI review.`};
}
