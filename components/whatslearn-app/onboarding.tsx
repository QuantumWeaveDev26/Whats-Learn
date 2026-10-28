'use client';
import {useState} from 'react';
import {ArrowLeft,Check} from 'lucide-react';
import {contextQuestions} from '@/lib/learner-context';
import {learningStyles,styleDescriptions} from '@/lib/learning-styles';
import {programmes} from '@/lib/programmes';
import {goals} from '@/lib/personalization';
import {api,type Profile} from './api';

type Answers=Record<string,string|string[]>;
/** Part 1: the website's personal setup questions (saved to /api/learner-context). Every question can be skipped, as on the website. */
export function PersonalSetup({onDone}:{onDone:()=>void}){
 const [i,setI]=useState(0),[answers,setAnswers]=useState<Answers>({}),[busy,setBusy]=useState(false),[err,setErr]=useState('');
 const q=contextQuestions[i];const opts=Object.entries(q.options as Record<string,string>);
 const multi='multi' in q&&q.multi,text=('shortText' in q&&q.shortText)||('text' in q&&q.text);
 const value=answers[q.key];
 function pick(v:string){if(multi){const cur=Array.isArray(value)?value:[];setAnswers({...answers,[q.key]:cur.includes(v)?cur.filter(x=>x!==v):cur.length<3?cur.concat(v):cur})}else setAnswers({...answers,[q.key]:v})}
 async function finish(){
  setBusy(true);setErr('');
  const clean=Object.fromEntries(Object.entries(answers).filter(([,v])=>Array.isArray(v)?v.length:String(v).trim()));
  const r=await api('/api/learner-context',{method:'POST',body:{answers:clean,skipped:!Object.keys(clean).length}});
  setBusy(false);if(r.ok&&clean.ageBand==='under-18'){window.location.assign('/age-policy');return}if(r.ok)onDone();else setErr(r.data.error||'Could not save. Please try again.');
 }
 const last=i===contextQuestions.length-1;
 return <div className="wla-page">
  <div className="wla-progress"><span style={{width:`${(i+1)*100/contextQuestions.length}%`}}/></div>
  <p className="wla-kicker">ABOUT YOU · {i+1} OF {contextQuestions.length}</p>
  <h1 className="wla-h1">{q.title}</h1>
  <p className="wla-muted">{q.hint}</p>
  {text?<input className="wla-input" value={typeof value==='string'?value:''} onChange={e=>setAnswers({...answers,[q.key]:e.target.value})} maxLength={q.key==='project'?160:60} aria-label={q.title}/>
   :<div className="wla-options">{opts.map(([v,label])=>{const on=multi?Array.isArray(value)&&value.includes(v):value===v;return <button key={v} type="button" className={'wla-option'+(on?' on':'')} aria-pressed={on} onClick={()=>pick(v)}><span>{label}</span>{on&&<Check size={18}/>}</button>})}</div>}
  {err&&<p className="wla-error" role="alert">{err}</p>}
  <div className="wla-actions">
   <button type="button" className="wla-ghost" disabled={!i||busy} onClick={()=>setI(i-1)}><ArrowLeft size={18}/>Back</button>
   <button type="button" className="wla-link" disabled={busy} onClick={()=>last?finish():setI(i+1)}>Skip</button>
   <button type="button" className="wla-primary" disabled={busy} onClick={()=>last?finish():setI(i+1)}>{busy?'Saving…':last?'Finish':'Next'}</button>
  </div>
 </div>;
}

const pathQuestions=[
 {key:'style',title:'Choose how you prefer to learn',sub:'All styles teach the same skills. Change this later.',options:Object.entries(learningStyles).map(([value,label])=>({value,label,detail:styleDescriptions[value as keyof typeof styleDescriptions]}))},
 {key:'track',title:'What would you love to be able to do?',sub:'Choose one direction. You can explore the others later.',options:programmes.map(p=>({value:p.id,label:p.name,detail:p.outcome}))},
 {key:'level',title:'Where are you starting?',sub:'No right answer. Just your starting point.',options:[{value:'beginner',label:'I’m completely new',detail:'Guided questions. Step-by-step trials.'},{value:'practising',label:'I know a little',detail:'Real scenarios. Compare your results.'},{value:'experienced',label:'I have some experience',detail:'Harder decisions. Test the edge cases.'}]},
 {key:'goal',title:'What would this skill make possible?',sub:'Your reason gives the practice a purpose.',options:Object.entries(goals).map(([value,label])=>({value,label,detail:''}))},
 {key:'minutes',title:'How much space is there in your day?',sub:'Small starts count. Longer projects can be split across days.',options:[{value:'5',label:'5 minutes',detail:'One small step.'},{value:'15',label:'15 minutes',detail:'A little room to practise.'},{value:'30',label:'30 minutes',detail:'Time to get into it.'},{value:'flexible',label:'Let’s keep it flexible',detail:'I’ll find my rhythm.'}]}
] as const;
/** Part 2: the website's "Find my path" questions (saved to /api/profile). Language comes from the app's language step. */
export function PathSetup({initial,language,onDone,onCancel}:{initial:Profile|null;language:string;onDone:()=>void;onCancel?:()=>void}){
 const [i,setI]=useState(0),[busy,setBusy]=useState(false),[err,setErr]=useState('');
 const [p,setP]=useState<Profile>({goal:'job',track:'marketing',level:'beginner',minutes:'15',style:'casual',...(initial||{}),language});
 const q=pathQuestions[i];const last=i===pathQuestions.length-1;const val=(p as Record<string,string|undefined>)[q.key];
 async function finish(){setBusy(true);setErr('');const r=await api('/api/profile',{method:'POST',body:p});setBusy(false);if(r.ok)onDone();else setErr(r.data.error||'Could not save your choices. Please try again.')}
 return <div className="wla-page">
  {onCancel&&!i&&<button type="button" className="wla-back" onClick={onCancel}><ArrowLeft size={18}/>Back</button>}
  <div className="wla-progress"><span style={{width:`${(i+1)*100/pathQuestions.length}%`}}/></div>
  <p className="wla-kicker">FIND MY PATH · {i+1} OF {pathQuestions.length}</p>
  <h1 className="wla-h1">{q.title}</h1>
  <p className="wla-muted">{q.sub}</p>
  <div className="wla-options">{q.options.map(o=><button key={o.value} type="button" className={'wla-option'+(val===o.value?' on':'')} aria-pressed={val===o.value} onClick={()=>setP({...p,[q.key]:o.value})}><span><strong>{o.label}</strong>{o.detail&&<small>{o.detail}</small>}</span>{val===o.value&&<Check size={18}/>}</button>)}</div>
  {err&&<p className="wla-error" role="alert">{err}</p>}
  <div className="wla-actions">
   <button type="button" className="wla-ghost" disabled={!i||busy} onClick={()=>setI(i-1)}><ArrowLeft size={18}/>Back</button>
   <button type="button" className="wla-primary" disabled={busy} onClick={()=>last?finish():setI(i+1)}>{busy?'Saving…':last?'Show my path':'Continue'}</button>
  </div>
 </div>;
}
