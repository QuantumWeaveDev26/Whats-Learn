'use client';
import {useState} from 'react';
import {Check,ArrowLeft,Lock} from 'lucide-react';
import {checkpointFor} from '@/lib/checkpoints';
import {api} from './api';
export {MissionFlow,type Saved} from './mission-flow';

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
