'use client';
import {useEffect,useRef,useState} from 'react';
import {games as allGames} from './games-data';
const gameMeta=(id:string)=>allGames.find(g=>g.id===id);
import {ArrowLeft,ArrowUpRight,Check,ChevronRight,Lock,MessageCircle,Send,Megaphone,Code,Clapperboard,Images,CreditCard,SlidersHorizontal,Languages,LifeBuoy,Shield,FileText,Receipt,LogOut,Trash2,BookMarked,Flame,Trophy,Sparkles,Target,Clock,ArrowRight,Star} from 'lucide-react';
import {missions,type Mission} from '@/lib/missions';
import {programmes} from '@/lib/programmes';
import {lockFor,missionsOfCourse} from '@/lib/progression';
import {needsMembership} from '@/lib/mission-access';
import {checkpointPositions,checkpointKey,checkpointFor} from '@/lib/checkpoints';
import {readableBody} from '@/lib/practical';
import {agencyStory,agencyTracks,type AgencyTrack} from '@/lib/agency-story';
import {languages} from '@/lib/languages';
import {api,readLocal,type Snapshot} from './api';
import {feedbackOf,historyKey,versionsOf} from './learning-state';
import {FeedbackCard} from './feedback';
import {useCourseSwipe} from './swipe';

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

/** Each course keeps the website's own colour (mint, ice, peach, lilac) so courses are recognisable at a glance. */
export const courseLook:Record<string,{Icon:React.ComponentType<{size?:number}>;cls:string}>={marketing:{Icon:Megaphone,cls:'c-mint'},development:{Icon:Code,cls:'c-ice'},filmmaking:{Icon:Clapperboard,cls:'c-peach'},storytelling:{Icon:Images,cls:'c-lilac'}};
/** The last seven practice days, from the scores the website already keeps. */
function week(s:Snapshot){const today=s.points?.today?new Date(s.points.today+'T00:00:00'):new Date();const active=new Set((s.points?.scores||[]).map(x=>x.day));
 return Array.from({length:7},(_,i)=>{const d=new Date(today);d.setDate(today.getDate()-6+i);const key=d.toISOString().slice(0,10);const local=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;return {label:'SMTWTFS'[d.getDay()],on:active.has(local)||active.has(key),today:i===6}})}

