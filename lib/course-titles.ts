import {missions} from './missions';
/**
 * Course titles. A title is a recognition inside WhatsLearn for finishing a course. It is not a qualification, a test result, or a statement about ability or job readiness.
 *  - Top title: all 10 missions of the course completed, each one scored here, and no clue used on any of them.
 *  - Mastery title (lower): all 10 missions completed, but at least one clue was used (or a mission was completed before points existed, so its clue use is unknown).
 *  - Streak title (highest): all 10 missions of ONE course completed, zero clues used in that course, and those 10 missions completed as one new mission a day on 10 consecutive India-time days. A day spent on another course, or a missed day, breaks the run (it must be restarted); any clue in the course disqualifies the title for that course. Read from the server-verified score records. A title already earned is never removed.
 *  - Daily streak (separate, shown in the rewards panel): one new scored mission, in any course, on each consecutive India-time day. Practice repeats and clue use neither count for nor against it; a missed day resets only the current streak.
 * Clue use is counted per mission and per course. A missed day never removes a title, points or a completed mission.
 */
export type CourseTitle={track:string;course:string;streak:string;top:string;mastery:string};
export const STREAK_DAYS=10;
export const courseTitles:CourseTitle[]=[
 {track:'marketing',course:'AI Digital Marketing',streak:'Campaign Director',top:'Campaign Strategist',mastery:'Campaign Practitioner'},
 {track:'development',course:'AI Full-Stack Development',streak:'Full-Stack Lead',top:'Full-Stack Builder',mastery:'Full-Stack Practitioner'},
 {track:'filmmaking',course:'AI Filmmaking',streak:'Film Director',top:'Lead Filmmaker',mastery:'Filmmaking Practitioner'},
 {track:'storytelling',course:'AI-powered Visual Storytelling',streak:'Creative Director',top:'Lead Visual Storyteller',mastery:'Visual Storytelling Practitioner'}];
export const titleFor=(track:string)=>courseTitles.find(t=>t.track===track);
export type ScoreLite={mission_id:string;clues:number;day?:string;points?:number};
/** Separate from the existing course titles and access rewards: only stored perfect scores count. */
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
 const allDone=done===total;const clean=allDone&&mine.length===total&&cluesUsed===0;
 const t=titleFor(track);const bestStreak=newMissionStreak(mine.map(x=>x.day||'')).best;const title=clean&&bestStreak>=STREAK_DAYS?'streak':clean?'top':allDone?'mastery':null;
 return {track,done,total,scored:mine.length,cluesUsed,missionsWithClues,title,name:t?(title==='streak'?t.streak:title==='top'?t.top:title==='mastery'?t.mastery:null):null,left:total-done,bestStreak};
}
export const streakRules='Daily streak: complete one new mission, in any course, on each consecutive day (India time). Repeating a finished mission is practice and does not count. A clue does not count for or against it. A missed day resets only your streak. Points, finished missions and titles are never removed.';
export const titleRules='Titles, highest first. 10-day no-clue title (Campaign Director, Full-Stack Lead, Film Director or Creative Director): finish all 10 missions of one course, with no clue anywhere in that course, one new mission a day for 10 consecutive days (India time), all in that course. A day on another course, or a missed day, breaks that run, so restart it. Using any clue in the course rules this title out. Top title: all 10 missions, no clue. Practitioner title: all 10 missions with at least one clue, or one finished before points existed. A missed day never removes points, missions or a title you earned. A title is recognition inside WhatsLearn only, not a qualification or a statement about ability or job readiness. There is no leaderboard. A future one would be opt-in and would not show names, emails, work or scores.';
