'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,Check} from 'lucide-react';
import {readLocal,writeLocal} from './api';

type Audience=''|'students'|'everyone'|'regulars';
type Draft={v:1;owner:string;step:number;audience:Audience;ad:string;revision:string;reason:string};
const key=(who:string)=>`wla-client-mission-v1:${who||'guest'}`;
const blank=(who:string):Draft=>({v:1,owner:who,step:0,audience:'',ad:'',revision:'',reason:''});
const checks=(d:Draft)=>[
 {label:'Names college students',met:/student|college|campus/i.test(d.revision)},
 {label:'Includes the ₹99 offer',met:/(?:₹\s*|rs\.?\s*|inr\s*)99\b|\b99\s*rupees/i.test(d.revision)},
 {label:'Says weekdays, 4–6 pm',met:/weekday|mon(?:day)?\s*(?:–|-|to)\s*fri/i.test(d.revision)&&/4\s*(?:pm\s*)?(?:–|-|to)\s*6\s*pm/i.test(d.revision)},
 {label:'Asks them to show a campus or student ID',met:/\b(?:show|bring|present)\b.{0,40}\b(?:campus|student|college)\s+id\b/i.test(d.revision)},
 {label:'Revises the first advert and explains the change',met:d.revision.trim().length>=25&&d.revision.trim().toLowerCase()!==d.ad.trim().toLowerCase()&&d.reason.trim().length>=12}
];
function restore(who:string):Draft{try{const d=JSON.parse(readLocal(key(who))||'null');if(d?.v!==1||d.owner!==who)return blank(who);const clean={...blank(who),audience:['students','everyone','regulars'].includes(d.audience)?d.audience:'',ad:typeof d.ad==='string'?d.ad.slice(0,280):'',revision:typeof d.revision==='string'?d.revision.slice(0,280):'',reason:typeof d.reason==='string'?d.reason.slice(0,220):''} as Draft;const step=Number.isInteger(d.step)?Math.max(0,Math.min(3,d.step)):0;clean.step=!clean.audience?0:step>=2&&clean.ad.trim().length<25?1:step===3&&!checks(clean).every(c=>c.met)?2:step;return clean}catch{return blank(who)}}