export function Home({s,onOpen,onTab,onCourse,reviewsLeft}:{s:Snapshot;onOpen:(n:Next)=>void;onTab:(t:string)=>void;onCourse:(id:string)=>void;reviewsLeft?:number}){
 const swipe=useCourseSwipe();
 const track=s.profile?.track||'marketing';const prog=programmes.find(p=>p.id===track)!;const next=nextFor(track,s);
 const {completed}=progressOf(s);const saved=missionsOfCourse(track).filter(m=>completed.has(m.id)).length;
 const doneToday=!!s.points?.todayUsed;const hour=new Date().getHours();const greet=hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';
 const streak=s.points?.streak?.current||0;const days=week(s);
 return <div className="wla-stack wla-home">
  <div className="wla-hello"><div><p className="wla-muted">{greet}{s.name?`, ${s.name}`:''}</p><h2 className="wla-h1 wla-tight">Continue learning</h2></div>
   <span className={'wla-streak'+(streak?' on':'')} aria-label={`${streak}-day streak`}><Flame size={18}/>{streak}</span></div>
  <p className="wla-goal"><Target size={16}/>{s.profile?.minutes&&s.profile.minutes!=='flexible'?`Today’s goal: ${s.profile.minutes} minutes`:'Today’s goal: learn at your own pace'}</p>

  {next.kind==='finished'?<div className="wla-hero-card"><p className="wla-hero-kicker">{prog.name.toUpperCase()}</p><p className="wla-hero-title">Course complete. All 10 tasks saved.</p><button type="button" className="wla-mint" onClick={()=>onTab('courses')}>Choose another course</button></div>
  :next.kind==='checkpoint'?<div className="wla-hero-card"><p className="wla-hero-kicker">MINI CHALLENGE</p><p className="wla-hero-title">{checkpointFor(next.track,next.after)?.title}</p><p className="wla-hero-sub">Clear it to unlock your next task. No points needed.</p><button type="button" className="wla-mint" onClick={()=>onOpen(next)}>Start mini challenge</button></div>
  :<div className="wla-hero-card">
   <p className="wla-hero-kicker">{prog.name} · Day {next.position} of 10</p>
   <p className="wla-hero-title">{next.mission.title}</p>
   <p className="wla-hero-sub"><Clock size={14}/> {next.mission.minutes} min · up to 100 points</p>
   {doneToday&&next.kind==='mission'&&<p className="wla-hero-sub">You saved a task today. New tasks earn points once a day, so this one is for tomorrow. You can still read and draft it.</p>}
   <button type="button" className="wla-mint" onClick={()=>onOpen(next)}>{next.kind==='plan'?<><Lock size={16}/>Unlock with a plan</>:<>Continue <ArrowRight size={18}/></>}</button>
  </div>}

  <div className="wla-week" role="img" aria-label={`Practised on ${days.filter(d=>d.on).length} of the last 7 days`}>
   <div className="wla-split"><strong>This week</strong><small>{days.filter(d=>d.on).length}/7 days</small></div>
   <div className="wla-days">{days.map((d,i)=><span key={i} className={(d.on?'on ':'')+(d.today?'today':'')}><i>{d.on?<Check size={14}/>:null}</i>{d.label}</span>)}</div>
  </div>

  <TournamentTeaser onPlay={()=>onTab('play')}/>

  <div className="wla-stats">
   <div><BookMarked size={18}/><strong>{saved}/10</strong><span>tasks saved</span></div>
   <div><Trophy size={18}/><strong>{s.points?.balance??'—'}</strong><span>points</span></div>
   <div><Sparkles size={18}/><strong>{reviewsLeft??'—'}</strong><span>reviews left</span></div>
  </div>

  <div className="wla-split wla-sec-head"><strong>Explore courses</strong><button type="button" className="wla-link" onClick={()=>onTab('courses')}>See all</button></div>
  <div {...swipe.handlers} className={'wla-carousel'+(swipe.dragging?' is-dragging':'')} role="region" aria-label="Explore courses. Swipe or drag horizontally." tabIndex={0}>{programmes.map(p=>{const L=courseLook[p.id];const I=L.Icon;const done=missionsOfCourse(p.id).filter(m=>completed.has(m.id)).length;
   return <button key={p.id} type="button" className={'wla-ccard '+L.cls} onClick={()=>onCourse(p.id)}><span className="wla-ccard-icon"><I size={22}/></span><strong>{p.name}</strong><small>{p.headline}</small><span className="wla-cbar"><span style={{width:`${done*10}%`}}/></span><small className="wla-ccard-foot">{done?`${done}/10 saved`:'10 tasks · start free'}</small></button>})}</div>

  <button type="button" className="wla-tile wla-tile-tint" onClick={()=>onTab('mentor')}><span className="wla-icon"><MessageCircle size={20}/></span><span><strong>Stuck? Ask your mentor</strong><small>Here in the app or on WhatsApp</small></span></button>
 </div>;
}

