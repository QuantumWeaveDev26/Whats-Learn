'use client';
import type {Mission} from '@/lib/missions';
import {LIMITS,REASONING_LABEL,checkAnswerShape,composeAnswer,parseAnswer,validLink} from '@/lib/practical';
/** The structured parts of a practical task, shown inside the existing "Your work" area. The answer is one text body, so drafts and saved work behave as before. */
export default function PracticeFields({mission,body,onChange,language}:{mission:Mission;body:string;onChange:(body:string)=>void;language:string}){
 const p=mission.practical;if(!p)return null;const a=parseAnswer(p,body);const shape=checkAnswerShape(p,a);
 const setField=(id:string,v:string)=>onChange(composeAnswer(p,{...a,fields:{...a.fields,[id]:v}}));
 return <div className="practice-fields">
  {p.fields.map(f=>{const id='pf-'+mission.id+'-'+f.id;const v=a.fields[f.id]||'';return <div key={f.id} className="practice-field">
   <label htmlFor={id} className="form-label">{f.label}</label>
   {f.type==='choice'?<select id={id} value={v} onChange={e=>setField(f.id,e.target.value)}><option value="">Choose one…</option>{(f.options||[]).map(o=><option key={o} value={o}>{o}</option>)}</select>
   :f.type==='short'?<input id={id} type="text" dir="auto" lang={language} maxLength={LIMITS.short} value={v} onChange={e=>setField(f.id,e.target.value)}/>
   :f.type==='long'?<textarea id={id} dir="auto" lang={language} rows={4} maxLength={LIMITS.long} value={v} onChange={e=>setField(f.id,e.target.value)}/>
   :<textarea id={id} className="code-field" dir="ltr" lang="en" spellCheck={false} rows={8} maxLength={LIMITS.code} value={v} onChange={e=>setField(f.id,e.target.value)}/>}
   <p className="small muted">{f.hint}{f.type==='code'?' Code is stored as text only. It is never run.':''}</p></div>})}
  <label htmlFor="response" className="form-label">{REASONING_LABEL}</label>
  <textarea id="response" dir="auto" lang={language} rows={5} maxLength={LIMITS.reasoning} value={a.reasoning} onChange={e=>onChange(composeAnswer(p,{...a,reasoning:e.target.value}))} placeholder="Explain your choices in your own words, with reasons."/>
  {p.link&&<><label htmlFor={'pf-link-'+mission.id} className="form-label">{p.link.label}</label><input id={'pf-link-'+mission.id} type="url" inputMode="url" maxLength={LIMITS.link} value={a.link} onChange={e=>onChange(composeAnswer(p,{...a,link:e.target.value}))} placeholder="https://"/><p className="small muted">{p.link.hint} Only https links are kept. We never open or fetch your link{validLink(a.link)?'.':', and this one is not a valid https address.'}</p></>}
  {!shape.ok&&body.trim().length>0&&<p className="small muted" role="status">Still to do: {shape.errors.slice(0,3).join(' ')}</p>}
 </div>;
}
