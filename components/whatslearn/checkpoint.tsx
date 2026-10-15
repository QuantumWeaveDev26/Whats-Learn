'use client';
import {useState} from 'react';
import {Award,Check,LockKeyhole} from 'lucide-react';
import {checkpointKey,isFinale,trackCheckpoints,type Checkpoint} from '@/lib/checkpoints';
import {missions} from '@/lib/missions';
export type CheckpointAttempt={ok:boolean;passed:boolean;message:string;results:{correct:boolean;message:string}[]};
const letters=['A','B','C'];
/** The row of mini challenges for one course. Each is ready once its mission is done, and cleared once passed. */
export function CheckpointRow({track,done,cleared,onOpen}:{track:string;done:ReadonlySet<string>;cleared:ReadonlySet<string>;onOpen:(c:Checkpoint)=>void}){
 const list=missions.filter(m=>m.track===track);
 return <section className="checkpoint-row" aria-label="Mini challenges"><h3>Mini challenges</h3><p className="small muted">Clear one after every two missions to open the next pair. They are not missions and add no points. Each earns a badge.</p>
  <div className="checkpoint-list">{trackCheckpoints(track).map(c=>{const m=list[c.after-1];const isDone=cleared.has(checkpointKey(c.track,c.after));const ready=!!m&&done.has(m.id);
   return <button key={c.after} className={`checkpoint-stop${isDone?' cleared':''}`} disabled={!ready&&!isDone} onClick={()=>onOpen(c)} aria-label={`${isFinale(c)?'Course finale':`Mini challenge after mission ${c.after}`}: ${isDone?'cleared':ready?'ready':'locked until mission '+c.after+' is done'}`}>
    <span className="checkpoint-icon" aria-hidden="true">{isDone?<Award size={18}/>:ready?<Check size={18}/>:<LockKeyhole size={16}/>}</span>
    <strong>{isFinale(c)?'Course finale':`After mission ${c.after}`}</strong>
    <small>{isDone?'Badge earned':ready?'Ready. Start it.':`Finish mission ${c.after} first`}</small></button>})}</div></section>;
}
/** The dialog content for one mini challenge. Picks are kept between tries. */
export default function CheckpointBody({cp,cleared,guest,onAttempt,onNext}:{cp:Checkpoint;cleared:boolean;guest:boolean;onAttempt:(answers:number[])=>Promise<CheckpointAttempt>;onNext?:()=>void}){
 const [picks,setPicks]=useState<number[]>([-1,-1]),[busy,setBusy]=useState(false),[outcome,setOutcome]=useState<CheckpointAttempt|null>(null),[error,setError]=useState('');
 const finale=isFinale(cp);const passed=cleared||!!outcome?.passed;
 async function check(){if(picks.some(p=>p<0))return;setBusy(true);setError('');try{setOutcome(await onAttempt(picks))}catch(e){setError((e as Error).message||'We could not check your answers. Please retry.')}finally{setBusy(false)}}
 return <div className="checkpoint-body">
  <span className="play-label">{finale?'COURSE FINALE':'MINI CHALLENGE'} · NOT A MISSION</span>
  <p className="small muted">No points and no daily mission used. Clearing it earns a badge once, and opens the next pair of missions.{guest?' As a guest, your badge is kept on this device only.':''}</p>
  <p className="checkpoint-scenario">{cp.scenario}</p>
  {cp.parts.map((p,i)=><fieldset key={i} className="checkpoint-part"><legend>{i+1}. {p.q}</legend>
   <div className="checkpoint-options">{p.options.map((o,j)=><button type="button" key={o} aria-pressed={picks[i]===j} disabled={passed} onClick={()=>{setPicks(old=>old.map((x,k)=>k===i?j:x));setOutcome(o=>o&&!o.passed?null:o)}}><span aria-hidden="true">{letters[j]}</span>{o}</button>)}</div>
   {outcome&&outcome.results[i]&&<p role="status" className={outcome.results[i].correct?'quiz-correct':'quiz-incorrect'}>{outcome.results[i].message}</p>}</fieldset>)}
  {error&&<p role="alert" className="quiz-incorrect">{error}</p>}
  {passed?<div className="checkpoint-done" role="status"><Award size={20}/><span>{outcome?.passed?outcome.message:'You cleared this mini challenge. Your badge is kept.'}</span></div>
   :<><button className="primary" disabled={busy||picks.some(p=>p<0)} onClick={check}>{busy?'Checking…':'Check my answers'} <Check size={16}/></button>{outcome&&!outcome.passed&&<p className="small muted" role="status">{outcome.message}</p>}</>}
  {passed&&onNext&&<button className="primary" onClick={onNext}>{finale?'Back to my journey':'Open the next mission'}</button>}
 </div>;
}