export function Courses({s,onOpen,onSignIn,initialTrack}:{s:Snapshot|null;onOpen:(n:Next)=>void;onSignIn:()=>void;initialTrack?:string}){
 const [open,setOpen]=useState(initialTrack||'');const {completed,cleared}=s?progressOf(s):{completed:new Set<string>(),cleared:new Set<string>()};const [notice,setNotice]=useState('');
 return <div className="wla-stack">
  <div><h2 className="wla-h1 wla-tight">Choose a course</h2><p className="wla-muted">10 tasks per course · first 3 free.</p></div>
  {!s&&<p className="wla-muted">Browse first. Sign in when you’re ready to start.</p>}
  {notice&&<p className="wla-note" role="status"><Lock size={16}/>{notice}</p>}
  {programmes.map(p=>{const list=missionsOfCourse(p.id);const done=list.filter(m=>completed.has(m.id)).length;const isOpen=open===p.id;const L=courseLook[p.id];const I=L.Icon;
   return <div key={p.id} className={'wla-course '+L.cls}>
    <button type="button" className="wla-course-cover" aria-expanded={isOpen} onClick={()=>{setOpen(isOpen?'':p.id);setNotice('')}}>
     <span className="wla-ccard-icon"><I size={24}/></span>
     <span className="wla-grow"><strong>{p.name}</strong><small>10 practical tasks</small>{done>0&&<span className="wla-cbar" aria-hidden="true"><span style={{width:`${done*10}%`}}/></span>}</span>
     <span className="wla-badge">{done?'View progress':'View course'}<ChevronRight size={18} className={isOpen?'wla-rot':''}/></span>
    </button>
    {isOpen&&<div className="wla-course-body"><p className="wla-course-note">{done}/10 saved · Select an open task to begin. One new task earns points per day.</p>{list.flatMap((m,i)=>{
     const isDone=completed.has(m.id);const lock=lockFor(m,completed,cleared);const plan=needsMembership(m,s?.paidAccess||false);
     const state=!s?(plan?'Plan':'Free'):isDone?'Saved':plan?'Plan':lock.locked?'Locked':'Open';
     const row=<button key={m.id} type="button" className={'wla-task'+(s&&lock.locked&&!isDone&&!plan?' locked':'')+(state==='Open'?' current':'')} onClick={()=>{setNotice('');if(!s){onSignIn();return}if(lock.locked&&!lock.checkpoint&&!isDone){setNotice(lock.message);return}onOpen(plan&&!isDone?{kind:'plan',mission:m,position:i+1}:lock.checkpoint?{kind:'checkpoint',track:lock.checkpoint.track,after:lock.checkpoint.after}:{kind:'mission',mission:m,position:i+1})}}>
      <span className={'wla-dot'+(isDone?' done':state==='Open'?' now':'')}>{isDone?<Check size={14}/>:plan||(s&&lock.locked)?<Lock size={12}/>:i+1}</span><span className="wla-grow">{m.title}<small>{m.minutes} min · {m.skill}</small></span><small className={'wla-state s-'+state.toLowerCase()}>{state}</small></button>;
     const after=i+1;const cp=(checkpointPositions as readonly number[]).includes(after)?checkpointFor(p.id,after):undefined;
     const cpCleared=cleared.has(checkpointKey(p.id,after));
     return cp?[row,<button type="button" key={'cp'+after} className="wla-task wla-cp" onClick={()=>{setNotice('');if(!s){onSignIn();return}if(cpCleared){setNotice('Mini challenge cleared. Nice work.');return}if(!isDone){setNotice(`This mini challenge opens after you save task ${after}.`);return}onOpen({kind:'checkpoint',track:p.id,after})}}><span className={'wla-dot star'+(cpCleared?' done':'')}>{cpCleared?<Check size={14}/>:<Star size={13}/>}</span><span className="wla-grow">Mini challenge<small>{cp.title}</small></span><small className="wla-state">{cpCleared?'Cleared':isDone?'Open':'After task '+after}</small></button>]:[row];
    })}</div>}
   </div>})}
 </div>;
}

