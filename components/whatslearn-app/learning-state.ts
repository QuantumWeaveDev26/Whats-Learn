import {missions,type Mission} from '@/lib/missions';
import {lockFor,missionsOfCourse} from '@/lib/progression';
import {needsMembership} from '@/lib/mission-access';
import {checkpointFor,checkpointKey} from '@/lib/checkpoints';
import {checkAnswerShape,composeAnswer,emptyAnswer,LIMITS,type Answer} from '@/lib/practical';
import type {Snapshot} from './api';
import type {Next} from './tabs';

export type Feedback={summary:string;strengths:string[];checks:{item:string;met:boolean;note:string}[];nextStep:string;example?:string};
export type Evidence={artifact:string;test:string;result:string;improvement:string};
export type Step='learn'|'check'|'make'|'self'|'review';
export const emptyEvidence=():Evidence=>({artifact:'',test:'',result:'',improvement:''});
export const draftKey=(account:string,id:string)=>`wla-draft:${account}:${id}`;
export const resumeKey=(account:string)=>`wla-resume:${account}`;
export const historyKey=(account:string,id:string)=>`wla-history:${account}:${id}`;
const obj=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const parse=(raw:string|null):unknown=>{try{return raw?JSON.parse(raw):null}catch{return null}};
const str=(x:unknown,max=9000)=>typeof x==='string'?x.slice(0,max):'';
export function feedbackOf(value:unknown):Feedback|null{
 const x=typeof value==='string'?parse(value):value;
 if(!obj(x)||typeof x.summary!=='string'||typeof x.nextStep!=='string'||!Array.isArray(x.checks)||!Array.isArray(x.strengths))return null;
 return {summary:str(x.summary,4000),nextStep:str(x.nextStep,4000),strengths:x.strengths.filter((v):v is string=>typeof v==='string').slice(0,8),checks:x.checks.filter(obj).filter(c=>typeof c.item==='string'&&typeof c.met==='boolean'&&typeof c.note==='string').slice(0,20).map(c=>({item:str(c.item,500),met:c.met as boolean,note:str(c.note,2000)})),example:str(x.example,2000)};
}
/** Browser state is a navigation convenience; access is rechecked using the current account snapshot. */
export function restoreResume(raw:string|null,s:Snapshot):{target:Next;tab:'home'|'courses'|'practice'|'mentor'|'me'}|null{
 const x=parse(raw);if(!obj(x)||x.v!==1||x.account!==s.accountKey||!obj(x.target))return null;
 const completed=new Set(s.work.map(w=>w.mission_id)),cleared=new Set(s.checkpoints);
 const tab=['home','courses','practice','mentor','me'].includes(str(x.tab))?x.tab as 'home'|'courses'|'practice'|'mentor'|'me':'practice';
 const target=x.target;
 if(target.kind==='mission'){
  const m=missions.find(m=>m.id===target.id);if(!m)return null;
  if(!completed.has(m.id)&&(lockFor(m,completed,cleared).locked||needsMembership(m,s.paidAccess)))return null;
  return {target:{kind:'mission',mission:m,position:missionsOfCourse(m.track).findIndex(v=>v.id===m.id)+1},tab};
 }
 if(x.target.kind==='checkpoint'){
  const track=str(x.target.track),after=Number(x.target.after),list=missionsOfCourse(track);
  if(!checkpointFor(track,after)||!list[after-1]||!completed.has(list[after-1].id)||cleared.has(checkpointKey(track,after)))return null;
  return {target:{kind:'checkpoint',track,after},tab};
 }
 return null;
}
export function resumeRecord(account:string,target:Next|null,tab:string){
 if(!target||!['mission','checkpoint'].includes(target.kind))return '';
 return JSON.stringify({v:1,account,tab,target:target.kind==='mission'?{kind:'mission',id:target.mission.id}:target.kind==='checkpoint'?{kind:'checkpoint',track:target.track,after:target.after}:null});
}
export function restoreDraft(raw:string|null,mission:Mission,language:string,initial:Answer=emptyAnswer()){
 const x=parse(raw),record=obj(x)?x:{},a=obj(record.answer)?record.answer:record;
 const fields=obj(a.fields)?a.fields:{};
 const answer:Answer={fields:Object.fromEntries((mission.practical?.fields||[]).map(f=>[f.id,typeof fields[f.id]==='string'?str(fields[f.id],f.type==='code'?LIMITS.code:f.type==='short'?LIMITS.short:LIMITS.long):initial.fields[f.id]??f.starter??''])),reasoning:typeof a.reasoning==='string'?str(a.reasoning,LIMITS.reasoning):initial.reasoning,link:typeof a.link==='string'?str(a.link,LIMITS.link):initial.link};
 const decoded=splitEvidence(answer.reasoning);if(!obj(record.evidence))answer.reasoning=decoded.reasoning;
 const e=obj(record.evidence)?record.evidence:decoded.evidence;const evidence:Evidence={artifact:str(e.artifact,2500),test:str(e.test,500),result:str(e.result,700),improvement:str(e.improvement,500)};
 const matches=record.language===language&&record.level===(mission.practiceLevel||'practising');
 const quizPassed=matches&&record.quiz===mission.answer;
 const checks=Array.from({length:5},(_,i)=>Array.isArray(record.checks)&&record.checks[i]===true);
 const review=matches?feedbackOf(record.review):null;
 let step:Step=quizPassed&&['learn','check','make','self','review'].includes(str(record.step))?record.step as Step:'learn';
 if((step==='self'||step==='review')&&missingParts(mission,answer,evidence).length)step='make';
 if(step==='review'&&(!review||record.reviewBody!==composeAnswer(mission.practical,{...answer,reasoning:answerBody(answer,evidence)})))step='self';
 return {answer,evidence,quizPassed,checks,review,step,part:record.part===1||record.part===2?record.part:0,restored:!!raw};
}
/** Preserve our saved submission format when opening a creation for improvement. Legacy prose stays intact. */
function splitEvidence(reasoning:string):{reasoning:string;evidence:Evidence}{
 const labels=['Artifact / relevant code:\n','What I actually tested:\n','Observed result:\n','What I improved:\n'];
 const positions:number[]=[];let start=0;
 for(const label of labels){const at=reasoning.indexOf(label,start);if(at<0||(at>0&&!reasoning.slice(0,at).endsWith('\n\n')))return {reasoning,evidence:emptyEvidence()};positions.push(at);start=at+label.length}
 const values=labels.map((label,i)=>reasoning.slice(positions[i]+label.length,positions[i+1]??reasoning.length).trim());
 return {reasoning:reasoning.slice(0,positions[0]).trim(),evidence:{artifact:values[0],test:values[1],result:values[2],improvement:values[3]}};
}
export function answerBody(a:Answer,e:Evidence){
 // App-only evidence fields feed the existing reasoning contract; shared APIs and assessment stay unchanged.
 return [a.reasoning.trim(),e.artifact.trim()&&`Artifact / relevant code:\n${e.artifact.trim()}`,e.test.trim()&&`What I actually tested:\n${e.test.trim()}`,e.result.trim()&&`Observed result:\n${e.result.trim()}`,e.improvement.trim()&&`What I improved:\n${e.improvement.trim()}`].filter(Boolean).join('\n\n');
}
export type MissingPart={id:string;label:string;part:0|1|2;message:string};
export function missingParts(m:Mission,a:Answer,e:Evidence):MissingPart[]{
 const out:MissingPart[]=[];
 for(const f of m.practical?.fields||[]){
  const result=checkAnswerShape({fields:[f]},{fields:a.fields,reasoning:'A complete placeholder for field validation only.',link:''});
  if(!result.ok)out.push({id:'f-'+f.id,label:f.label,part:0,message:result.errors[0]});
 }
 const required:[keyof Evidence,string,number][]=[['artifact','Your artifact or relevant code',20],['test','The test you actually ran',10],['result','What actually happened',10],['improvement','The improvement you made',10]];
 for(const [id,label,min] of required)if(e[id].trim().length<min)out.push({id:'e-'+id,label,part:1,message:`Add ${label.toLowerCase()} in your own words.`});
 if(a.reasoning.trim().length<LIMITS.minReasoning)out.push({id:'f-reason',label:'Your reasoning',part:2,message:`Explain your choices in at least ${LIMITS.minReasoning} characters.`});
 const reasoning=answerBody(a,e);
 if(reasoning.length>LIMITS.reasoning){const existing=out.findIndex(x=>x.id==='f-reason');if(existing>=0)out.splice(existing,1);out.push({id:'f-reason',label:'Evidence and reasoning length',part:2,message:`Keep evidence and reasoning together under ${LIMITS.reasoning} characters (currently ${reasoning.length}). Use short relevant extracts and concise actual results.`})}
 if(composeAnswer(m.practical,{...a,reasoning}).length>LIMITS.total)out.push({id:'e-artifact',label:'Submission length',part:1,message:`Shorten the relevant extract so the complete submission is under ${LIMITS.total} characters.`});
 if(m.practical?.link&&!checkAnswerShape({fields:[],link:m.practical.link},{...a,reasoning:'A complete placeholder for link validation only.'}).ok)out.push({id:'f-link',label:'Reference link',part:2,message:'Use a normal https:// link, or leave it blank.'});
 return out;
}
export type Version={body:string;review:Feedback;createdAt:string};
export function versionsOf(raw:string|null):Version[]{const x=parse(raw);return Array.isArray(x)?x.filter(obj).flatMap(v=>{const review=feedbackOf(v.review);return review&&typeof v.body==='string'&&typeof v.createdAt==='string'?[{body:str(v.body,9000),review,createdAt:v.createdAt}]:[]}).slice(0,5):[]}
export function addVersion(raw:string|null,body:string,review:Feedback,createdAt:string){return JSON.stringify([{body,review,createdAt},...versionsOf(raw).filter(v=>v.body!==body)].slice(0,5))}
