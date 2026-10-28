'use client';
import {Component,useCallback,useEffect,useRef,useState,type ReactNode} from 'react';
import {Home as HomeIcon,BookOpen,PenLine,MessageCircle,User,Lock} from 'lucide-react';
import {localizeMission} from '@/lib/personalization';
import {missionsOfCourse} from '@/lib/progression';
import {api,loadSnapshot,readLocal,writeLocal,setAccountKey,type Snapshot} from './api';
import {Splash,Welcome,LanguageStep,AuthScreen} from './intro';
import {PersonalSetup,PathSetup} from './onboarding';
import {MissionFlow,CheckpointFlow,type Saved} from './practice';
import {Home,Courses,Mentor,Me,Creations,GuestHome,nextFor,type Next} from './tabs';

type Stage='splash'|'welcome'|'language'|'auth'|'context'|'path'|'app';
type Tab='home'|'courses'|'practice'|'mentor'|'me';
type Overlay=''|'creations'|'prefs'|'language';

export default function WhatsLearnApp(){
 const [stage,setStage]=useState<Stage>('splash');
 const [booted,setBooted]=useState(false);
 const [snap,setSnap]=useState<Snapshot|null>(null);
 const [guest,setGuest]=useState(false);
 const [language,setLanguage]=useState('en');
 const [tab,setTab]=useState<Tab>('home');
 const [overlay,setOverlay]=useState<Overlay>('');
 const [open,setOpen]=useState<Next|null>(null);
 const [sheet,setSheet]=useState(false);
 const [saved,setSaved]=useState<Saved|null>(null);
 const [reviews,setReviews]=useState<number|undefined>();
 const [online,setOnline]=useState(true);
 const [creation,setCreation]=useState('');
 const mainRef=useRef<HTMLElement>(null);

 const refresh=useCallback(async()=>{
  const s=await loadSnapshot();setSnap(s);
  if(s){setGuest(false);if(s.profile?.language)setLanguage(s.profile.language);
   const a=await api<{limit?:number;used?:number}>('/api/feedback');if(a.ok&&a.data.limit!==undefined)setReviews(Math.max(0,a.data.limit-(a.data.used||0)));}
  return s;
 },[]);
 useEffect(()=>{const l=readLocal('wla-language');if(l)setLanguage(l);refresh().then(()=>setBooted(true))},[refresh]);
 /** Coming back to the app (after paying on the website, or learning on WhatsApp) refreshes plan, points and progress. */
 useEffect(()=>{let last=Date.now();const on=()=>{if(document.visibilityState==='visible'&&Date.now()-last>15000){last=Date.now();refresh()}};document.addEventListener('visibilitychange',on);return()=>document.removeEventListener('visibilitychange',on)},[refresh]);
 useEffect(()=>{const up=()=>setOnline(navigator.onLine);up();window.addEventListener('online',up);window.addEventListener('offline',up);return()=>{window.removeEventListener('online',up);window.removeEventListener('offline',up)}},[]);
 useEffect(()=>{mainRef.current?.scrollTo(0,0)},[tab,overlay,open,saved]);

 /** Where a person goes next: new visitors see the intro once; signed-in people answer the website's setup questions once, then land on Home. */
 const route=useCallback((s:Snapshot|null)=>{
  if(s){if(!s.hasContext)return setStage('context');if(!s.profile)return setStage('path');return setStage('app')}
  if(guest)return setStage('app');
  setStage(readLocal('wla-intro-seen')?'auth':'welcome');
 },[guest]);
 const afterSplash=useCallback(()=>{if(booted)route(snap);else setTimeout(()=>setStage(st=>st),300)},[booted,route,snap]);
 useEffect(()=>{if(booted&&stage==='splash'){const t=setTimeout(()=>route(snap),1600);return()=>clearTimeout(t)}},[booted,stage,route,snap]);

 /** The phone's Back button steps back through the app (sheet, screen, task, tab) before leaving it. */
 const depth=useRef({sheet,overlay,saved:!!saved,open:!!open,tab,creation});depth.current={sheet,overlay,saved:!!saved,open:!!open,tab,creation};
 useEffect(()=>{if(stage!=='app')return;history.pushState({wla:1},'');const onPop=()=>{const d=depth.current;
  if(d.sheet)setSheet(false);else if(d.creation)setCreation('');else if(d.overlay)setOverlay('');else if(d.saved){setSaved(null);setOpen(null);setTab('home')}else if(d.open){setOpen(null);setTab('courses')}else if(d.tab!=='home')setTab('home');else{history.back();return}
  history.pushState({wla:1},'')};window.addEventListener('popstate',onPop);return()=>window.removeEventListener('popstate',onPop)},[stage]);
 async function signedIn(){const s=await refresh();route(s)}
 async function signOut(){await api('/api/auth/signout',{method:'POST',body:{returnTo:'/app'}});setAccountKey('');setSnap(null);setGuest(false);setTab('home');setStage('auth')}
 async function changeLanguage(l:string){setLanguage(l);writeLocal('wla-language',l);if(snap){await api('/api/profile',{method:'PATCH',body:{language:l}});await refresh()}}
 function openNext(n:Next){if(n.kind==='plan'){setSheet(true);return}setOpen(n);setTab('practice');setOverlay('')}

 const track=snap?.profile?.track||'marketing';
 const current=snap?nextFor(track,snap):null;
 const mentorMission=current&&(current.kind==='mission'||current.kind==='plan')?current.mission.id:missionsOfCourse(track)[0].id;

 if(stage==='splash')return <Shell><Splash onDone={afterSplash}/></Shell>;
 if(stage==='welcome')return <Shell><Welcome onDone={()=>{writeLocal('wla-intro-seen','1');setStage('language')}}/></Shell>;
 if(stage==='language')return <Shell><LanguageStep step="STEP 1 OF 2" value={language} onChange={l=>{setLanguage(l);writeLocal('wla-language',l)}} onNext={()=>setStage('auth')}/></Shell>;
 if(stage==='auth')return <Shell><AuthScreen onSignedIn={signedIn} onGuest={()=>{setGuest(true);setTab('home');setStage('app')}}/></Shell>;
 if(stage==='context')return <Shell><PersonalSetup onDone={async()=>{const s=await refresh();route(s)}}/></Shell>;
 if(stage==='path')return <Shell><PathSetup initial={snap?.profile||null} language={language} onDone={async()=>{const s=await refresh();setTab('home');route(s)}}/></Shell>;

 const signed=!!snap;
 const titles:Record<Tab,string>={home:'Home',courses:'Courses',practice:'Practice',mentor:'Mentor',me:'Me'};
 let body:React.ReactNode;
 if(overlay==='creations'&&snap)body=<Creations s={snap} view={creation} setView={setCreation} onBack={()=>setOverlay('')}/>;
 else if(overlay==='prefs')body=<PathSetup initial={snap?.profile||null} language={language} onCancel={()=>setOverlay('')} onDone={async()=>{await refresh();setOverlay('');setTab('home')}}/>;
 else if(overlay==='language')body=<LanguageStep value={language} onChange={changeLanguage} onNext={()=>setOverlay('')} onBack={()=>setOverlay('')}/>;
 else if(saved)body=<Celebrate s={saved} snap={snap} onHome={()=>{setSaved(null);setOpen(null);setTab('home')}}/>;
 else if(tab==='home')body=signed?<Home s={snap!} reviewsLeft={reviews} onOpen={openNext} onTab={t=>setTab(t as Tab)}/>:<GuestHome language={language} onSignIn={()=>setStage('auth')}/>;
 else if(tab==='courses')body=signed?<Courses s={snap!} onOpen={openNext}/>:<SignInCard what="start a course" onSignIn={()=>setStage('auth')}/>;
 else if(tab==='practice'){
  const target=open||current;
  if(!signed)body=<SignInCard what="practise full tasks with AI review" onSignIn={()=>setStage('auth')}/>;
  else if(!target||target.kind==='finished')body=<div className="wla-card"><strong>Course complete.</strong><p className="wla-muted">Pick another course in Courses.</p></div>;
  else if(target.kind==='checkpoint')body=<CheckpointFlow key={target.track+target.after} track={target.track} after={target.after} onBack={()=>{setOpen(null);setTab('courses')}} onCleared={async()=>{await refresh();setOpen(null);setTab('home')}}/>;
  else if(target.kind==='plan')body=<div className="wla-stack"><div className="wla-card"><strong><Lock size={16}/> {target.mission.title}</strong><p className="wla-muted">Explore includes tasks 1–3 in each course. A plan unlocks tasks 4–10.</p><button type="button" className="wla-primary wla-full" onClick={()=>setSheet(true)}>See plans</button></div></div>;
  else body=<MissionFlow key={target.mission.id} mission={localizeMission(target.mission,language,snap?.profile?.level)} position={target.position} language={language} onUpgrade={()=>setSheet(true)} onBack={()=>{setOpen(null);setTab('courses')}} onSaved={async s=>{setSaved(s);await refresh()}} onPoints={()=>{refresh()}}/>;
 }
 else if(tab==='mentor')body=<Mentor missionId={mentorMission} language={language} signedIn={signed} onSignIn={()=>setStage('auth')}/>;
 else body=<Me s={snap} signedIn={signed} onSignIn={()=>setStage('auth')} onCreations={()=>{setCreation('');setOverlay('creations')}} onPrefs={()=>setOverlay('prefs')} onLanguage={()=>setOverlay('language')} onSignOut={signOut}/>;

 const tabs:[Tab,string,React.ComponentType<{size?:number}>][]=[['home','Home',HomeIcon],['courses','Courses',BookOpen],['practice','Practice',PenLine],['mentor','Mentor',MessageCircle],['me','Me',User]];
 return <Shell>
  <header className="wla-top"><div><img src="/images/whatslearn-logo-green.png" alt="" width={32} height={32}/><strong>{overlay==='creations'?'My Creations':overlay?'Settings':saved?'Saved':titles[tab]}</strong></div>
   {signed?<span className="wla-pts">{snap?.points?.balance??0} pts</span>:<button type="button" className="wla-pill" onClick={()=>setStage('auth')}>Sign in</button>}</header>
  {!online&&<p className="wla-banner" role="status">You’re offline. Reconnect to save work and get AI reviews.</p>}
  <main className="wla-main" ref={mainRef}>{body}</main>
  <nav className="wla-tabs" aria-label="App sections">{tabs.map(([id,label,Icon])=><button key={id} type="button" aria-current={tab===id&&!overlay?'page':undefined} className={tab===id&&!overlay?'on':''} onClick={()=>{setTab(id);setOverlay('');setSaved(null);if(id!=='practice')setOpen(null)}}><Icon size={24}/>{label}</button>)}</nav>
  {sheet&&<div className="wla-scrim" onClick={()=>setSheet(false)}><div className="wla-sheet" role="dialog" aria-modal="true" aria-labelledby="wla-sheet-t" onClick={e=>e.stopPropagation()}>
   <span className="wla-grab"/><p className="wla-kicker">KEEP GOING</p><h2 id="wla-sheet-t" className="wla-h2">Unlock all 10 tasks with <em>Plus.</em></h2>
   <p className="wla-muted">Explore includes the first 3 tasks in each course and 3 AI reviews a day.</p>
   <div className="wla-card wla-plan"><div className="wla-split"><strong>Plus</strong><span><strong>₹199</strong> <small>per month</small></span></div><small>All 10 tasks in each course · 10 AI reviews a day</small></div>
   <div className="wla-card wla-split"><strong>Pro</strong><small>₹499/month · 25 AI reviews a day</small></div>
   <a className="wla-primary wla-full" href="/membership" target="_blank" rel="noopener">See plans and pay securely</a>
   <button type="button" className="wla-link wla-center" onClick={()=>setSheet(false)}>Maybe later</button>
  </div></div>}
 </Shell>;
}