type Msg={me:boolean;text:string};
export function Mentor({missionId,language,signedIn,onSignIn}:{missionId:string;language:string;signedIn:boolean;onSignIn?:()=>void}){
 const [msgs,setMsgs]=useState<Msg[]>([{me:false,text:'Need a hand? Ask for an explanation, an example, or a next step.'}]);
 const [q,setQ]=useState(''),[busy,setBusy]=useState(false);const end=useRef<HTMLDivElement>(null);
 useEffect(()=>{end.current?.scrollIntoView({block:'end'})},[msgs,busy]);
 const m=missions.find(x=>x.id===missionId);
 const ideas=['Explain this task simply','Show me an example','What should I do first?'];
 async function ask(text:string){const t=text.trim();if(!t||busy)return;setQ('');setMsgs(x=>x.concat({me:true,text:t}));setBusy(true);
  const r=await api<{answer?:string}>('/api/feedback',{method:'POST',body:{action:'ask',missionId,question:t.slice(0,500),body:'',language}});setBusy(false);
  setMsgs(x=>x.concat({me:false,text:r.ok&&r.data.answer?r.data.answer:(r.data.error||'The mentor could not answer just now. Please try again.')}))}
 if(!signedIn)return <div className="wla-stack"><div className="wla-card"><strong>Sign in to chat with your mentor</strong><p className="wla-muted">The mentor uses your current task and progress.</p>{onSignIn&&<button type="button" className="wla-primary wla-full" onClick={onSignIn}>Sign in or create an account</button>}</div></div>;
 return <div className="wla-chat">
  {m&&<p className="wla-muted wla-task-context">Task: {m.title}</p>}
  <div className="wla-mentor-intro"><span><MessageCircle size={18}/></span><div><strong>WhatsLearn Mentor</strong><small>Help with this task</small></div></div>
  <div className="wla-msgs">{msgs.map((x,i)=>x.me?<p key={i} className="me">{x.text}</p>:<div key={i} className="wla-bot"><span><MessageCircle size={14}/></span><p>{x.text}</p></div>)}{busy&&<p className="typing" role="status" aria-label="Mentor is typing"><span/><span/><span/></p>}<div ref={end}/></div>
  {msgs.length<2&&<div className="wla-ideas">{ideas.map(t=><button key={t} type="button" onClick={()=>ask(t)}>{t}</button>)}</div>}
  <form className="wla-ask" onSubmit={e=>{e.preventDefault();ask(q)}}><label htmlFor="wla-ask" className="wla-sr">Ask the mentor</label><input id="wla-ask" value={q} onChange={e=>setQ(e.target.value)} placeholder="Ask about your task…" maxLength={500}/><button type="submit" aria-label="Send" disabled={busy||!q.trim()}><Send size={20}/></button></form>
  <a className="wla-outline wla-full" href="/settings?connect=whatsapp#whatsapp" target="_blank" rel="noopener">Continue on WhatsApp</a>
 </div>;
}

export function Creations({s,onBack,view,setView,onImprove}:{s:Snapshot;onBack:()=>void;view:string;setView:(id:string)=>void;onImprove?:(id:string)=>void}){const w=s.work.find(x=>x.mission_id===view);const title=(id:string)=>missions.find(m=>m.id===id)?.title||id;
 if(w){const review=feedbackOf(w.evaluation),versions=versionsOf(readLocal(historyKey(s.accountKey,w.mission_id))),recent=(s.evidence||[]).filter(e=>e.mission_id===w.mission_id).flatMap(e=>{const r=feedbackOf(e.review);return r?[{...e,review:r}]:[]}).slice(0,5);
  return <div className="wla-stack"><button type="button" className="wla-back" onClick={()=>setView('')}><ArrowLeft size={18}/>My Creations</button><h2 className="wla-h2">{title(w.mission_id)}</h2><p className="wla-muted">Saved to your account · {new Date(w.updated_at).toLocaleDateString()}</p>
   {review?<section className="wla-card"><p className="wla-kicker">Saved feedback</p><p className="wla-read">{review.summary}</p><p className="wla-read"><strong>Next step:</strong> {review.nextStep}</p><details className="wla-disclosure"><summary>Review details</summary><FeedbackCard review={review}/></details></section>:<p className="wla-muted">No saved feedback is available for this creation.</p>}
   <details className="wla-disclosure"><summary>Your saved work</summary><pre className="wla-pre">{readableBody(w.body)}</pre></details>
   {onImprove&&<button type="button" className="wla-primary wla-full" onClick={()=>onImprove(w.mission_id)}>Improve this work</button>}
   <details className="wla-disclosure"><summary>Recent feedback · {recent.length}</summary>{recent.length?recent.map((r,i)=><div className="wla-history-entry" key={r.reviewKey||i}><small>{new Date(r.created_at).toLocaleString()}</small><p className="wla-read">{r.review.summary}</p><p className="wla-read"><strong>Next:</strong> {r.review.nextStep}</p></div>):<p className="wla-muted">No earlier feedback was returned for this task.</p>}</details>
   <details className="wla-disclosure"><summary>Reviewed versions on this device · {versions.length}</summary><p className="wla-muted">Up to five versions reviewed in this app are kept on this device for this account. These copies do not sync between devices.</p>{versions.map((v,i)=><details className="wla-history-entry" key={i}><summary>Version from {new Date(v.createdAt).toLocaleString()}</summary><pre className="wla-pre">{readableBody(v.body)}</pre><p className="wla-read"><strong>Feedback:</strong> {v.review.summary}</p><p className="wla-read"><strong>Next:</strong> {v.review.nextStep}</p></details>)}</details>
  </div>;
 }
 return <div className="wla-stack"><button type="button" className="wla-back" onClick={onBack}><ArrowLeft size={18}/>Back</button><h2 className="wla-h1 wla-tight">My <em>creations.</em></h2>
  {s.work.length?s.work.map(x=><button key={x.mission_id} type="button" className="wla-tile" onClick={()=>setView(x.mission_id)}><span><strong>{title(x.mission_id)}</strong><small>Saved {new Date(x.updated_at).toLocaleDateString()}</small></span><ChevronRight size={20}/></button>)
  :<div className="wla-card"><p className="wla-muted">Nothing saved yet. Your saved tasks appear here.</p></div>}
 </div>;
}

