'use client';
import {useState} from 'react';
import {agencyTracks,saveAgencyDraft,type AgencyTrack} from '@/lib/agency-story';
import {checkStarter} from '@/lib/starter-check';
import {starterExamples} from '@/lib/starter-examples';
import StarterWorkbench from './starter-workbench';
import {shortFeedback} from '@/lib/review-summary';
export default function GuestStarterPreview({track,body,language,onRestore,onEdit,onFinished}:{track:string;body:string;language:string;onRestore:(body:string)=>void;onEdit:()=>void;onFinished?:()=>void}){
 const [shown,setShown]=useState(''),[error,setError]=useState(''),[kept,setKept]=useState(false),[busy,setBusy]=useState(false),[ai,setAi]=useState<{version:string;quote:string;worked:string;improve:string;next:string;example?:string}|null>(null),[aiNote,setAiNote]=useState('');
 const lane=agencyTracks.find(t=>t.id===track),sample=starterExamples[track],version=track+'|'+language+'|'+body;
 if(!lane||!sample)return null;
 async function finish(){if(busy)return;const check=checkStarter(track as AgencyTrack,body);if(!check.ok){setError(check.message);return}let saved=false;try{saveAgencyDraft(track as AgencyTrack,{body,choice:0,language,updatedAt:new Date().toISOString()},'guest');saved=true}catch{}setKept(saved);setError('');setBusy(true);setAiNote('');try{const r=await fetch('/api/starter-feedback/guest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({track,body,language})});const d=await r.json() as {error?:string;feedback?:{quote:string;worked:string;improve:string;next:string;example?:string}};if(r.ok&&d.feedback)setAi({version,...d.feedback});else{setAi(null);setAiNote(d.error||'')}}catch{setAi(null)}finally{setBusy(false)}setShown(version);onFinished?.()}
 return <section className="starter-ai-feedback" aria-label="Guest starter practice">
  <StarterWorkbench key={track} track={track} onApply={text=>{onEdit();onRestore(text)}}/>
  <p className="small">No account needed for this starter. Finish your attempt for one free AI review of your answer.</p>
  <button type="button" className="outline" onClick={finish} disabled={busy||body.trim().length<10}>{busy?'Reading your answer…':shown===version?'Show feedback again':'Finish starter · get AI feedback'}</button>
  {error&&<p role="alert">{error}</p>}
  {shown===version&&ai?.version===version&&<div className="starter-sample" role="status" dir="auto">
   <span className="demo-label">AI FEEDBACK ON YOUR ANSWER</span>
   <p><small>Your words: “{ai.quote}”</small></p><p><strong>What worked:</strong> {shortFeedback(ai.worked)}</p><p><strong>Improve:</strong> {shortFeedback(ai.improve)}</p><p><strong>Next action:</strong> {shortFeedback(ai.next)}</p>{ai.example&&<p><strong>Illustrative revision:</strong> {ai.example}</p>}
   <small>{kept?'Your draft is kept on this device.':'Copy your draft before leaving.'} AI feedback can be wrong. Free starter practice only: no mission points.</small>
   <div className="starter-next-actions"><a className="primary" href={'/find-my-path?track='+track+'&language='+encodeURIComponent(language)}>Choose my course</a><a className="text-button" href={'/signin?return_to='+encodeURIComponent('/?starter='+track+'#start')}>Sign in to save and get more reviews →</a></div>
  </div>}
  {shown===version&&ai?.version!==version&&<div className="starter-sample" lang="en" role="status">
   <span className="demo-label">{language==='en'?'SAMPLE FEEDBACK':'SAMPLE FEEDBACK · ENGLISH EXAMPLE'}</span>
   {aiNote&&<p className="small">{aiNote}</p>}
   <h3>Learn from one small change.</h3>
   <p>{kept?'Your draft is kept on this device.':'Your browser could not keep this draft. Copy it before leaving.'} It has not been AI reviewed and earns no mission points.</p>
   <details open><summary>See how one small revision helps</summary><p><strong>Sample draft:</strong> {sample.before}</p><p><strong>What worked in the revised sample:</strong> {sample.worked}</p><p><strong>One improvement:</strong> {sample.improve}</p><p><strong>Revised example:</strong> {sample.after}</p><p><strong>Try next:</strong> {sample.next}</p></details>
   <small>This is feedback on an authored example, not an assessment of your answer.</small>
   <div className="starter-next-actions"><a className="primary" href={'/find-my-path?track='+track+'&language='+encodeURIComponent(language)}>Choose my course</a><a className="text-button" href={'/signin?return_to='+encodeURIComponent('/?starter='+track+'#start')}>Get AI feedback and sync my draft →</a></div>
  </div>}
 </section>;
}