function Shell({children}:{children:React.ReactNode}){return <div className="wla"><AppErrorBoundary>{children}</AppErrorBoundary></div>}
class AppErrorBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true}}
 render(){if(!this.state.failed)return this.props.children;
  return <div className="wla-page wla-center" role="alert"><img src="/images/app-icon-192.png" alt="" width={72} height={72} style={{borderRadius:18,alignSelf:'center'}}/><h1 className="wla-h1">Something went <em>wrong.</em></h1><p className="wla-muted">Your saved work is safe. Try again, and if it keeps happening, message us from Help.</p><button type="button" className="wla-primary wla-full" onClick={()=>window.location.reload()}>Try again</button></div>}
}
function SignInCard({what,onSignIn}:{what:string;onSignIn:()=>void}){return <div className="wla-stack"><div className="wla-card"><strong>Sign in to {what}</strong><p className="wla-muted">Your work, points and AI reviews are saved to your account.</p><button type="button" className="wla-primary wla-full" onClick={onSignIn}>Sign in or create an account</button></div></div>}
function Celebrate({s,snap,onHome}:{s:Saved;snap:Snapshot|null;onHome:()=>void}){
 const track=snap?.profile?.track||'marketing';const done=snap?missionsOfCourse(track).filter(m=>snap.work.some(w=>w.mission_id===m.id)).length:0;
 const awarded=s.status==='awarded';const pct=Math.min(1,done/10);const c=2*Math.PI*64;
 return <div className="wla-stack wla-center wla-celebrate">
  <div className="wla-ring"><svg width="150" height="150" viewBox="0 0 150 150" aria-hidden="true"><circle cx="75" cy="75" r="64" fill="none" stroke="#E4F8ED" strokeWidth="14"/><circle cx="75" cy="75" r="64" fill="none" stroke="#087A4B" strokeWidth="14" strokeLinecap="round" strokeDasharray={`${c*pct} ${c}`} transform="rotate(-90 75 75)"/></svg><div><strong>{done}/10</strong><small>tasks saved</small></div></div>
  <h2 className="wla-h1 wla-tight">Task saved. <em>Nice work.</em></h2>
  {awarded&&s.points!==undefined?<p className="wla-win">+{s.points} points{s.balance!==undefined?` · ${s.balance} total`:''}</p>:null}
  {s.message&&<p className="wla-muted">{s.message}</p>}
  <p className="wla-muted">It’s in My Creations now.</p>
  <button type="button" className="wla-primary wla-full" onClick={onHome}>Back to Home</button>
 </div>;
}
