'use client';
import {useEffect,useMemo,useState} from 'react';
import {Check,ArrowLeft,Lock,Clock} from 'lucide-react';
import type {Mission} from '@/lib/missions';
import {composeAnswer,emptyAnswer,LIMITS,REASONING_LABEL,type Answer} from '@/lib/practical';
import {checkpointFor} from '@/lib/checkpoints';
import {wrongAnswerMessage} from '@/lib/submission';
import {api,readLocal,writeLocal} from './api';

type Review={summary:string;strengths:string[];checks:{item:string;met:boolean;note:string}[];nextStep:string;example?:string;answerAssessment?:{correct:boolean;reason:string}};
export type Saved={points?:number;balance?:number;message:string;status:string};

/** The full mission: Learn → understanding check → Make → self-check → AI review → save. Every step uses the website's own rules and endpoints. */
export function MissionFlow({mission,position,language,onSaved,onUpgrade,onBack,onPoints}:{mission:Mission;position:number;language:string;onSaved:(s:Saved)=>void;onUpgrade:()=>void;onBack:()=>void;onPoints?:()=>void}){
 const draftKey='wla-draft:'+mission.id;
 const [step,setStep]=useState<'learn'|'check'|'make'|'self'|'review'>('learn');
 const [missed,setMissed]=useState<number[]>([]);
 const [answer,setAnswer]=useState<Answer>(()=>{try{const d=JSON.parse(readLocal(draftKey)||'null');if(d&&d.fields)return d}catch{}return {...emptyAnswer(),fields:Object.fromEntries((mission.practical?.fields||[]).filter(f=>f.starter).map(f=>[f.id,f.starter||'']))}});
 const [checks,setChecks]=useState<boolean[]>([false,false,false,false,false]);
 const [review,setReview]=useState<Review|null>(null),[allow,setAllow]=useState<{limit?:number;used?:number}>({});
 const [busy,setBusy]=useState(''),[err,setErr]=useState(''),[leaving,setLeaving]=useState(false);
 const [help,setHelp]=useState<''|'simple'|'example'|'hint'>(''),[paid,setPaid]=useState<string[]>([]),[helpMsg,setHelpMsg]=useState('');
 /** Same rules as the website: explaining is free; an example or a hint is a clue that costs 5 points, charged once per mission. */
 async function openHelp(kind:'simple'|'example'|'hint'){
  setHelpMsg('');if(kind==='simple'||paid.includes(kind)){setHelp(help===kind?'':kind);return}
  setBusy('clue');const r=await api<{allowed?:boolean;message?:string;charged?:number}>('/api/clues',{method:'POST',body:{missionId:mission.id,clue:kind}});setBusy('');
  if(r.ok&&r.data.allowed!==false){setPaid(paid.concat(kind));setHelp(kind);onPoints?.();if(r.data.charged)setHelpMsg(`−${r.data.charged} points`)}else setHelpMsg(r.data.message||r.data.error||'That clue is not available right now.');
 }
 useEffect(()=>{writeLocal(draftKey,JSON.stringify(answer))},[answer,draftKey]);
 useEffect(()=>{api<{limit?:number;used?:number}>('/api/feedback').then(r=>{if(r.ok)setAllow(r.data)})},[]);
 const body=useMemo(()=>composeAnswer(mission.practical,answer),[mission.practical,answer]);
 const fields=mission.practical?.fields||[];
 const missing=fields.filter(f=>!(answer.fields[f.id]||'').trim()).length+(answer.reasoning.trim().length<LIMITS.minReasoning?1:0);
 const left=allow.limit!==undefined?Math.max(0,allow.limit-(allow.used||0)):undefined;
 const steps=['learn','check','make','self','review'];const at=steps.indexOf(step);
 async function getReview(){
  setErr('');if(left===0){onUpgrade();return}
  setBusy('review');const ask=()=>api<{review:Review;limit?:number;used?:number}>('/api/feedback',{method:'POST',body:{action:'review',quiz:mission.answer,missionId:mission.id,body,language}});
  // An incomplete AI reply uses no allowance; retry once so a learner rarely sees it.
  let r=await ask();if(!r.ok&&r.status>=500)r=await ask();setBusy('');
  if(r.status===403){onUpgrade();return}
  if(!r.ok){setErr(r.data.error||'AI review could not finish. Your work is safe; please try again.');return}
  setReview(r.data.review);setAllow({limit:r.data.limit,used:r.data.used});setStep('review');
 }
 async function save(){
  setErr('');setBusy('save');
  const r=await api<{award?:{status:string;message:string;score?:{points:number};balance?:number}}>('/api/work',{method:'POST',body:{missionId:mission.id,body,checks,quiz:mission.answer}});
  setBusy('');
  if(r.status===403&&/plan|Explore/i.test(r.data.error||'')){onUpgrade();return}
  if(!r.ok){setErr(r.data.award?.message||r.data.error||'We could not save your work. Keep this draft and try again.');return}
  writeLocal(draftKey,'');
  onSaved({points:r.data.award?.score?.points,balance:r.data.award?.balance,message:r.data.award?.message||'',status:r.data.award?.status||'awarded'});
 }
 return <div className="wla-stack">
  <button type="button" className="wla-back" onClick={()=>step==='learn'||step==='check'?onBack():setLeaving(true)}><ArrowLeft size={18}/>All tasks</button>
  {leaving&&<div className="wla-card wla-confirm" role="alertdialog" aria-labelledby="wla-leave-t"><strong id="wla-leave-t">Leave this task?</strong><p className="wla-muted">Your draft is saved on this phone. You can finish it later.</p><div className="wla-row-btns"><button type="button" className="wla-ghost" onClick={()=>setLeaving(false)}>Stay</button><button type="button" className="wla-outline" onClick={onBack}>Leave</button></div></div>}
  <div className="wla-steps" aria-label={`Step ${at+1} of 5`}>{steps.map((s,i)=><span key={s} className={i<=at?'on':''}/>)}</div>
  <p className="wla-kicker">TASK {String(position).padStart(2,'0')} / 10 · {['LEARN','CHECK','MAKE','SELF-CHECK','REVIEW'][at]}</p>
  <h2 className="wla-h2">{mission.title}</h2>
  <p className="wla-meta"><Clock size={15}/>About {mission.minutes} min · up to 100 points</p>

  {step==='learn'&&<>
   <div className="wla-card wla-tint"><p>{mission.brief}</p></div>
   <div className="wla-card"><p className="wla-kicker">THE IDEA</p><p className="wla-read">{mission.lesson}</p></div>
   <button type="button" className="wla-primary wla-full wla-sticky" onClick={()=>setStep('check')}>Check my understanding</button>
  </>}

  {step==='check'&&<>
   <h3 className="wla-q">{mission.question}</h3>
   <div className="wla-options">{mission.options.map((o,i)=>{const off=missed.includes(i);return <button key={i} type="button" disabled={off} className={'wla-option'+(off?' off':'')} onClick={()=>i===mission.answer?setStep('make'):setMissed(missed.concat(i))}><span>{o}</span></button>})}</div>
   {missed.length>0&&<p className="wla-muted" role="status">{wrongAnswerMessage(mission)}</p>}
  </>}

  {step==='make'&&<>
   <p className="wla-ok" role="status">Correct. Now make it.</p>
   <div className="wla-card wla-tint"><p className="wla-read">{mission.levelTask||mission.task}</p></div>
   {fields.map(f=><div key={f.id} className="wla-field">
    <label htmlFor={'f-'+f.id}>{f.prompt||f.label}</label>{f.hint&&<small>{f.hint}</small>}
    {f.type==='choice'?<select id={'f-'+f.id} value={answer.fields[f.id]||''} onChange={e=>setAnswer({...answer,fields:{...answer.fields,[f.id]:e.target.value}})}><option value="">Choose one…</option>{(f.options||[]).map(o=><option key={o} value={o}>{o}</option>)}</select>
     :f.type==='short'?<input id={'f-'+f.id} value={answer.fields[f.id]||''} maxLength={LIMITS.short} onChange={e=>setAnswer({...answer,fields:{...answer.fields,[f.id]:e.target.value}})}/>
     :<textarea id={'f-'+f.id} className={f.type==='code'?'wla-code':''} rows={f.type==='code'?8:5} value={answer.fields[f.id]||''} maxLength={f.type==='code'?LIMITS.code:LIMITS.long} onChange={e=>setAnswer({...answer,fields:{...answer.fields,[f.id]:e.target.value}})}/>}
   </div>)}
   <div className="wla-field"><label htmlFor="f-reason">{REASONING_LABEL}: what did you make, try and improve?</label><small>Share real results and the change you made. At least {LIMITS.minReasoning} characters.</small>
    <textarea id="f-reason" rows={5} value={answer.reasoning} maxLength={LIMITS.reasoning} onChange={e=>setAnswer({...answer,reasoning:e.target.value})}/></div>
   {mission.practical?.link&&<div className="wla-field"><label htmlFor="f-link">{mission.practical.link.label}</label><small>{mission.practical.link.hint}</small><input id="f-link" inputMode="url" placeholder="https://" value={answer.link} maxLength={LIMITS.link} onChange={e=>setAnswer({...answer,link:e.target.value})}/></div>}
   <div className="wla-card"><p className="wla-kicker">NEED HELP?</p><div className="wla-help">
    <button type="button" aria-pressed={help==='simple'} onClick={()=>openHelp('simple')}>Explain simply</button>
    <button type="button" aria-pressed={help==='example'} disabled={busy==='clue'} onClick={()=>openHelp('example')}>Show an example{paid.includes('example')?'':' · −5'}</button>
    <button type="button" aria-pressed={help==='hint'} disabled={busy==='clue'} onClick={()=>openHelp('hint')}>Give me a hint{paid.includes('hint')?'':' · −5'}</button>
   </div>{helpMsg&&<p className="wla-muted" role="status">{helpMsg}</p>}
   {help&&<p className="wla-read wla-help-text" role="status">{help==='simple'?mission.lesson:help==='example'?mission.example:mission.checks.find((_,i)=>!checks[i])||mission.checks[0]}</p>}</div>
   <p className="wla-muted">Your draft is saved on this phone as you type.</p>
   <button type="button" className="wla-primary wla-full wla-sticky" disabled={missing>0} onClick={()=>setStep('self')}>{missing>0?`Fill ${missing} more part${missing>1?'s':''}`:'Next: check your work'}</button>
  </>}

  {step==='self'&&<>
   <p className="wla-muted">Tick what your work does. Be honest: the AI review checks it too.</p>
   <div className="wla-options">{mission.checks.slice(0,5).map((c,i)=><button key={i} type="button" className={'wla-option'+(checks[i]?' on':'')} aria-pressed={checks[i]} onClick={()=>setChecks(checks.map((x,n)=>n===i?!x:x))}><span>{c}</span>{checks[i]&&<Check size={18}/>}</button>)}</div>
   {err&&<p className="wla-error" role="alert">{err}</p>}
   <button type="button" className="wla-primary wla-full wla-sticky" disabled={busy==='review'} onClick={getReview}>{busy==='review'?'Reading your work…':`Get AI review${left!==undefined?` · ${left} left today`:''}`}</button>
   <button type="button" className="wla-ghost wla-full" onClick={()=>setStep('make')}>Edit my work</button>
  </>}

  {step==='review'&&review&&<>
   <div className="wla-card wla-review">
    <p className="wla-kicker">AI REVIEW</p>
    <p className="wla-read">{review.summary}</p>
    {review.strengths?.length>0&&<><strong>What worked</strong><ul>{review.strengths.map((s,i)=><li key={i}>{s}</li>)}</ul></>}
    {review.checks?.length>0&&<ul className="wla-checks">{review.checks.map((c,i)=><li key={i} className={c.met?'met':''}><strong>{c.met?'✓ ':'• '}{c.item}</strong><span>{c.note}</span></li>)}</ul>}
    {review.nextStep&&<p className="wla-read"><strong>Next step:</strong> {review.nextStep}</p>}
    <small className="wla-muted">AI feedback can be wrong. Saving runs the official review.</small>
   </div>
   {err&&<p className="wla-error" role="alert">{err}</p>}
   <button type="button" className="wla-primary wla-full wla-sticky" disabled={busy==='save'} onClick={save}>{busy==='save'?'Reviewing & saving…':'Save my task'}</button>
   <button type="button" className="wla-ghost wla-full" onClick={()=>setStep('make')}>Improve it first</button>
  </>}
 </div>;
}

