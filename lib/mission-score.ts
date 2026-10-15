import {missions,type Mission} from './missions';
import {checkWriting,meaningful,stem,tokens,type WritingCheck} from './writing-check';
/**
 * Mission points. Each mission has exactly two questions: an understanding question (25 points) and a practical
 * "try it" task (75 points). Clues cost 5 points each, at most 10 points per mission, and a score never goes below zero.
 * Everything here is a quick rule-based check on this site. It is not an AI review and it cannot prove who wrote an answer.
 */
export const POINTS={understanding:25,practical:75,clue:5,clueCap:10,total:100} as const;
export const clueIds=['puzzle','example','hint'] as const;
export type ClueId=typeof clueIds[number];
export const clueNames:Record<ClueId,string>={puzzle:'the side-quest clue',example:'the worked example',hint:'the hint'};
/** Practical points by the quick writing check's band. Blocked bands (empty, filler, copied, off-topic) earn nothing and are not saved as new work. */
const practicalByBand:Record<string,number>={strong:75,good:60,'needs-work':45,weak:30};
export type Score={understanding:number;practical:number;clues:number;deduction:number;points:number};
export function clueDeduction(clues:number){return Math.min(POINTS.clueCap,Math.max(0,Math.trunc(clues))*POINTS.clue)}
export function scoreMission(input:{understandingCorrect:boolean;writing:WritingCheck;clues:number}):Score{
 const understanding=input.understandingCorrect?POINTS.understanding:0;const practical=practicalByBand[input.writing.band]??0;
 const clues=Math.max(0,Math.trunc(input.clues));const deduction=Math.min(clueDeduction(clues),understanding+practical);
 return {understanding,practical,clues,deduction,points:Math.max(0,understanding+practical-deduction)};
}
export function scoreSummary(s:Score){return `${s.points} points: understanding ${s.understanding} + practical ${s.practical}${s.deduction?` − clues ${s.deduction}`:''}`}
export const dailyLimitMessage='You have already completed today’s new mission. Earlier missions stay open for practice, but they do not earn the same points again. A new mission opens at midnight India time (IST), the same day boundary for every learner.';
export const guestLimitNote='Guest progress is saved on this device only, so this daily limit and your points count on this device, and they may be lost if you clear your browser data. Sign in to keep them with your account.';

// Course relevance. Each course has its own vocabulary, built from its missions. Stems used by every course are ignored.
const courseVocabulary=new Map<string,Set<string>>();
function vocabularies(){
 if(courseVocabulary.size)return courseVocabulary;
 const tracks=[...new Set(missions.map(m=>m.track))];const all=new Map<string,Set<string>>();
 for(const t of tracks){const set=new Set<string>();for(const m of missions.filter(x=>x.track===t))for(const w of tokens([m.title,m.skill,m.brief,m.lesson,m.task,...m.checks,m.question,...m.options,m.explanation].join(' ')))if(meaningful(w))set.add(stem(w));all.set(t,set)}
 for(const t of tracks){const others=tracks.filter(x=>x!==t);courseVocabulary.set(t,new Set([...all.get(t)!].filter(s=>others.filter(o=>all.get(o)!.has(s)).length<=1)))}
 return courseVocabulary;
}
/** How many of the learner's words belong to each course's own vocabulary. */
export function courseHits(text:string){
 const stems=new Set(tokens(text).filter(meaningful).map(stem));const out:Record<string,number>={};
 for(const [t,set] of vocabularies())out[t]=[...stems].filter(s=>set.has(s)).length;return out;
}
// Words that point to this mission: stems used in this mission and in at most three of the forty missions, or used only in this mission's own course.
const missionWords=new Map<string,Set<string>>();
const missionText=(m:Mission)=>[m.title,m.skill,m.brief,m.lesson,m.task,...m.checks,m.question,...m.options,m.explanation].join(' ');
const stemsOf=(t:string)=>new Set(tokens(t).filter(meaningful).map(stem));
function distinctive(m:Mission){
 if(!missionWords.size){
  const per=new Map(missions.map(x=>[x.id,stemsOf(missionText(x))]));const df=new Map<string,number>();const tracksOf=new Map<string,Set<string>>();
  for(const x of missions)for(const w of per.get(x.id)!){df.set(w,(df.get(w)||0)+1);(tracksOf.get(w)||tracksOf.set(w,new Set()).get(w)!).add(x.track)}
  for(const x of missions)missionWords.set(x.id,new Set([...per.get(x.id)!].filter(w=>(df.get(w)||0)<=3||tracksOf.get(w)!.size===1)));
 }
 return missionWords.get(m.id)||new Set<string>();
}
/** How many of the learner's words are specific to this mission. */
export function missionHits(m:Mission,text:string){const own=distinctive(m);return [...stemsOf(text)].filter(w=>own.has(w)).length}
export const MIN_MISSION_WORDS=3;
const asksWhy=(m:Mission)=>/\b(explain|why|reason|justify|because)\b/i.test(m.task);
const latinShare=(t:string)=>{const letters=[...t].filter(c=>/\p{L}/u.test(c));return letters.length?letters.filter(c=>/\p{Script=Latin}/u.test(c)).length/letters.length:0};
const reasoningWords=/\b(because|since|so that|so|therefore|which means|this means|means|helps?|helped|reason|why|ensures?|prevents?|avoids?|protects?|lets|allows|otherwise|instead|in order to|as a result|rather than|trade-?off|would|could|if|makes?|needs?|better|easier|safer|clearer|fairer|risk|keeps?|stops?|pull|gives?)\b/i;
export type Gate={ok:boolean;reason:'ok'|'blocked'|'few-ideas'|'wrong-course'|'no-reasoning';message:string};
/**
 * The extra checks an answer must pass before a NEW mission earns points. Beyond the quick writing check it needs at least two ideas
 * from this mission, words that belong to this course rather than another, and, where the task asks "why", a stated reason.
 */
