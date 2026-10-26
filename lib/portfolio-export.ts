import {missions} from './missions';
import {programmeNames} from './programmes';
import {readableBody} from './practical';
import {feedbackSummary,reviewAccepted} from './review-summary';
import type {Review} from './ai-feedback';

type SavedWork={mission_id:string;body:string;checks:string;updated_at:string;evaluation?:string|null};
type Starter={outcome:string;draft:{updatedAt:string;body:string}};
function savedReview(raw?:string|null):Review|null{
 try{
  const r=JSON.parse(raw||'null');
  if(!r||typeof r.summary!=='string'||typeof r.nextStep!=='string'||!Array.isArray(r.strengths)||!r.strengths.every((s:unknown)=>typeof s==='string')||!Array.isArray(r.checks)||!r.checks.length||!r.checks.every((c:Record<string,unknown>|null)=>c&&typeof c.item==='string'&&typeof c.met==='boolean'&&typeof c.note==='string'))return null;
  if(r.blockingIssue!==undefined&&typeof r.blockingIssue!=='string')return null;
  if(r.answerAssessment&&(typeof r.answerAssessment.onTopic!=='boolean'||typeof r.answerAssessment.correct!=='boolean'||typeof r.answerAssessment.reason!=='string'))return null;
  if(r.practicalTest&&(['created','performed','reported'].some(k=>typeof r.practicalTest[k]!=='boolean')||typeof r.practicalTest.note!=='string'))return null;
  return r as Review;
 }catch{return null;}
}
/** Private plain-text export: preserve the work; never invent an assessment for legacy records. */
export function portfolioExport(work:SavedWork[],starters:Starter[]=[]){
 const pieces=work.map(w=>{
  const m=missions.find(m=>m.id===w.mission_id),r=savedReview(w.evaluation);
  const lines=[m?.title||w.mission_id,m?`Course: ${programmeNames[m.track]||m.track}`:'',`Saved: ${w.updated_at}`,'',readableBody(w.body),''];
  if(!r)lines.push('No readable AI evaluation is attached. This export does not establish assessment or certification.');
  else{
   const summary=feedbackSummary(r);
   lines.push('Saved AI feedback (not a certified assessment)',r.summary,`Review outcome: ${reviewAccepted(r)?'Met the stored practical-review requirements.':'Does not establish accepted practical work.'}`,`What worked: ${summary.worked||'No verified strength recorded.'}`,`Improve: ${summary.improve}`,`Next action: ${summary.next}`,'Criteria:',...r.checks.map(c=>`${c.met?'Met':'Needs work'} — ${c.item}: ${c.note}`));
   if(r.practicalTest&&typeof r.practicalTest.note==='string')lines.push(`Reported trial: ${r.practicalTest.note}`);
   if(r.example&&typeof r.example==='string')lines.push(`Illustrative example, not learner work: ${r.example}`);
   if(r.source&&typeof r.source.repository==='string'&&typeof r.source.commit==='string'&&Array.isArray(r.source.files)&&r.source.files.every(f=>typeof f==='string'))lines.push(`Static source review: ${r.source.repository} @ ${r.source.commit}`,`Files: ${r.source.files.join(', ')}`,'A static source review does not prove that the complete application was executed.');
   if(r.execution)lines.push(r.execution.executed===true?'A limited execution receipt was attached to this review; it is not evidence that a full application was tested.':'No successful execution is recorded in the attached receipt.');
  }
  return lines.filter((line,index)=>line!==''||index>1).join('\n');
 });
 pieces.push(...starters.map(st=>`Starter piece: ${st.outcome}\nSaved: ${st.draft.updatedAt}\nSeparate practice; not a completed course mission.\n\n${st.draft.body}`));
 return ['WhatsLearn — My private work','This file is downloaded privately. Nothing is published by exporting.',...pieces].join('\n\n---\n\n');
}
