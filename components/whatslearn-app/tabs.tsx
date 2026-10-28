'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowUpRight,Check,ChevronRight,Lock,MessageCircle,Send} from 'lucide-react';
import {missions,type Mission} from '@/lib/missions';
import {programmes} from '@/lib/programmes';
import {lockFor,missionsOfCourse} from '@/lib/progression';
import {needsMembership} from '@/lib/mission-access';
import {checkpointPositions,checkpointKey,checkpointFor} from '@/lib/checkpoints';
import {readableBody} from '@/lib/practical';
import {agencyStory,agencyTracks,type AgencyTrack} from '@/lib/agency-story';
import {languages} from '@/lib/languages';
import {api,type Snapshot} from './api';

export type Course={completed:Set<string>;cleared:Set<string>};
export function progressOf(s:Snapshot):Course{return {completed:new Set(s.work.map(w=>w.mission_id)),cleared:new Set(s.checkpoints)}}
export type Next={kind:'mission';mission:Mission;position:number}|{kind:'checkpoint';track:string;after:number}|{kind:'plan';mission:Mission;position:number}|{kind:'finished'};
export function nextFor(track:string,s:Snapshot):Next{
 const {completed,cleared}=progressOf(s);const list=missionsOfCourse(track);const i=list.findIndex(m=>!completed.has(m.id));
 if(i<0)return {kind:'finished'};const m=list[i];const lock=lockFor(m,completed,cleared);
 if(lock.checkpoint)return {kind:'checkpoint',track:lock.checkpoint.track,after:lock.checkpoint.after};
 if(needsMembership(m,s.paidAccess))return {kind:'plan',mission:m,position:i+1};
 return {kind:'mission',mission:m,position:i+1};
}

export function Home({s,onOpen,onTab,reviewsLeft}:{s:Snapshot;onOpen:(n:Next)=>void;onTab:(t:string)=>void;reviewsLeft?:number}){
 const track=s.profile?.track||'marketing';const prog=programmes.find(p=>p.id===track)!;const next=nextFor(track,s);
 const saved=missionsOfCourse(track).filter(m=>progressOf(s).completed.has(m.id)).length;
 const doneToday=!!s.points?.todayUsed;const hour=new Date().getHours();
 const greet=hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';
 return <div className="wla-stack">
  <div><p className="wla-muted">{greet}{s.name?`, ${s.name}`:''}</p><h2 className="wla-h1 wla-tight">Your next <em>small win.</em></h2></div>
  {next.kind==='finished'?<div className="wla-hero-card"><p className="wla-hero-kicker">{prog.name.toUpperCase()}</p><p className="wla-hero-title">Course complete. All 10 tasks saved.</p><button type="button" className="wla-mint" onClick={()=>onTab('courses')}>Choose another course</button></div>
  :next.kind==='checkpoint'?<div className="wla-hero-card"><p className="wla-hero-kicker">MINI CHALLENGE</p><p className="wla-hero-title">{checkpointFor(next.track,next.after)?.title}</p><p className="wla-hero-sub">Clear it to unlock your next task. No points needed.</p><button type="button" className="wla-mint" onClick={()=>onOpen(next)}>Start mini challenge</button></div>
  :<div className="wla-hero-card">
   <div className="wla-hero-kicker wla-split"><span>{prog.name.toUpperCase()}</span><span>TASK {String(next.position).padStart(2,'0')} / 10</span></div>
   <p className="wla-hero-title">{next.mission.title}</p>
   <p className="wla-hero-sub">About {next.mission.minutes} minutes · Learn → Make → Review · up to 100 points</p>
   {doneToday&&next.kind==='mission'&&<p className="wla-hero-sub">You saved a task today. New tasks earn points once a day, so this one is for tomorrow. You can still read and draft it.</p>}
   <button type="button" className="wla-mint" onClick={()=>onOpen(next)}>{next.kind==='plan'?<><Lock size={16}/>Unlock with a plan</>:'Open task'}</button>
  </div>}
  <div className="wla-stats">
   <div><strong>{saved}/10</strong><span>tasks saved</span></div>
   <div><strong>{s.points?.balance??'—'}</strong><span>points</span></div>
   <div><strong>{reviewsLeft??'—'}</strong><span>AI reviews left today</span></div>
  </div>
  {!!s.points?.streak&&<p className="wla-note">{s.points.streak}-day streak. Keep it going.</p>}
  <button type="button" className="wla-tile" onClick={()=>onTab('courses')}><span><strong>Explore all 4 courses</strong><small>Marketing · Full-stack · Film · Visual stories</small></span><ChevronRight size={20}/></button>
  <button type="button" className="wla-tile wla-tile-tint" onClick={()=>onTab('mentor')}><span className="wla-icon"><MessageCircle size={20}/></span><span><strong>Stuck? Ask your mentor</strong><small>Here in the app or on WhatsApp</small></span></button>
 </div>;
}