export function Me({s,signedIn,onSignIn,onCreations,onPrefs,onLanguage,onPlans,onSignOut}:{s:Snapshot|null;signedIn:boolean;onSignIn:()=>void;onCreations:()=>void;onPrefs:()=>void;onLanguage:()=>void;onPlans:()=>void;onSignOut:()=>void}){
 const ext=(href:string,label:string,Icon:React.ComponentType<{size?:number}>,danger?:boolean)=><a className={'wla-row'+(danger?' danger':'')} href={href} target="_blank" rel="noopener"><Icon size={20}/>{label}<span className="wla-end"><ArrowUpRight size={18}/></span></a>;
 return <div className="wla-stack">
  {signedIn&&s?<div className="wla-profile"><span>{(s.name||'W').slice(0,1).toUpperCase()}</span><div><strong>{s.name||'Your account'}</strong><small>{s.paidAccess?'Paid plan':'Explore plan · Free'} · {s.points?.balance??0} points</small><small>{s.work.length} task{s.work.length===1?'':'s'} saved{(s.points?.streak?.current||0)>0?` · ${s.points!.streak.current}-day streak`:''}</small></div></div>
  :<div className="wla-card"><strong>You’re exploring as a guest</strong><p className="wla-muted">Sign in to save your work and keep your points.</p><button type="button" className="wla-primary wla-full" onClick={onSignIn}>Sign in or create an account</button></div>}
  <p className="wla-section">LEARNING</p>
  <details className="wla-disclosure"><summary>Points, reviews and saved work</summary><p className="wla-read">Points record completed practice. A new task can earn up to 100 points, with one new scored task per day. Points are not money.</p><p className="wla-read">AI reviews are a separate daily allowance. Explore includes 3 reviews per day after sign-in; paid plans provide more. The allowance resets at midnight India time.</p><p className="wla-read">The app’s teaching examples are free. Drafts stay on this device; accepted work and its saved feedback are stored in your account.</p></details>
  <div className="wla-list">
   {signedIn&&<button type="button" className="wla-row" onClick={onCreations}><BookMarked size={20}/>My Creations<span className="wla-end">{s?.work.length||0}<ChevronRight size={18}/></span></button>}
   {signedIn&&<button type="button" className="wla-row" onClick={onPrefs}><SlidersHorizontal size={20}/>Learning preferences<span className="wla-end"><ChevronRight size={18}/></span></button>}
   <button type="button" className="wla-row" onClick={onLanguage}><Languages size={20}/>Language<span className="wla-end">{languages[s?.profile?.language||'en']}<ChevronRight size={18}/></span></button>
   {signedIn&&ext('/settings?connect=whatsapp#whatsapp','Connect WhatsApp reminders',MessageCircle)}
  </div>
  <p className="wla-section">ACCOUNT</p>
  <div className="wla-list">
   <button type="button" className="wla-row" onClick={onPlans}><CreditCard size={20}/>Membership & plans<span className="wla-end"><ChevronRight size={18}/></span></button>
   {ext('/support','Help & support',LifeBuoy)}
   {signedIn&&<button type="button" className="wla-row" onClick={onSignOut}><LogOut size={20}/>Sign out</button>}
  </div>
  <p className="wla-section">LEGAL</p>
  <div className="wla-list">
   {ext('/privacy','Privacy policy',Shield)}{ext('/terms','Terms of use',FileText)}{ext('/refunds','Refunds',Receipt)}
   {signedIn&&ext('/settings','Delete my account',Trash2,true)}
  </div>
  <p className="wla-muted wla-center">WhatsLearn · A venture of BrandMint AI Pvt. Ltd.<br/><small>App version 1.0</small></p>
 </div>;
}