/** An optional deterministic simulation. It does not grade course work or contact a real client. */
export function ClientMission({who,onBack}:{who:string;onBack:()=>void}){
 const [d,setDraft]=useState(()=>restore(who)),[saved,setSaved]=useState<boolean|null>(null);
 const heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{if(d.owner!==who){setDraft(restore(who));setSaved(null)}},[who,d.owner]);
 useEffect(()=>{if(d.owner===who)setSaved(writeLocal(key(who),JSON.stringify(d))!==false)},[d,who]);
 useEffect(()=>{heading.current?.focus({preventScroll:true})},[d.step]);
 if(d.owner!==who)return <p role="status">Loading your mission…</p>;
 const update=(patch:Partial<Draft>)=>{setSaved(null);setDraft(previous=>({...previous,...patch}))};
 const checklist=checks(d),complete=checklist.every(c=>c.met);
 const consequences:Record<Exclude<Audience,''>,string>={students:'A useful fit: students nearby can walk in after class. Make the offer and the time clear.',everyone:'Too broad: much of your reach could go to people outside walking distance. The café needs nearby students, not citywide attention.',regulars:'Regulars may return, but this brief asks for new student visits. Existing customers alone will not meet that goal.'};
 return <div className="wla-stack wla-client-mission">
  <button type="button" className="wla-back" onClick={onBack}><ArrowLeft size={18}/>All games</button>
  <div><p className="wla-kicker">CLIENT STUDIO · 5 MIN</p><h2 ref={heading} tabIndex={-1} className="wla-h1">{d.step===3?'Mission complete':'The café brief'}</h2><p className="wla-muted">A simulated client. Make choices, write, then improve your work. Optional practice; no course credit.</p></div>
  <p className="wla-draft-status" role="status">{saved===false?'Couldn’t save on this phone. Keep this screen open and copy your work.':saved?'Draft saved on this phone.':'Saving draft on this phone…'}</p>
  {d.step<3&&<p className="wla-muted">{['1. Investigate','2. Create','3. Respond to feedback'][d.step]} · {d.step+1}/3</p>}
  {d.step===0&&<>
   <div className="wla-card wla-tint"><strong>Client: Campus Corner Café</strong><p className="wla-read">“Help us attract new students who can walk here after class. We have ₹5,000 for a weekday campaign.”</p><ul className="wla-read"><li>50 metres from the college gate.</li><li>Snack + drink: ₹99, weekdays, 4–6 pm.</li><li>Show a campus ID to claim the offer.</li></ul></div>
   <fieldset className="wla-fieldset"><legend>Who should the campaign focus on?</legend><div className="wla-stack">{([['students','Nearby college students'],['everyone','Everyone in the city'],['regulars','Existing regulars']] as const).map(([id,label])=><button key={id} type="button" className={'wla-option'+(d.audience===id?' on':'')} aria-pressed={d.audience===id} onClick={()=>update({audience:id})}>{label}</button>)}</div></fieldset>
   {d.audience&&<p className="wla-note" role="status">{consequences[d.audience]}</p>}
   <button type="button" className="wla-primary wla-full" disabled={!d.audience} onClick={()=>{if(d.audience)update({step:1})}}>Write the advert</button>
  </>}
  {d.step===1&&<>
   <p className="wla-note">{d.audience?consequences[d.audience]:''}</p><p className="wla-read">Write a short advert for the ₹99 snack + drink offer. It runs weekdays, 4–6 pm, with a campus ID. Give students one clear action.</p>
   <div className="wla-field"><label htmlFor="cm-ad">Your first advert</label><textarea id="cm-ad" rows={4} maxLength={280} value={d.ad} onChange={e=>update({ad:e.target.value.slice(0,280)})}/><small>{d.ad.length}/280 · at least 25 characters</small></div>
   <button type="button" className="wla-primary wla-full" disabled={d.ad.trim().length<25} onClick={()=>{if(d.ad.trim().length>=25)update({step:2})}}>Show client feedback</button>
   <button type="button" className="wla-ghost" onClick={()=>update({step:0})}>Reconsider the audience</button>
  </>}
  {d.step===2&&<>
   <div className="wla-card wla-tint"><strong>Client revision request · simulated</strong><p className="wla-read">“Please make the student audience, ₹99 price and weekday 4–6 pm window unmistakable. Ask them to show a campus ID.”</p>{d.audience!=='students'&&<p className="wla-read">Your original audience was a weak fit. Adapt this version to nearby college students.</p>}<small>This is a fixed practice brief, not an AI assessment of your first draft.</small></div>
   <details className="wla-disclosure"><summary>Your first advert</summary><p className="wla-read">{d.ad}</p></details>
   <div className="wla-field"><label htmlFor="cm-revision">Your revised advert</label><textarea id="cm-revision" rows={4} maxLength={280} value={d.revision} onChange={e=>update({revision:e.target.value.slice(0,280)})}/><small>Include weekdays, 4–6 pm, ₹99 and “show your campus ID”.</small></div>
   <div className="wla-field"><label htmlFor="cm-reason">What did you change, and why?</label><textarea id="cm-reason" rows={2} maxLength={220} value={d.reason} onChange={e=>update({reason:e.target.value.slice(0,220)})}/><small>At least 12 characters.</small></div>
   <ul className="wla-checklist" aria-label="Brief completion checklist">{checklist.map(c=><li key={c.label} className={c.met?'met':''}>{c.met?<Check size={14}/>:'•'}{c.label}</li>)}</ul>
   <button type="button" className="wla-primary wla-full" disabled={!complete} onClick={()=>{if(complete)update({step:3})}}>Finish mission</button>
   <button type="button" className="wla-ghost" onClick={()=>update({step:1})}>Edit the first advert</button>
  </>}
  {d.step===3&&<><div className="wla-card"><strong>Your revised advert</strong><p className="wla-read">{d.revision}</p><small>{d.reason}</small></div><p className="wla-read">You made a decision, produced an advert and revised it to meet a brief. The checklist checks required details; it does not predict campaign results or judge creativity.</p><button type="button" className="wla-outline wla-full" onClick={()=>update({step:2})}>Improve this version</button><button type="button" className="wla-primary wla-full" onClick={onBack}>Back to games</button></>}
 </div>;
}