/** A mini challenge between missions (the website's checkpoints). Clearing it unlocks the next mission. */
export function CheckpointFlow({track,after,onCleared,onBack}:{track:string;after:number;onCleared:()=>void;onBack:()=>void}){
 const cp=checkpointFor(track,after);const [picks,setPicks]=useState<number[]>([-1,-1]);const [busy,setBusy]=useState(false),[msg,setMsg]=useState(''),[passed,setPassed]=useState(false);
 if(!cp)return null;
 async function submit(){setBusy(true);setMsg('');const r=await api<{passed?:boolean;message?:string}>('/api/checkpoint',{method:'POST',body:{track,after,answers:picks}});setBusy(false);
  if(!r.ok){setMsg(r.data.error||'Could not check your answers.');return}setMsg(r.data.message||'');if(r.data.passed)setPassed(true)}
 return <div className="wla-stack">
  <button type="button" className="wla-back" onClick={onBack}><ArrowLeft size={18}/>All tasks</button>
  <p className="wla-kicker">MINI CHALLENGE · NO POINTS NEEDED</p>
  <h2 className="wla-h2">{cp.title}</h2>
  <div className="wla-card wla-tint"><p className="wla-read">{cp.scenario}</p></div>
  {cp.parts.map((part,n)=><div key={n} className="wla-stack"><h3 className="wla-q">{n+1}. {part.q}</h3>
   <div className="wla-options">{part.options.map((o,i)=><button key={i} type="button" className={'wla-option'+(picks[n]===i?' on':'')} aria-pressed={picks[n]===i} onClick={()=>setPicks(picks.map((x,k)=>k===n?i:x))}><span>{o}</span>{picks[n]===i&&<Check size={18}/>}</button>)}</div></div>)}
  {msg&&<p className={passed?'wla-ok':'wla-muted'} role="status">{msg}</p>}
  {passed?<button type="button" className="wla-primary wla-full" onClick={onCleared}>Continue to the next task</button>
   :<button type="button" className="wla-primary wla-full" disabled={busy||picks.includes(-1)} onClick={submit}>{busy?'Checking…':'Check my answers'}</button>}
 </div>;
}

export function LockedNote({text}:{text:string}){return <p className="wla-note"><Lock size={16}/>{text}</p>}