export function pointsGate(mission:Mission,body:string,writing:WritingCheck=checkWriting(mission,body)):Gate{
 if(writing.blocked)return {ok:false,reason:'blocked',message:writing.tip};
 const hits=courseHits(body);const mine=hits[mission.track]??0;const best=Object.entries(hits).sort((a,b)=>b[1]-a[1])[0];
 // Enough of this mission's own words, or, for missions with a short brief, many mission ideas and clearly more words from this course than from any other.
 const leads=mine>=5&&Object.entries(hits).every(([t,n])=>t===mission.track||n<mine);
 // Answers written mostly in another script (Hindi, Kannada and the other supported languages) are matched on the mission's words in those languages, not on the English course vocabulary.
 const native=latinShare(body)<0.5;
 if(native)return writing.onTopic.length>=3?{ok:true,reason:'ok',message:'Passed the quick check on this site (not an AI review).'}:{ok:false,reason:'few-ideas',message:`Your answer does not yet use enough of this mission’s own ideas. Build it around the task, for example: ${mission.checks[0].toLowerCase()}. Use your own words and examples, then try again.`};
 if(writing.onTopic.length<2||(missionHits(mission,body)<MIN_MISSION_WORDS&&!(leads&&writing.onTopic.length>=5))){const missing=mission.checks[0].toLowerCase();return {ok:false,reason:'few-ideas',message:`Your answer does not yet use enough of this mission’s own ideas. Build it around the task, for example: ${missing}. Use your own words and examples from the brief, then try again.`}}
 // Another course clearly fits better than this one (its words lead by 2 or more), or a mission in another course matches much better than this mission does.
 const rival=Math.max(0,...missions.filter(x=>x.track!==mission.track).map(x=>missionHits(x,body)));const mineHere=missionHits(mission,body);
 if(mine===0||(best&&best[0]!==mission.track&&best[1]>=mine+2)||(rival>=mineHere+3&&rival>=mineHere*2))return {ok:false,reason:'wrong-course',message:`This reads like it is about a different course. Answer in terms of this mission’s own topic: ${mission.skill}. Re-read the task and try again.`};
 if(asksWhy(mission)&&latinShare(body)>0.7){const sentences=body.split(/[.!?\n]+/).filter(s=>tokens(s).length>=3).length;if(sentences<2||!reasoningWords.test(body))return {ok:false,reason:'no-reasoning',message:'This task asks you to explain your thinking. Add a sentence that gives your own reason, for example one that starts with “because…”, then try again.'}}
 return {ok:true,reason:'ok',message:'Passed the quick check on this site (not an AI review).'};
}
export type Award={status:'awarded'|'practice'|'duplicate'|'daily-limit'|'rejected';score?:Score;message:string};
/** Pure decision used by the server and by the guest (this-device) store: what happens when a learner saves a mission. */
export function decideAward(state:{hasWork:boolean;scoredBefore:boolean;dayUsedByOther:boolean}):'practice'|'duplicate'|'daily-limit'|'award'{
 if(state.scoredBefore)return 'duplicate';
 if(state.hasWork)return 'practice';
 if(state.dayUsedByOther)return 'daily-limit';
 return 'award';
}
