import {courseTerms} from './course-terms';
import {missions,type Mission} from './missions';
import {localizeMission} from './personalization';
import {lessonLanguages} from './languages';
import {looksLikeGibberish,looksLikeMachineText} from './text-signals';
/**
 * Basic writing check that runs without any AI key, on the device and on the server.
 * It reads the learner's actual text: length against the task, whether it talks about this mission,
 * sentence structure and variety, and signs of copying (from the worked example or any text of the mission) or filler. It cannot prove who wrote an answer. It is a heuristic, not an assessment;
 * whether each checklist point is met is left to the learner's self-review or the AI review.
 */
export type WritingCheck={words:number;target:[number,number];score:number;band:'empty'|'off-topic'|'copied'|'filler'|'weak'|'needs-work'|'good'|'strong';stars:1|2|3;blocked:boolean;onTopic:string[];tip:string};
const STOP=new Set('about above after again also another answer because before being below between both busy clear could does doing each every from have having here into just like make more most must need only other over same should show some such than that their them then there these they this those through under until very what when where which while will with without would write your yours using used include includes words word sentence sentences explain describe name end ends offer specific one two three first next given need needs task'.split(' '));
export const tokens=(t:string)=>(t.toLowerCase().normalize('NFC').match(/[\p{L}\p{M}\p{N}]+/gu)||[]);
export const stem=(w:string)=>[...w].slice(0,5).join('');
export const meaningful=(w:string)=>[...w].length>=4&&!STOP.has(w)&&!/^\d+$/.test(w);
const cache=new Map<string,{all:Set<string>;example:Set<string>[];course:Set<string>}>();
const grams=(words:string[],n=5)=>{const out:string[]=[];for(let i=0;i+n<=words.length;i++)out.push(words.slice(i,i+n).join(' '));return out};
/** Keywords from the mission in every language it exists in, so the check works whatever language the learner writes in. */
export function keywords(m:Mission){
 const hit=cache.get(m.id);if(hit)return hit;
 // Display-only draft translations must not broaden the evidence gate or change its canonical task vocabulary.
 const versions=lessonLanguages.map(l=>({...localizeMission(m,l),task:m.task,options:m.options,explanation:m.explanation}));
 const all=new Set<string>(),example:Set<string>[]=[],course=new Set<string>();
 for(const v of versions){for(const w of tokens([v.title,v.brief,v.task,v.lesson,...v.checks].join(' ')))if(meaningful(w))all.add(stem(w));example.push(new Set(tokens(v.example).map(stem)));for(const g of grams(tokens([v.brief,v.lesson,v.example,v.task,...v.checks,...v.options,v.explanation].join(' '))))course.add(g)}
 for(const lang of Object.values(courseTerms))for(const w of lang[m.id]||[])for(const t of tokens(w))if(meaningful(t))all.add(stem(t));
 const k={all,example,course};cache.set(m.id,k);return k;
}
function target(m:Mission):[number,number]{const r=m.task.match(/(\d+)\s*[–-]\s*(\d+)\s*word/i);if(r)return [Number(r[1]),Number(r[2])];const u=m.task.match(/under\s+(\d+)\s*word/i);if(u)return [Math.round(Number(u[1])/2),Number(u[1])];return [30,150]}
/** `selfReview` is the learner's ticked checklist, used only to choose the tip. */
export function checkWriting(missionOrId:Mission|string,body:string,selfReview:boolean[]=[]):WritingCheck{
 const m=typeof missionOrId==='string'?missions.find(x=>x.id===missionOrId):missionOrId;if(!m)throw new Error('Unknown challenge');
 // Executable artifacts are checked by the isolated runner; judge the learner’s own prose separately.
 const text=body.replace(/JS_ARTIFACT_BEGIN[\s\S]*?JS_ARTIFACT_END/g,'').trim();const words=tokens(text);const n=words.length;const [min,max]=target(m);const k=keywords(m);
 const stems=new Set(words.filter(meaningful).map(stem));
 const onTopic=[...stems].filter(s=>k.all.has(s));
 const unique=new Set(words).size/Math.max(1,n);
 const own=grams(words);const pasted=n>=10&&own.length>0&&own.filter(g=>k.course.has(g)).length/own.length>=0.5;
 const copied=pasted||k.example.some(ex=>{if(ex.size<6)return false;const ws=words.map(stem);const same=ws.filter(w=>ex.has(w)).length;return n>=6&&same/Math.max(ws.length,1)>0.8&&same/ex.size>0.6});
 const machine=looksLikeMachineText(text),gibberish=!machine&&looksLikeGibberish(text);
 const filler=gibberish||n>=8&&(unique<0.35||/(.)\1{5,}/u.test(text));
 const sentences=text.split(/[.!?।॥۔\n]+/u).filter(s=>tokens(s).length>=3).length;
 let score=Math.round((n<5?0:n<min?35*n/min:n>max*1.6?25:35)+Math.min(45,onTopic.length*7)+(sentences>=2?10:sentences===1?5:0)+(unique>=0.5?10:unique>=0.4?5:0));
 let band:WritingCheck['band'];
 if(machine){band='off-topic';score=0}else if(n<5){band='empty';score=0}else if(filler){band='filler';score=Math.min(score,10)}else if(copied){band='copied';score=Math.min(score,20)}else if(onTopic.length===0){band='off-topic';score=Math.min(score,15)}
 else band=score>=80?'strong':score>=60?'good':score>=40?'needs-work':'weak';
 const blocked=['empty','filler','copied','off-topic'].includes(band);
 const missing=m.checks.find((_,i)=>!selfReview[i]);
 const tip=band==='empty'?'Write a few sentences that answer the task before saving.'
  :band==='filler'?'This looks like repeated or filler text. Write a real answer in your own words.'
  :band==='copied'?'This is very close to the example or the lesson text. Rewrite it in your own words for your own customer or idea.'
  :machine?`This looks like copied server log, code or terminal text, not an answer. Write a few sentences of your own for the task: ${m.task}`
  :band==='off-topic'?`Your answer doesn’t seem to be about this mission yet. Re-read the task: ${m.task}`
  :n<min?`Add about ${min-n} more words. ${missing?'Use them to '+missing.charAt(0).toLowerCase()+missing.slice(1)+'.':''}`.trim()
  :n>max*1.6?`Trim it closer to ${max} words; keep only what helps the reader decide.`
  :onTopic.length<3?`Connect it more closely to the situation: ${m.brief}`
  :missing?`Check this before saving: ${missing}.`
  :'Strong. Try the same idea for a different customer or situation.';
 const stars=(band==='strong'?3:band==='good'?2:1) as 1|2|3;
 return {words:n,target:[min,max],score,band,stars,blocked,onTopic,tip};
}
/** Stars from an AI review: 4 or more checklist points met = 3, 2–3 = 2, fewer = 1. */
export function aiStars(r:{checks:{met:boolean}[]}){const met=r.checks.filter(c=>c.met).length;return met>=4?3:met>=2?2:1}