export function Courses({s,onOpen}:{s:Snapshot;onOpen:(n:Next)=>void}){
 const [open,setOpen]=useState(s.profile?.track||'marketing');const {completed,cleared}=progressOf(s);
 return <div className="wla-stack">
  <p className="wla-muted">10 days · 10 tasks · first 3 free. One new task a day.</p>
  {programmes.map(p=>{const list=missionsOfCourse(p.id);const done=list.filter(m=>completed.has(m.id)).length;const isOpen=open===p.id;
   return <div key={p.id} className="wla-course">
    <button type="button" className="wla-course-head" aria-expanded={isOpen} onClick={()=>setOpen(isOpen?'':p.id)}><span className="wla-num">{p.number}</span><span className="wla-grow"><strong>{p.name}</strong><small>{p.outcome}</small></span><span className="wla-badge">{done?`${done}/10`:'Start'}</span></button>
    {isOpen&&<div className="wla-course-body">{list.flatMap((m,i)=>{
     const isDone=completed.has(m.id);const lock=lockFor(m,completed,cleared);const plan=needsMembership(m,s.paidAccess);
     const state=isDone?'Saved':plan?'Plan':lock.locked?'Locked':'Open';
     const row=<button key={m.id} type="button" className="wla-task" onClick={()=>onOpen(plan&&!isDone?{kind:'plan',mission:m,position:i+1}:lock.checkpoint?{kind:'checkpoint',track:lock.checkpoint.track,after:lock.checkpoint.after}:{kind:'mission',mission:m,position:i+1})} disabled={lock.locked&&!lock.checkpoint&&!isDone}>
      <span className={'wla-dot'+(isDone?' done':state==='Open'?' now':'')}>{isDone?<Check size={14}/>:plan||lock.locked?<Lock size={12}/>:i+1}</span><span className="wla-grow">{m.title}</span><small>{state}</small></button>;
     const after=i+1;const cp=(checkpointPositions as readonly number[]).includes(after)?checkpointFor(p.id,after):undefined;
     return cp?[row,<div key={'cp'+after} className="wla-task wla-cp"><span className={'wla-dot'+(cleared.has(checkpointKey(p.id,after))?' done':'')}>{cleared.has(checkpointKey(p.id,after))?<Check size={14}/>:'★'}</span><span className="wla-grow">Mini challenge · {cp.title}</span><small>{cleared.has(checkpointKey(p.id,after))?'Cleared':'After task '+after}</small></div>]:[row];
    })}</div>}
   </div>})}
 </div>;
}

