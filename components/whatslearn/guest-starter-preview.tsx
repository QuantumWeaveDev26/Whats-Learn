'use client';
import {useState} from 'react';
import {agencyTracks,saveAgencyDraft,type AgencyTrack} from '@/lib/agency-story';
import {checkStarter} from '@/lib/starter-check';
import {starterExamples} from '@/lib/starter-examples';
import StarterWorkbench from './starter-workbench';
export default function GuestStarterPreview({track,body,language,onRestore,onEdit,onFinished}:{track:string;body:string;language:string;onRestore:(body:string)=>void;onEdit:()=>void;onFinished?:()=>void}){
 const [shown,setShown]=useState(''),[error,setError]=useState(''),[kept,setKept]=useState(false);
 const lane=agencyTracks.find(t=>t.id===track),sample=starterExamples[track],version=track+'|'+language+'|'+body;
 if(!lane||!sample)return null;
 function finish(){const check=checkStarter(track as AgencyTrack,body);if(!check.ok){setError(check.message);return}let saved=false;try{saveAgencyDraft(track as AgencyTrack,{body,choice:0,language,updatedAt:new Date().toISOString()},'guest');saved=true}catch{}setKept(saved);setError('');setShown(version);onFinished?.()}
 return <section className="starter-ai-feedback" aria-label="Guest starter practice">
  <StarterWorkbench key={track} track={track} onApply={text=>{onEdit();onRestore(text)}}/>
  <p className="small">No account needed for this starter. Finish your attempt to see an example of useful feedback.</p>
  <button type="button" className="outline" onClick={finish} disabled={body.trim().length<10}>{shown===version?'Show sample feedback again':'Finish starter · see sample feedback'}</button>
  {error&&<p role="alert">{error}</p>}
  {shown===version&&<div className="starter-sample" lang="en" role="status">
   <span className="demo-label">{language==='en'?'SAMPLE FEEDBACK':'SAMPLE FEEDBACK · ENGLISH EXAMPLE'}</span>
   <h3>Learn from one small change.</h3>
   <p>{kept?'Your draft is kept on this device.':'Your browser could not keep this draft. Copy it before leaving.'} It has not been AI reviewed and earns no mission points.</p>
   <details open><summary>See how one small revision helps</summary><p><strong>Sample draft:</strong> {sample.before}</p><p><strong>What worked in the revised sample:</strong> {sample.worked}</p><p><strong>One improvement:</strong> {sample.improve}</p><p><strong>Revised example:</strong> {sample.after}</p><p><strong>Try next:</strong> {sample.next}</p></details>
   <small>This is feedback on an authored example, not an assessment of your answer.</small>
   <div className="starter-next-actions"><a className="primary" href={'/learn?mission='+lane.mission}>Keep learning as a guest</a><a className="text-button" href={'/signin?return_to='+encodeURIComponent('/?starter='+track+'#start')}>Get AI feedback and sync my draft →</a></div>
  </div>}
 </section>;
}
