'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {Check,ArrowLeft,Clock} from 'lucide-react';
import type {Mission} from '@/lib/missions';
import {composeAnswer,emptyAnswer,LIMITS,type Answer} from '@/lib/practical';
import {wrongAnswerMessage} from '@/lib/submission';
import {api,readLocal,writeLocal} from './api';
import {learningGuide} from './learning-guide';
import {addVersion,answerBody,draftKey,feedbackOf,historyKey,missingParts,restoreDraft,type Evidence,type Feedback,type Step} from './learning-state';
import {FeedbackCard} from './feedback';

export type Saved={points?:number;balance?:number;message:string;status:string;track?:string};
type Props={accountKey:string;mission:Mission;position:number;language:string;initialAnswer?:Answer;onSaved:(s:Saved)=>void;onUpgrade:()=>void;onBack:()=>void;onPoints?:()=>void};
export function MissionFlow({accountKey,mission,position,language,initialAnswer,onSaved,onUpgrade,onBack,onPoints}:Props){
 const key=draftKey(accountKey,mission.id),guide=learningGuide(mission);
 const [initial]=useState(()=>restoreDraft(readLocal(key),mission,language,initialAnswer||emptyAnswer()));
 const [step,setStep]=useState<Step>(initial.step),[part,setPart]=useState(initial.part);
 const [answer,setAnswer]=useState<Answer>(initial.answer),[evidence,setEvidence]=useState<Evidence>(initial.evidence);
 const [quizPassed,setQuizPassed]=useState(initial.quizPassed),[missed,setMissed]=useState<number[]>([]),[checks,setChecks]=useState(initial.checks);
 const [review,setReview]=useState<Feedback|null>(initial.review),[allow,setAllow]=useState<{limit?:number;used?:number}>({});
 const [reviewBody,setReviewBody]=useState(initial.review?composeAnswer(mission.practical,{...initial.answer,reasoning:answerBody(initial.answer,initial.evidence)}):'');
 const [busy,setBusy]=useState(''),[err,setErr]=useState(''),[leaving,setLeaving]=useState(false),[help,setHelp]=useState<''|'simple'|'example'>('');
 const [attempted,setAttempted]=useState(false),[focusPart,setFocusPart]=useState(''),[draftSaved,setDraftSaved]=useState(true);
 const heading=useRef<HTMLHeadingElement>(null),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[]);
 const body=useMemo(()=>composeAnswer(mission.practical,{...answer,reasoning:answerBody(answer,evidence)}),[mission.practical,answer,evidence]);
 const latestBody=useRef(body);latestBody.current=body;
 const fields=mission.practical?.fields||[],missing=missingParts(mission,answer,evidence);
 const total=fields.length+5,complete=total-new Set(missing.filter(x=>x.id!=='f-link').map(x=>x.id)).size;
 const left=allow.limit===undefined?undefined:Math.max(0,allow.limit-(allow.used||0));
 const steps:Step[]=['learn','check','make','self','review'],at=steps.indexOf(step);
 useEffect(()=>{const ok=writeLocal(key,JSON.stringify({v:2,answer,evidence,step,part,checks,quiz:quizPassed?mission.answer:null,language,level:mission.practiceLevel||'practising',review,reviewBody}));setDraftSaved(ok!==false)},[key,answer,evidence,step,part,checks,quizPassed,mission.answer,mission.practiceLevel,language,review,reviewBody]);
 useEffect(()=>{let active=true;api<{limit?:number;used?:number}>('/api/feedback').then(r=>{if(active&&r.ok)setAllow(r.data)});return()=>{active=false}},[]);
 useEffect(()=>{heading.current?.scrollIntoView({block:'start'});heading.current?.focus({preventScroll:true})},[step]);
 useEffect(()=>{if(!focusPart)return;const field=document.getElementById(focusPart);field?.focus();field?.scrollIntoView({block:'center',behavior:'smooth'});setFocusPart('')},[focusPart,part,step]);
 function changeAnswer(a:Answer){setAnswer(a);setReview(null);setReviewBody('');setErr('')}
 function changeEvidence(id:keyof Evidence,value:string){setEvidence(e=>({...e,[id]:value}));setReview(null);setReviewBody('');setErr('')}
 function nextMissing(){const next=missing[0];if(!next)return;setAttempted(true);setStep('make');setPart(next.part);setFocusPart(next.id)}
 function go(next:Step){setErr('');setStep(next)}
 const instructions=<ol className="wla-guide-steps">{guide.steps.map((line,i)=><li key={i}>{line}</li>)}</ol>;
 const problem=(id:string)=>attempted?missing.find(x=>x.id===id)?.message:undefined;
 const common=(id:string)=>({'aria-required':true as const,'aria-invalid':!!problem(id),'aria-describedby':id+'-help'});
 const note=(id:string,hint?:string)=><small id={id+'-help'} className={problem(id)?'wla-field-error':undefined}>{problem(id)||hint}</small>;
 function remember(r:Feedback){writeLocal(historyKey(accountKey,mission.id),addVersion(readLocal(historyKey(accountKey,mission.id)),body,r,new Date().toISOString()))}
 async function getReview(){
  if(missing.length){nextMissing();return}setErr('');if(left===0){onUpgrade();return}setBusy('review');
  const r=await api<{review?:unknown;limit?:number;used?:number}>('/api/feedback',{method:'POST',body:{action:'review',quiz:mission.answer,missionId:mission.id,body,language}});
  if(!alive.current)return;setBusy('');
  if(latestBody.current!==body){setErr('Your work changed during the review. Review the current version when you are ready.');return}
  if(r.status===403){onUpgrade();return}const parsed=feedbackOf(r.data.review);
  if(!r.ok||!parsed){setErr(r.data.error||'The review could not finish. Your draft is still here. Try again when you are ready.');return}
  setReview(parsed);setReviewBody(body);remember(parsed);setAllow({limit:r.data.limit,used:r.data.used});go('review');
 }
 async function save(){
  if(!review||reviewBody!==body){setErr('Review your current work before saving.');return}setErr('');setBusy('save');
  const r=await api<{saved?:boolean;review?:unknown;award?:{status:string;message:string;score?:{points:number};balance?:number}}>('/api/work',{method:'POST',body:{missionId:mission.id,body,checks,quiz:mission.answer}});
  if(!alive.current)return;setBusy('');
  if(r.status===403&&/plan|Explore/i.test(r.data.error||'')){onUpgrade();return}
  if(!r.ok||r.data.saved!==true){const corrected=feedbackOf(r.data.review);if(corrected){setReview(corrected);setReviewBody(body);remember(corrected)}setErr(r.data.award?.message||r.data.error||'Your work was not confirmed saved. Keep this draft and try again.');return}
  const finalReview=feedbackOf(r.data.review);if(finalReview)remember(finalReview);
  if(latestBody.current!==body){setErr('The submitted version was saved. Your newer edits remain on this device; review them before saving again.');onPoints?.();return}writeLocal(key,'');
  onSaved({track:mission.track,points:r.data.award?.score?.points,balance:r.data.award?.balance,message:r.data.award?.message||'',status:r.data.award?.status||'saved'});
 }
 return <div className="wla-stack wla-practice-flow">
  <div className="wla-practice-top"><button type="button" className="wla-back" disabled={busy==='save'} onClick={()=>step==='learn'||step==='check'?onBack():setLeaving(true)}><ArrowLeft size={18}/>All tasks</button><span className="wla-kicker">Task {String(position).padStart(2,'0')} / 10</span></div>
  {leaving&&<div className="wla-card wla-confirm" role="alertdialog" aria-labelledby="wla-leave-t"><strong id="wla-leave-t">Leave this task?</strong><p className="wla-muted">{draftSaved?'Your draft and current step are saved on this device.':'This device could not save your draft. Copy your work before leaving.'}</p><div className="wla-row-btns"><button type="button" className="wla-ghost" onClick={()=>setLeaving(false)}>Stay</button><button type="button" className="wla-outline" onClick={onBack}>Leave</button></div></div>}
  <div className="wla-practice-progress" aria-label={`Step ${at+1} of 5: ${['Learn','Check','Make','Self-check','Review'][at]}`}><strong>{['Learn','Check','Make','Self-check','Review'][at]} <small>{at+1}/5</small></strong><div className="wla-steps">{steps.map((s,i)=><span key={s} aria-current={s===step?'step':undefined} className={(i<=at?'on':'')+(s===step?' now':'')}><i aria-hidden="true"/><span className="wla-sr">{['Learn','Check','Make','Self-check','Review'][i]}</span></span>)}</div></div>
  <h2 ref={heading} tabIndex={-1} className="wla-h2">{mission.title}</h2>
  <p className="wla-meta"><Clock size={15}/>About {mission.minutes} min · up to 100 points</p>
  {initial.restored&&<p className="wla-restored">Draft restored on this device.</p>}
  {step==='learn'&&<>
   <div className="wla-card wla-tint"><p>{mission.brief}</p></div>
   <div className="wla-card"><p className="wla-kicker">Create, test and share</p>{instructions}<small className="wla-muted">Use tools you already have. Keep practice private; no purchase or public deployment is required.</small></div>
   <details className="wla-disclosure"><summary>The idea behind it</summary><p className="wla-read">{mission.lesson}</p></details>
   <button type="button" className="wla-primary wla-full" onClick={()=>go('check')}>Check my understanding</button>
   {quizPassed&&<button type="button" className="wla-ghost wla-full" onClick={()=>go('make')}>Return to my work</button>}
  </>}
  {step==='check'&&<>
   <button type="button" className="wla-back" onClick={()=>go('learn')}><ArrowLeft size={16}/>Back to lesson</button>
   <h3 className="wla-q">{mission.question}</h3>
   <div className="wla-options">{mission.options.map((o,i)=><button key={i} type="button" disabled={missed.includes(i)} className={'wla-option'+(missed.includes(i)?' off':'')} onClick={()=>{if(i===mission.answer){setQuizPassed(true);go('make')}else setMissed(x=>x.concat(i))}}><span>{o}</span></button>)}</div>
   {missed.length>0&&<p className="wla-muted" role="status">{wrongAnswerMessage(mission)}</p>}
  </>}
  {step==='make'&&<>
   <button type="button" className="wla-back" onClick={()=>go('check')}><ArrowLeft size={16}/>Back to check</button>
   <details className="wla-disclosure"><summary>Task instructions</summary>{instructions}{mission.levelTask&&<p className="wla-read">{mission.levelTask}</p>}</details>
   <div className="wla-form-progress"><strong>{complete} of {total} parts ready</strong><span>Work on one section at a time.</span></div>
   <div className="wla-part-tabs" aria-label="Practical work sections">{['Your work','Test evidence','Your choices'].map((label,i)=><button type="button" key={label} aria-pressed={part===i} onClick={()=>setPart(i)}>{i+1}. {label}</button>)}</div>
   {part===0&&<fieldset className="wla-fieldset"><legend>Your work</legend>{fields.map(f=>{const id='f-'+f.id;return <div key={f.id} className="wla-field"><label htmlFor={id}>{f.prompt||f.label}</label>{note(id,f.hint)}
    {f.type==='choice'?<select id={id} {...common(id)} value={answer.fields[f.id]||''} onChange={e=>changeAnswer({...answer,fields:{...answer.fields,[f.id]:e.target.value}})}><option value="">Choose one…</option>{(f.options||[]).map(o=><option key={o} value={o}>{o}</option>)}</select>
    :f.type==='short'?<input id={id} {...common(id)} value={answer.fields[f.id]||''} maxLength={LIMITS.short} onChange={e=>changeAnswer({...answer,fields:{...answer.fields,[f.id]:e.target.value}})}/>
    :<textarea id={id} {...common(id)} className={f.type==='code'?'wla-code':''} rows={f.type==='code'?7:4} value={answer.fields[f.id]||''} maxLength={f.type==='code'?LIMITS.code:LIMITS.long} onChange={e=>changeAnswer({...answer,fields:{...answer.fields,[f.id]:e.target.value}})}/>}
   </div>})}<button type="button" className="wla-outline wla-full" onClick={()=>setPart(1)}>Next: add test evidence</button></fieldset>}
   {part===1&&<fieldset className="wla-fieldset"><legend>Show what you actually tried</legend><p className="wla-muted">A plan alone does not complete the task. Include your actual work and observed results. Remove passwords and personal details.</p>
    {([['artifact','Your artifact or relevant code','Paste a short relevant extract, or refer to the code field in Your work.',800],['test','The test you actually ran','What did you try, using which input or viewing conditions?',180],['result','What actually happened','Give the output or observation. Label an expected result separately.',180],['improvement','The improvement you made','What did you change after the test, and what happened next?',180]] as const).map(([name,label,hint,max])=>{const id='e-'+name;return <div className="wla-field" key={name}><label htmlFor={id}>{label}</label>{note(id,hint)}<textarea id={id} {...common(id)} className={name==='artifact'&&mission.track==='development'?'wla-code':''} rows={name==='artifact'?6:3} maxLength={max} value={evidence[name]} onChange={e=>changeEvidence(name,e.target.value)}/></div>})}
    <button type="button" className="wla-outline wla-full" onClick={()=>setPart(2)}>Next: explain your choices</button></fieldset>}
   {part===2&&<fieldset className="wla-fieldset"><legend>Your choices</legend><div className="wla-field"><label htmlFor="f-reason">Why did you make these choices?</label>{note('f-reason',`Explain your reasoning in your own words. At least ${LIMITS.minReasoning} characters.`)}<textarea id="f-reason" {...common('f-reason')} rows={4} maxLength={LIMITS.reasoning} value={answer.reasoning} onChange={e=>changeAnswer({...answer,reasoning:e.target.value})}/></div>
    {mission.practical?.link&&<div className="wla-field"><label htmlFor="f-link">{mission.practical.link.label} · optional</label>{note('f-link',mission.practical.link.hint)}<input id="f-link" aria-invalid={!!problem('f-link')} aria-describedby="f-link-help" inputMode="url" placeholder="https://" value={answer.link} maxLength={LIMITS.link} onChange={e=>changeAnswer({...answer,link:e.target.value})}/></div>}</fieldset>}
   <details className="wla-disclosure"><summary>Free learning help</summary><div className="wla-help"><button type="button" aria-pressed={help==='simple'} onClick={()=>setHelp(help==='simple'?'':'simple')}>Explain simply</button><button type="button" aria-pressed={help==='example'} onClick={()=>setHelp(help==='example'?'':'example')}>Worked example · free</button></div>
    {help==='simple'&&<div className="wla-help-text"><p className="wla-read">Make one small version, try it yourself, and show what you learned:</p>{instructions}</div>}
    {help==='example'&&<div className="wla-help-text"><p className="wla-kicker">Illustration{guide.englishExample?' · English':''}</p><p className="wla-read">{guide.example[0]}</p><p className="wla-read"><strong>Try it in your own work:</strong> {guide.example[1]}</p><small className="wla-muted">This is a teaching example, not an executed test or a completed submission. No points or AI reviews are used.</small></div>}
   </details>
   <p className="wla-muted">Evidence and reasoning: {answerBody(answer,evidence).length}/{LIMITS.reasoning} characters. Use concise extracts and actual observations.</p>
   <p className={draftSaved?'wla-muted':'wla-error'} role="status">{draftSaved?'Draft saved on this device. Accepted work is saved to your account.':'This device could not save the draft. Keep the page open and copy your work.'}</p>
   {missing.length>0?<button type="button" className="wla-primary wla-full" onClick={nextMissing}>Go to next incomplete part · {missing.length} left</button>:<button type="button" className="wla-primary wla-full" onClick={()=>go('self')}>Next: check your work</button>}
  </>}
  {step==='self'&&<>
   <p className="wla-muted">Check your work honestly. The AI will review it too.</p><div className="wla-options">{mission.checks.slice(0,5).map((c,i)=><button key={i} type="button" className={'wla-option'+(checks[i]?' on':'')} aria-pressed={checks[i]} onClick={()=>setChecks(checks.map((x,n)=>n===i?!x:x))}><span>{c}</span>{checks[i]&&<Check size={18}/>}</button>)}</div>
   {err&&<p className="wla-error" role="alert">{err}</p>}
   <button type="button" className="wla-primary wla-full" disabled={busy==='review'} onClick={getReview}>{busy==='review'?'Reading your work…':`Get AI review${left!==undefined?` · ${left} left today`:''}`}</button><button type="button" className="wla-ghost wla-full" disabled={busy==='review'} onClick={()=>go('make')}>Edit my work</button>
   <p className="wla-muted">AI reviews are separate from points. Only an accepted save completes a task.</p>
  </>}
  {step==='review'&&review&&<><FeedbackCard review={review}/><p className="wla-muted">AI feedback can be wrong. Saving checks the official requirements.</p>{err&&<p className="wla-error" role="alert">{err}</p>}<button type="button" className="wla-primary wla-full" disabled={busy==='save'} onClick={save}>{busy==='save'?'Checking and saving…':'Save my task'}</button><button type="button" className="wla-ghost wla-full" disabled={busy==='save'} onClick={()=>go('make')}>Improve it first</button></>}
 </div>;
}