type Msg={me:boolean;text:string};
export function Mentor({missionId,language,signedIn,onSignIn}:{missionId:string;language:string;signedIn:boolean;onSignIn?:()=>void}){
 const [msgs,setMsgs]=useState<Msg[]>([{me:false,text:'Hi! Ask me anything about your current task. I can explain, give an example or help you get unstuck.'}]);
 const [q,setQ]=useState(''),[busy,setBusy]=useState(false);const end=useRef<HTMLDivElement>(null);
 useEffect(()=>{end.current?.scrollIntoView({block:'end'})},[msgs,busy]);
 const m=missions.find(x=>x.id===missionId);
 const ideas=['Explain this task simply','Show me an example','What should I do first?'];
 async function ask(text:string){const t=text.trim();if(!t||busy)return;setQ('');setMsgs(x=>x.concat({me:true,text:t}));setBusy(true);
  const r=await api<{answer?:string}>('/api/feedback',{method:'POST',body:{action:'ask',missionId,question:t.slice(0,500),body:'',language}});setBusy(false);
  setMsgs(x=>x.concat({me:false,text:r.ok&&r.data.answer?r.data.answer:(r.data.error||'The mentor could not answer just now. Please try again.')}))}
 if(!signedIn)return <div className="wla-stack"><div className="wla-card"><strong>Sign in to chat with your mentor</strong><p className="wla-muted">The mentor uses your current task and progress.</p>{onSignIn&&<button type="button" className="wla-primary wla-full" onClick={onSignIn}>Sign in or create an account</button>}</div></div>;
 return <div className="wla-chat">
  {m&&<p className="wla-kicker">ABOUT · {m.title.toUpperCase()}</p>}
  <div className="wla-msgs">{msgs.map((x,i)=><p key={i} className={x.me?'me':''}>{x.text}</p>)}{busy&&<p className="typing">Thinking…</p>}<div ref={end}/></div>
  {msgs.length<2&&<div className="wla-ideas">{ideas.map(t=><button key={t} type="button" onClick={()=>ask(t)}>{t}</button>)}</div>}
  <form className="wla-ask" onSubmit={e=>{e.preventDefault();ask(q)}}><label htmlFor="wla-ask" className="wla-sr">Ask the mentor</label><input id="wla-ask" value={q} onChange={e=>setQ(e.target.value)} placeholder="Ask about your task…" maxLength={500}/><button type="submit" aria-label="Send" disabled={busy||!q.trim()}><Send size={20}/></button></form>
  <a className="wla-outline wla-full" href="/settings?connect=whatsapp#whatsapp">Continue on WhatsApp</a>
 </div>;
}

export function Creations({s,onBack}:{s:Snapshot;onBack:()=>void}){
 const [view,setView]=useState('');const w=s.work.find(x=>x.mission_id===view);const title=(id:string)=>missions.find(m=>m.id===id)?.title||id;
 if(w)return <div className="wla-stack"><button type="button" className="wla-back" onClick={()=>setView('')}><ArrowLeft size={18}/>My Creations</button><h2 className="wla-h2">{title(w.mission_id)}</h2><p className="wla-muted">Saved {new Date(w.updated_at).toLocaleDateString()}</p><div className="wla-card"><pre className="wla-pre">{readableBody(w.body)}</pre></div></div>;
 return <div className="wla-stack"><button type="button" className="wla-back" onClick={onBack}><ArrowLeft size={18}/>Back</button><h2 className="wla-h1 wla-tight">My <em>creations.</em></h2>
  {s.work.length?s.work.map(x=><button key={x.mission_id} type="button" className="wla-tile" onClick={()=>setView(x.mission_id)}><span><strong>{title(x.mission_id)}</strong><small>Saved {new Date(x.updated_at).toLocaleDateString()}</small></span><ChevronRight size={20}/></button>)
  :<div className="wla-card"><p className="wla-muted">Nothing saved yet. Your saved tasks appear here.</p></div>}
 </div>;
}

export function Me({s,signedIn,onSignIn,onCreations,onPrefs,onLanguage,onSignOut}:{s:Snapshot|null;signedIn:boolean;onSignIn:()=>void;onCreations:()=>void;onPrefs:()=>void;onLanguage:()=>void;onSignOut:()=>void}){
 const ext=(href:string,label:string,extra?:React.ReactNode)=><a className="wla-row" href={href} target="_blank" rel="noopener">{label}{extra||<ArrowUpRight size={18}/>}</a>;
 return <div className="wla-stack">
  {signedIn&&s?<div className="wla-profile"><span>{(s.name||'W').slice(0,1).toUpperCase()}</span><div><strong>{s.name||'Your account'}</strong><small>{s.paidAccess?'Paid plan':'Explore plan · Free'} · {s.points?.balance??0} points</small></div></div>
  :<div className="wla-card"><strong>You’re exploring as a guest</strong><p className="wla-muted">Sign in to save your work and keep your points.</p><button type="button" className="wla-primary wla-full" onClick={onSignIn}>Sign in or create an account</button></div>}
  <div className="wla-list">
   {signedIn&&<button type="button" className="wla-row" onClick={onCreations}>My Creations<span className="wla-muted">{s?.work.length||0}</span></button>}
   {ext('/membership','Membership & plans')}
   {signedIn&&<button type="button" className="wla-row" onClick={onPrefs}>Learning preferences<ChevronRight size={18}/></button>}
   <button type="button" className="wla-row" onClick={onLanguage}>Language<span className="wla-muted">{languages[s?.profile?.language||'en']}</span></button>
   {signedIn&&ext('/settings?connect=whatsapp#whatsapp','Connect WhatsApp reminders')}
   {ext('/support','Help & support')}
  </div>
  <div className="wla-list">
   {ext('/privacy','Privacy policy')}{ext('/terms','Terms of use')}{ext('/refunds','Refunds')}
   {signedIn&&<><button type="button" className="wla-row" onClick={onSignOut}>Sign out</button>{ext('/settings','Delete my account',<ArrowUpRight size={18}/>)}</>}
  </div>
  <p className="wla-muted wla-center">WhatsLearn · A venture of BrandMint AI Pvt. Ltd.</p>
 </div>;
}