/** Guests get the website's free starter challenge with one real AI review a day. */
export function GuestHome({language,onSignIn}:{language:string;onSignIn:()=>void}){
 const [track,setTrack]=useState<AgencyTrack|''>('');const [body,setBody]=useState(''),[busy,setBusy]=useState(false),[err,setErr]=useState('');
 const [fb,setFb]=useState<{quote:string;worked:string;improve:string;next:string;example?:string}|null>(null);
 const idx=agencyTracks.findIndex(t=>t.id===track);const task=track?agencyStory(language,track).copy.tasks[idx]:'';
 async function review(){setBusy(true);setErr('');const r=await api<{feedback?:typeof fb}>('/api/starter-feedback/guest',{method:'POST',body:{track,body,language}});setBusy(false);if(r.ok&&r.data.feedback)setFb(r.data.feedback);else setErr(r.data.error||'AI review is unavailable right now.')}
 return <div className="wla-stack">
  <div><h2 className="wla-h1 wla-tight">Try a practical AI skill</h2><p className="wla-muted">Start with a short task.</p></div>
  {!track?<div className="wla-hero-card"><p className="wla-hero-kicker">Free starter task</p><p className="wla-hero-title">About 3 minutes.</p><p className="wla-hero-sub">One AI review included. No account needed.</p>
   <div className="wla-grid2">{agencyTracks.map((t,i)=>{const Icon=[Megaphone,Code,Clapperboard,Images][i];return <button key={t.id} type="button" className="wla-white" onClick={()=>{setTrack(t.id);setFb(null);setBody('')}}><Icon size={20}/><strong>{t.label}</strong><small>{['Find the hook','Make it work','Set the scene','Tell it in frames'][i]}</small></button>})}</div></div>
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

/** Home teaser for the weekly tournament: this week's game and your place, one tap to Play. */
function TournamentTeaser({onPlay}:{onPlay:()=>void}){
 const [b,setB]=useState<{game:string;players:number;me:null|{rank:number;score:number}}|null>(null);
 useEffect(()=>{let live=true;void api<{game:string;players:number;me:null|{rank:number;score:number}}>('/api/games').then(r=>{if(live&&r.ok)setB(r.data)});return()=>{live=false}},[]);
 if(!b)return null;const g=gameMeta(b.game);if(!g)return null;
 return <button type="button" className="wla-tourney-teaser" onClick={onPlay}><span className="wla-tt-icon"><Trophy size={22}/></span><span className="wla-grow"><small>WEEKLY TOURNAMENT</small><strong>{g.name}</strong><small>{b.me?`You’re #${b.me.rank} with ${b.me.score}`:`${b.players} playing · join this week`}</small></span><ChevronRight size={20}/></button>;
}
