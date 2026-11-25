'use client';
import {appTranslator} from './app-language';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,Check} from 'lucide-react';
import {contextQuestions,contextSchema,type LearnerContext} from '@/lib/learner-context';
import {learningStyles,styleDescriptions} from '@/lib/learning-styles';
import {programmes} from '@/lib/programmes';
import {goals} from '@/lib/personalization';
import {api,type Profile} from './api';

type Answers=Record<string,string|string[]>;
/** Part 1: the website's personal setup questions (saved to /api/learner-context). The mentor nickname is the only optional question. */
export function PersonalSetup({onDone,language='en',editing,onCancel}:{onDone:()=>void;language?:string;editing?:{initial:LearnerContext;accountKey:string};onCancel?:()=>void}){
 const t=appTranslator(language);
 const [showSummary,setShowSummary]=useState(!!editing);
 const heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{if(editing&&!showSummary)heading.current?.focus()},[showSummary,!!editing]);
 const [i,setI]=useState(0),[answers,setAnswers]=useState<Answers>(()=>({...editing?.initial})),[busy,setBusy]=useState(false),[err,setErr]=useState('');
 const q=contextQuestions[i];const opts=Object.entries(q.options as Record<string,string>);
 const multi='multi' in q&&q.multi,text=('shortText' in q&&q.shortText)||('text' in q&&q.text);
 const value=answers[q.key];
 const optional=q.key==='nickname';
 const answered=Array.isArray(value)?value.length>0:typeof value==='string'&&!!value.trim();
 const valid=answered&&contextSchema.safeParse({[q.key]:value}).success;
 function pick(v:string){if(multi){const cur=Array.isArray(value)?value:[];setAnswers({...answers,[q.key]:cur.includes(v)?cur.filter(x=>x!==v):cur.length<3?cur.concat(v):cur})}else setAnswers({...answers,[q.key]:v})}
 async function finish(values:Answers){
  setBusy(true);setErr('');
  const clean=Object.fromEntries(Object.entries(values).filter(([,v])=>Array.isArray(v)?v.length:v.trim()));
  const r=await api('/app/context',{method:editing?'PATCH':'POST',body:{answers:clean},timeoutMs:15000,accountKey:editing?.accountKey});
  setBusy(false);if(r.ok&&clean.ageBand==='under-18'){window.location.assign('/age-policy');return}if(r.ok)onDone();else setErr(r.data.error||'Could not save. Please try again.');
 }
 const last=i===contextQuestions.length-1;
 function next(){
  if(!valid||busy)return;
  if(q.key==='ageBand'&&value==='under-18'){void finish({ageBand:value});return}
  if(last)void finish(answers);
  else setI(i+1);
 }
 if(editing&&showSummary)return <section className="wla-stack">
  <button type="button" className="wla-back" onClick={onCancel}><ArrowLeft size={18}/>{t("Back")}</button>
  <dl className="wla-card wla-setup-summary">
   {contextQuestions.map(question=>{
    const stored=editing.initial[question.key];
    const choices=question.options as Record<string,string>;
    const values=Array.isArray(stored)?stored:stored?[stored]:[];
    const display=values.map(item=>Object.hasOwn(choices,item)?t(choices[item]):item).join(', ');
    return <div key={question.key}><dt>{t(question.title)}</dt><dd>{display||'—'}</dd></div>;
   })}
  </dl>
  <div className="wla-actions">
   <button type="button" className="wla-outline" onClick={()=>{setAnswers({...editing.initial});setErr('');setShowSummary(false)}}>{t("Edit")}</button>
   <button type="button" className="wla-outline" onClick={()=>{setAnswers({});setErr('');setShowSummary(false)}}>{t("Start over")}</button>
  </div>
 </section>;
 return <div className="wla-page">
  <div className="wla-progress"><span style={{width:`${(i+1)*100/contextQuestions.length}%`}}/></div>
  <p className="wla-kicker">{t("ABOUT YOU ·")}{' '}{i+1} {t("OF")}{' '}{contextQuestions.length}</p>
  <h1 ref={heading} tabIndex={-1} className="wla-h1">{t(q.title)}</h1>
  <p className="wla-muted">{t(q.hint)}</p>
  {text?<input key={q.key} className="wla-input" required={!optional} value={typeof value==='string'?value:''} onChange={e=>setAnswers({...answers,[q.key]:e.target.value})} maxLength={q.key==='project'?160:60} aria-label={t(q.title)}/>
   :<div className="wla-options">{opts.map(([v,label])=>{const on=multi?Array.isArray(value)&&value.includes(v):value===v;return <button key={v} type="button" className={'wla-option'+(on?' on':'')} aria-pressed={on} onClick={()=>pick(v)}><span>{t(label)}</span>{on&&<Check size={18}/>}</button>})}</div>}
  {err&&<p className="wla-error" role="alert">{t(err)}</p>}
  <div className="wla-actions">
   <button type="button" className="wla-ghost" disabled={(!i&&!editing)||busy} onClick={()=>i?setI(i-1):setShowSummary(true)}><ArrowLeft size={18}/>{t("Back")}</button>
   {optional&&<button type="button" className="wla-link" disabled={busy} onClick={()=>{const nextAnswers={...answers};delete nextAnswers[q.key];setAnswers(nextAnswers);setI(i+1)}}>{t("Skip")}</button>}
   <button type="button" className="wla-primary" disabled={busy||!valid} onClick={next}>{busy?t("Saving…"):last?t("Finish"):t("Next")}</button>
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
 const t=appTranslator(language);
 const [i,setI]=useState(0),[busy,setBusy]=useState(false),[err,setErr]=useState('');
 const [p,setP]=useState<Profile>({goal:'job',track:'marketing',level:'beginner',minutes:'15',style:'casual',...(initial||{}),language});
 const q=pathQuestions[i];const last=i===pathQuestions.length-1;const val=(p as Record<string,string|undefined>)[q.key];
 async function finish(choices:Profile=p){setBusy(true);setErr('');const r=await api('/api/profile',{method:'POST',body:choices,timeoutMs:15000});setBusy(false);if(r.ok)onDone();else setErr(r.data.error||'Could not save your choices. Please try again.')}
 return <div className="wla-page">
  {onCancel&&!i&&<button type="button" className="wla-back" onClick={onCancel}><ArrowLeft size={18}/>{t("Back")}</button>}
  <div className="wla-progress"><span style={{width:`${(i+1)*100/pathQuestions.length}%`}}/></div>
  <p className="wla-kicker">{t("FIND MY PATH ·")}{' '}{i+1} {t("OF")}{' '}{pathQuestions.length}</p>
  <h1 className="wla-h1">{t(q.title)}</h1>
  <p className="wla-muted">{t(q.sub)}</p>
  <div className="wla-options">{q.options.map(o=><button key={o.value} type="button" className={'wla-option'+(val===o.value?' on':'')} aria-pressed={val===o.value} onClick={()=>setP({...p,[q.key]:o.value})}><span><strong>{t(o.label)}</strong>{o.detail&&<small>{t(o.detail)}</small>}</span>{val===o.value&&<Check size={18}/>}</button>)}</div>
  {err&&<p className="wla-error" role="alert">{t(err)}</p>}
  <div className="wla-actions">
   <button type="button" className="wla-ghost" disabled={!i||busy} onClick={()=>setI(i-1)}><ArrowLeft size={18}/>{t("Back")}</button>
   {!onCancel&&<button type="button" className="wla-link" disabled={busy} onClick={()=>void finish()}>{t("Skip")}</button>}
   <button type="button" className="wla-primary" disabled={busy} onClick={()=>last?finish():setI(i+1)}>{busy?t("Saving…"):last?t("Show my path"):t("Continue")}</button>
  </div>
 </div>;
}