/** Guests get the website's free starter challenge with one real AI review a day. */
export function GuestHome({language,onSignIn}:{language:string;onSignIn:()=>void}){
 const [track,setTrack]=useState<AgencyTrack|''>('');const [body,setBody]=useState(''),[busy,setBusy]=useState(false),[err,setErr]=useState('');
 const [fb,setFb]=useState<{quote:string;worked:string;improve:string;next:string;example?:string}|null>(null);
 const idx=agencyTracks.findIndex(t=>t.id===track);const task=track?agencyStory(language,track).copy.tasks[idx]:'';
 async function review(){setBusy(true);setErr('');const r=await api<{feedback?:typeof fb}>('/api/starter-feedback/guest',{method:'POST',body:{track,body,language}});setBusy(false);if(r.ok&&r.data.feedback)setFb(r.data.feedback);else setErr(r.data.error||'AI review is unavailable right now.')}
 return <div className="wla-stack">
  <div><p className="wla-kicker">FROM CHAT TO CHANGE</p><h2 className="wla-h1 wla-tight">Play a little.<br/><em>Build a real skill.</em></h2></div>
  {!track?<div className="wla-hero-card"><p className="wla-hero-kicker">FREE STARTER CHALLENGE</p><p className="wla-hero-title">Try a skill in 3 minutes.</p><p className="wla-hero-sub">One free AI review of your answer. No account needed.</p>
   <div className="wla-grid2">{agencyTracks.map((t,i)=><button key={t.id} type="button" className="wla-white" onClick={()=>{setTrack(t.id);setFb(null);setBody('')}}><strong>{t.label}</strong><small>{['Find the hook','Make it work','Set the scene','Tell it in frames'][i]}</small></button>)}</div></div>
  :<div className="wla-stack"><button type="button" className="wla-back" onClick={()=>setTrack('')}><ArrowLeft size={18}/>Choose another skill</button>
   <label htmlFor="wla-starter" className="wla-q">{task}</label>
   <textarea id="wla-starter" rows={5} maxLength={400} value={body} onChange={e=>{setBody(e.target.value);setFb(null)}}/>
   <small className="wla-muted">{body.length}/400 · One or two sentences of your own</small>
   {err&&<p className="wla-error" role="alert">{err}</p>}
   <button type="button" className="wla-primary wla-full" disabled={busy||body.trim().length<10} onClick={review}>{busy?'Reading your answer…':'Get my free AI review'}</button>
   {fb&&<div className="wla-card wla-review"><p className="wla-kicker">AI FEEDBACK ON YOUR ANSWER</p><p className="wla-read"><strong>What worked:</strong> {fb.worked}</p><p className="wla-read"><strong>Improve:</strong> {fb.improve}</p><p className="wla-read"><strong>Next:</strong> {fb.next}</p>{fb.example&&<p className="wla-read"><strong>Example revision:</strong> {fb.example}</p>}</div>}
  </div>}
  <div className="wla-card"><strong>Save your progress</strong><p className="wla-muted">Sign in to start a full course, save your work, get 3 AI reviews a day and connect WhatsApp.</p><button type="button" className="wla-primary wla-full" onClick={onSignIn}>Sign in or create an account</button></div>
 </div>;
}
