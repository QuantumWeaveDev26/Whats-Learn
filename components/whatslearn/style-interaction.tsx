'use client';
import {useState,useRef,useEffect} from 'react';
import type {Mission} from '@/lib/missions';
import {currentStyleState,initialStyleState,interactionPrompt,styleTurn,checkedStyleTurn} from '@/lib/style-interactions';
import {miniChallenge} from '@/lib/play';
export default function StyleInteraction({mission,style='casual',language='en',choice=-1,onAnswer,onContinue}:{mission:Mission;style?:string;language?:string;choice?:number;onAnswer?:(n:number)=>void;onContinue?:()=>void}){
 const [state,setState]=useState(()=>initialStyleState(style)),[answer,setAnswer]=useState(''),[feedback,setFeedback]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const alive=useRef(true);useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[]);
 const s=currentStyleState(style,state),done=s.stage==='ready'||choice===mission.answer;
 async function respond(text:string){if(busy)return;setError('');const turn=styleTurn(mission,s,text,language);
 if(turn.needsCheck){setBusy(true);try{const r=await fetch('/api/style-interaction',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({missionId:mission.id,answer:text})});const result=await r.json() as {error?:string;accepted:boolean;feedback:string;followUp:string};if(!r.ok)throw new Error(result.error||'Check unavailable. Retry.');if(!alive.current)return;const checked=checkedStyleTurn(s,result);setState(checked.state);setFeedback(checked.reply);if(checked.completed)onAnswer?.(mission.answer);}catch(e){if(!alive.current)return;setError(e instanceof Error?e.message:'Check unavailable. Your answer is kept.');}finally{if(alive.current)setBusy(false)}return;}
 setState(turn.state);setFeedback(turn.reply);if(turn.completed)onAnswer?.(mission.answer);else onAnswer?.(-1);
 }
 const free=s.stage==='explain',options=s.style==='facts'&&s.stage==='rule'?['TRUE','FALSE']:s.style==='game'&&s.stage==='checkpoint'?[...miniChallenge(mission.id).options]:mission.options;
 return <div className={'style-decision style-interaction-'+s.style} data-stage={s.stage}>
 <span className="style-eyebrow">{s.style==='game'?'TWO CHECKPOINTS · NO POINTS YET':s.style==='story'?'CHOOSE → SEE THE CONSEQUENCE → EXPLAIN':s.style==='facts'?'VERIFY A RULE → APPLY IT':'YOUR WORDS → FEEDBACK → NEXT STEP'}</span>
 {!done&&<><h4 className="style-interaction-prompt">{interactionPrompt(mission,s).split('\n').filter(line=>!(/^[A-F]\)/.test(line))).join('\n')}</h4>
 {free?<form onSubmit={e=>{e.preventDefault();void respond(answer)}}><label htmlFor={'style-answer-'+mission.id}>{s.style==='story'?'Explain your ending':'Your take'}</label><textarea id={'style-answer-'+mission.id} rows={3} disabled={busy} maxLength={1200} value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="One sentence. Kannada or Kanglish works too."/><button type="submit" className="primary" disabled={busy||answer.trim().length<15}>{busy?'Checking your idea…':'Send my take'}</button><small>Live AI concept check · uses a chat practice check, not a whole-mission review. Nothing is completed or scored here.</small></form>:<div className="style-decision-options" role="group" aria-label="Your decision">{options.map((option,i)=><button type="button" key={s.stage+option} onClick={()=>void respond(s.style==='facts'&&s.stage==='rule'?option:String.fromCharCode(65+i))}><span>{s.style==='facts'&&s.stage==='rule'?'':String.fromCharCode(65+i)}</span><span>{option}</span></button>)}</div>}
 </>}
 {feedback&&<p className="style-decision-result" role="status">{feedback}</p>}{error&&<p role="alert">{error}</p>}
 {done&&<div className="style-next-move"><h4>{s.style==='story'?'Your ending holds up.':s.style==='game'?'Ready to build.':s.style==='facts'?'Rule verified.':'Your idea checks out.'}</h4><p>{mission.task}</p><small>Understanding checked. Mission points are awarded when your completed work is saved.</small><button className="primary" onClick={onContinue}>{s.style==='game'?'Build my solution':s.style==='story'?'Make this ending real':s.style==='facts'?'Apply it in my work':'Let’s make it'}</button></div>}
 <details><summary>Need the lesson?</summary><p>{mission.lesson}</p></details>
 </div>;
}
