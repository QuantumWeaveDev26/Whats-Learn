import {missions} from './missions';
/** Course recognition follows useful completed work. Help, scores and breaks never reduce eligibility.
 * Legacy title keys remain stable for stored claims; daily streaks are optional statistics only. */
export type CourseTitle={track:string;course:string;streak:string;top:string;mastery:string};
export const STREAK_DAYS=10;
export const courseTitles:CourseTitle[]=[
 {track:'marketing',course:'AI Digital Marketing',streak:'Campaign Director',top:'Campaign Strategist',mastery:'Campaign Practitioner'},
 {track:'development',course:'AI Full-Stack Development',streak:'Full-Stack Lead',top:'Full-Stack Builder',mastery:'Full-Stack Practitioner'},
 {track:'filmmaking',course:'AI Filmmaking',streak:'Film Director',top:'Lead Filmmaker',mastery:'Filmmaking Practitioner'},
 {track:'storytelling',course:'AI-powered Visual Storytelling',streak:'Creative Director',top:'Lead Visual Storyteller',mastery:'Visual Storytelling Practitioner'}];
export const titleFor=(track:string)=>courseTitles.find(t=>t.track===track);
export type ScoreLite={mission_id:string;clues:number;day?:string;points?:number};
/** Course completion recognition; historical perfect-score statistics are optional details only. */
export function starLearnerProgress(track:string,completed:ReadonlySet<string>,scores:ScoreLite[]){
 const ids=missions.filter(m=>m.track===track).map(m=>m.id);
 const perfect=ids.flatMap(id=>{const score=scores.find(s=>s.mission_id===id);return completed.has(id)&&score?.points===100&&score.clues===0?[score]:[]});
 const best=newMissionStreak(perfect.map(s=>s.day||'')).best;
 return {earned:ids.length===10&&ids.every(id=>completed.has(id)),completed:ids.filter(id=>completed.has(id)).length,perfect:perfect.length,best,total:ids.length};
}
const dayNumber=(d:string)=>Date.UTC(+d.slice(0,4),+d.slice(5,7)-1,+d.slice(8,10))/86400000;
/** Runs of consecutive India-time days with a new scored mission. `current` counts only if the run reaches today or yesterday. */
export function newMissionStreak(days:string[],today?:string){
 const nums=[...new Set(days.filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)).map(dayNumber))].sort((a,b)=>a-b);
 let best=0,run=0,prev=NaN,last=0;for(const n of nums){run=n-prev===1?run+1:1;prev=n;last=run;if(run>best)best=run}
 const t=today&&/^\d{4}-\d{2}-\d{2}$/.test(today)?dayNumber(today):NaN;const current=nums.length&&Number.isFinite(t)&&t-prev<=1?last:0;
 return {current,best};
}
export type CourseProgress={track:string;done:number;total:number;scored:number;cluesUsed:number;missionsWithClues:number;title:'streak'|'top'|'mastery'|null;name:string|null;left:number;bestStreak:number};
/** `completed` = ids of missions with saved work; `scores` = the learner's scored missions (with clue counts). */
export function courseProgress(track:string,completed:ReadonlySet<string>,scores:ScoreLite[]):CourseProgress{
 const ids=missions.filter(m=>m.track===track).map(m=>m.id);const total=ids.length;
 const done=ids.filter(id=>completed.has(id)).length;const mine=scores.filter(s=>ids.includes(s.mission_id));
 const cluesUsed=mine.reduce((n,s)=>n+s.clues,0);const missionsWithClues=mine.filter(s=>s.clues>0).length;
 const allDone=total>0&&done===total;
 const t=titleFor(track);const bestStreak=newMissionStreak(mine.map(x=>x.day||'')).best;const title=allDone?'streak':done>=8?'top':done>=6?'mastery':null;
 return {track,done,total,scored:mine.length,cluesUsed,missionsWithClues,title,name:t?(title==='streak'?t.streak:title==='top'?t.top:title==='mastery'?t.mastery:null):null,left:total-done,bestStreak};
}
export const streakRules='Daily streak: complete one new mission, in any course, on each consecutive day (India time). Repeating a finished mission is practice and does not count. A clue does not count for or against it. A missed day resets only your streak. Points, finished missions and titles are never removed.';
export const titleRules='Course titles recognise useful completed creations: 6 for Practitioner, 8 for the next title, and all 10 for the highest course title. Asking for clues, imperfect scores and taking breaks do not reduce eligibility. Daily streaks are optional statistics. A title is recognition inside WhatsLearn, not a qualification or a claim of job readiness. There is no leaderboard.';
