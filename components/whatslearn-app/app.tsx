'use client';
import {Component,useCallback,useEffect,useRef,useState,type ReactNode} from 'react';
import {Home as HomeIcon,BookOpen,PenLine,MessageCircle,User,Lock,Gamepad2,Flame,BellRing,CalendarClock} from 'lucide-react';
import {localizeMission} from '@/lib/personalization';
import {missionsOfCourse} from '@/lib/progression';
import {missions} from '@/lib/missions';
import {parseAnswer} from '@/lib/practical';
import {restoreResume,resumeKey,resumeRecord} from './learning-state';
import {api,loadSnapshot,readLocal,writeLocal,setAccountKey,type Snapshot} from './api';
import {Splash,Welcome,LanguageStep,AuthScreen} from './intro';
import {PersonalSetup,PathSetup} from './onboarding';
import {MissionFlow,CheckpointFlow,type Saved} from './practice';
import {AppSheet} from './sheet';
import {Home,Courses,Mentor,Me,Creations,GuestHome,nextFor,type Next} from './tabs';
import {GamesHub,type Challenge} from './games';
import {games,type GameId} from './games-data';

type Stage='splash'|'welcome'|'language'|'auth'|'context'|'path'|'app';
type Tab='home'|'courses'|'practice'|'play'|'mentor'|'me';
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
 const [course,setCourse]=useState<string>();
 const [resumeAccount,setResumeAccount]=useState('');
 const [sheet,setSheet]=useState(false);
 const sheetOpener=useRef<HTMLElement|null>(null);
 const showPlans=useCallback(()=>{sheetOpener.current=document.activeElement as HTMLElement|null;setSheet(true)},[]);
 const closePlans=useCallback(()=>setSheet(false),[]);
 const [saved,setSaved]=useState<Saved|null>(null);
 const [reviews,setReviews]=useState<number|undefined>();
 const [online,setOnline]=useState(true);
 const [loadError,setLoadError]=useState('');
 const [loading,setLoading]=useState(false);
 const refreshRun=useRef(0);
 const [creation,setCreation]=useState('');
 /** A friend's challenge link (/app?play=hook-hunter&beat=80) opens that game straight away, even before sign-in. */
 const [challenge,setChallenge]=useState<Challenge|null>(null);
 useEffect(()=>{try{const q=new URLSearchParams(window.location.search);const g=q.get('play') as GameId|null;if(g&&games.some(x=>x.id===g)){const b=Number(q.get('beat'));setChallenge({game:g,beat:Number.isFinite(b)?Math.max(0,Math.min(100,Math.round(b))):0});history.replaceState(null,'','/app')}}catch{}},[]);
 const mainRef=useRef<HTMLElement>(null);
 const accountRef=useRef('');accountRef.current=snap?.accountKey||'';

 const refresh=useCallback(async()=>{
  const run=++refreshRun.current;setLoading(true);
  try{
   const s=await loadSnapshot();if(run!==refreshRun.current)return;setAccountKey(s?.accountKey||'');setSnap(s);setLoadError('');
   if(s){setGuest(false);if(s.profile?.language)setLanguage(s.profile.language);
    void api<{limit?:number;used?:number}>('/api/feedback',{timeoutMs:15000}).then(a=>{if(run===refreshRun.current&&a.ok&&a.data.limit!==undefined)setReviews(Math.max(0,a.data.limit-(a.data.used||0)))})}
   return s;
  }catch(error){
   if(run===refreshRun.current){
    const failedAccount=error&&typeof error==='object'&&'accountKey' in error?error.accountKey:undefined;
    const accountChanged=!!(error&&typeof error==='object'&&'accountChanged' in error&&error.accountChanged);
    if(accountChanged||(typeof failedAccount==='string'&&failedAccount!==accountRef.current)){setAccountKey('');setSnap(null);setOpen(null);setSaved(null);setCourse(undefined);setCreation('');setOverlay('');setResumeAccount('');setGuest(false);setBooted(false);setStage('splash')}
    setLoadError('We couldn’t load your latest progress. Check your connection and try again.');
   }return undefined;
  }
  finally{if(run===refreshRun.current)setLoading(false)}
 },[]);
 useEffect(()=>{const l=readLocal('wla-language');if(l)setLanguage(l);refresh().then(s=>{if(s!==undefined)setBooted(true)})},[refresh]);
 /** Coming back to the app (after paying on the website, or learning on WhatsApp) refreshes plan, points and progress. */
 useEffect(()=>{let last=Date.now();const on=()=>{if(document.visibilityState==='visible'&&Date.now()-last>15000){last=Date.now();refresh()}};document.addEventListener('visibilitychange',on);return()=>document.removeEventListener('visibilitychange',on)},[refresh]);
 useEffect(()=>{const up=()=>setOnline(navigator.onLine);up();window.addEventListener('online',up);window.addEventListener('offline',up);return()=>{window.removeEventListener('online',up);window.removeEventListener('offline',up)}},[]);
 useEffect(()=>{mainRef.current?.scrollTo(0,0)},[tab,overlay,open,saved]);
 // A task or draft from a former account must never remain in the active view.
 useEffect(()=>{
  setSaved(null);setOverlay('');
  const restored=snap?restoreResume(readLocal(resumeKey(snap.accountKey)),snap):null;
  setOpen(restored?.target||null);setCourse(restored?.target.kind==='mission'?restored.target.mission.track:restored?.target.kind==='checkpoint'?restored.target.track:undefined);
  if(restored)setTab(restored.tab);setResumeAccount(snap?.accountKey||'');
 },[snap?.accountKey]);
 useEffect(()=>{if(snap&&resumeAccount===snap.accountKey)writeLocal(resumeKey(snap.accountKey),resumeRecord(snap.accountKey,open,tab))},[snap?.accountKey,resumeAccount,open,tab]);

 /** Where a person goes next: new visitors see the intro once; signed-in people answer the website's setup questions once, then land on Home. */
 const route=useCallback((s:Snapshot|null|undefined)=>{
  if(s===undefined)return;
  if(s){if(!s.hasContext)return setStage('context');if(!s.profile)return setStage('path');return setStage('app')}
  if(guest)return setStage('app');
  if(challengeRef.current){setGuest(true);setTab('play');return setStage('app')}
  // Signed-out visitors always start with the welcome slides, then language, then sign-in.
  setStage('welcome');
 },[guest]);
 const challengeRef=useRef<Challenge|null>(null);challengeRef.current=challenge;
 useEffect(()=>{if(challenge&&stage==='app')setTab('play')},[challenge,stage]);
 const afterSplash=useCallback(()=>{if(booted)route(snap);else setTimeout(()=>setStage(st=>st),300)},[booted,route,snap]);
 useEffect(()=>{if(booted&&stage==='splash'){const t=setTimeout(()=>route(snap),1600);return()=>clearTimeout(t)}},[booted,stage,route,snap]);

 /** The phone's Back button steps back through the app (sheet, screen, task, tab) before leaving it. */
 const depth=useRef({sheet,overlay,saved:!!saved,open:!!open,tab,creation});depth.current={sheet,overlay,saved:!!saved,open:!!open,tab,creation};
 useEffect(()=>{if(stage!=='app')return;history.pushState({wla:1},'');const onPop=()=>{const d=depth.current;
  if(d.sheet)setSheet(false);else if(d.creation)setCreation('');else if(d.overlay)setOverlay('');else if(d.saved){setSaved(null);setOpen(null);setTab('home')}else if(d.open&&d.tab==='practice'){setOpen(null);setTab('courses')}else if(d.tab!=='home')setTab('home');else{history.back();return}
  history.pushState({wla:1},'')};window.addEventListener('popstate',onPop);return()=>window.removeEventListener('popstate',onPop)},[stage]);
 async function signedIn(){const s=await refresh();route(s)}
 async function signOut(){++refreshRun.current;setLoading(false);setLoadError('');await api('/api/auth/signout',{method:'POST',body:{returnTo:'/app'}});if(snap)writeLocal(resumeKey(snap.accountKey),'');setAccountKey('');setResumeAccount('');setOpen(null);setSaved(null);setCourse(undefined);setOverlay('');setSnap(null);setGuest(false);setTab('home');setStage('auth')}
 async function changeLanguage(l:string){setLanguage(l);writeLocal('wla-language',l);if(snap){await api('/api/profile',{method:'PATCH',body:{language:l}});await refresh()}}
 function openNext(n:Next){if(n.kind==='plan'){showPlans();return}if(n.kind==='mission')setCourse(n.mission.track);if(n.kind==='checkpoint')setCourse(n.track);setOpen(n);setTab('practice');setOverlay('')}

 const track=snap?.profile?.track||'marketing';
 const current=snap?nextFor(track,snap):null;
 const selected=open||current;
 const mentorMission=selected&&(selected.kind==='mission'||selected.kind==='plan')?selected.mission.id:selected?.kind==='checkpoint'?missionsOfCourse(selected.track)[selected.after-1].id:missionsOfCourse(track)[0].id;
 function goTab(id:Tab){setTab(id);setOverlay('');setSaved(null);if(id==='practice'&&!open)setOpen(current)}

 async function retryLoad(){const s=await refresh();if(s!==undefined){setBooted(true);if(stage!=='app')route(s)}}
 if(loadError&&['splash','auth','context','path'].includes(stage))return <Shell><div className="wla-page wla-load-error" role="alert"><img src="/images/app-icon-192.png" alt="" width={48} height={48}/><h1 className="wla-h1">Let’s reconnect</h1><p className="wla-muted">{loadError}</p><button type="button" className="wla-primary wla-full" disabled={loading} onClick={retryLoad}>{loading?'Loading…':'Try again'}</button></div></Shell>;
 if(stage==='splash')return <Shell><Splash onDone={afterSplash}/></Shell>;
 if(stage==='welcome')return <Shell><Welcome onDone={()=>{writeLocal('wla-intro-seen','1');setStage('language')}}/></Shell>;
 if(stage==='language')return <Shell><LanguageStep step="STEP 1 OF 2" value={language} onChange={l=>{setLanguage(l);writeLocal('wla-language',l)}} onNext={()=>setStage('auth')}/></Shell>;
 if(stage==='auth')return <Shell><AuthScreen onSignedIn={signedIn} onGuest={()=>{setGuest(true);setTab('home');setStage('app')}}/></Shell>;
 if(stage==='context')return <Shell><PersonalSetup onDone={async()=>{const s=await refresh();route(s)}}/></Shell>;
 if(stage==='path')return <Shell><PathSetup initial={snap?.profile||null} language={language} onDone={async()=>{const s=await refresh();setTab('home');route(s)}}/></Shell>;

 const signed=!!snap;
 // Keep practice mounted while visiting other tabs so its step and unsaved work survive.
 let practiceBody:React.ReactNode=null;
 if(tab==='practice'||open){
  const target=open||current;
  if(!signed)practiceBody=<SignInCard what="practise full tasks with AI review" onSignIn={()=>setStage('auth')}/>;
  else if(!target||target.kind==='finished')practiceBody=<div className="wla-card"><strong>Course complete.</strong><p className="wla-muted">Pick another course in Courses.</p></div>;
  else if(target.kind==='checkpoint')practiceBody=<CheckpointFlow key={snap!.accountKey+'|'+target.track+'|'+target.after} track={target.track} after={target.after} onBack={()=>{setOpen(null);setTab('courses')}} onCleared={async()=>{await refresh();setOpen(null);setTab('home')}}/>;
  else if(target.kind==='plan')practiceBody=<div className="wla-stack"><div className="wla-card"><strong><Lock size={16}/> {target.mission.title}</strong><p className="wla-muted">Explore includes tasks 1–3 in each course. A plan unlocks tasks 4–10.</p><button type="button" className="wla-primary wla-full" onClick={showPlans}>See plans</button></div></div>;
  else {const mission=localizeMission(target.mission,language,snap?.profile?.level),work=snap!.work.find(w=>w.mission_id===mission.id);
   practiceBody=<MissionFlow key={snap!.accountKey+'|'+target.mission.id+'|'+language+'|'+snap?.profile?.level} accountKey={snap!.accountKey} mission={mission} initialAnswer={work?parseAnswer(mission.practical,work.body):undefined} position={target.position} language={language} onUpgrade={showPlans} onBack={()=>{setOpen(null);setTab('courses')}} onSaved={async s=>{if(accountRef.current!==snap!.accountKey)return;setSaved(s);setOpen(null);await refresh()}} onPoints={()=>{refresh()}}/>;
  }
 }
 const titles:Record<Tab,string>={home:'Home',courses:'Courses',practice:'Practice',play:'Play',mentor:'Mentor',me:'Me'};
 let body:React.ReactNode;
 if(overlay==='creations'&&snap)body=<Creations s={snap} view={creation} setView={setCreation} onBack={()=>setOverlay('')} onImprove={id=>{const m=missions.find(m=>m.id===id);if(m)openNext({kind:'mission',mission:m,position:missionsOfCourse(m.track).findIndex(v=>v.id===id)+1})}}/>;
 else if(overlay==='prefs')body=<PathSetup initial={snap?.profile||null} language={language} onCancel={()=>setOverlay('')} onDone={async()=>{await refresh();setOverlay('');setTab('home')}}/>;
 else if(overlay==='language')body=<LanguageStep value={language} onChange={changeLanguage} onNext={()=>setOverlay('')} onBack={()=>setOverlay('')}/>;
 else if(saved)body=<Celebrate s={saved} snap={snap} onHome={()=>{setSaved(null);setOpen(null);setTab('home')}} onPlay={()=>{setSaved(null);setOpen(null);setTab('play')}}/>;
 else if(tab==='home')body=signed?<Home s={snap!} reviewsLeft={reviews} onOpen={openNext} onTab={t=>goTab(t as Tab)} onCourse={id=>{setCourse(id);goTab('courses')}}/>:<GuestHome language={language} onSignIn={()=>setStage('auth')}/>;
 else if(tab==='courses')body=<Courses s={snap} initialTrack={course} onOpen={openNext} onSignIn={()=>setStage('auth')}/>;
 else if(tab==='practice')body=null;
 else if(tab==='play')body=<GamesHub who={snap?.accountKey||''} challenge={challenge} onChallengeDone={()=>setChallenge(null)}/>;
 else if(tab==='mentor')body=<Mentor key={mentorMission+'|'+language+'|'+snap?.accountKey} missionId={mentorMission} language={language} signedIn={signed} onSignIn={()=>setStage('auth')}/>;
 else body=<Me s={snap} signedIn={signed} onSignIn={()=>setStage('auth')} onCreations={()=>{setCreation('');setOverlay('creations')}} onPrefs={()=>setOverlay('prefs')} onLanguage={()=>setOverlay('language')} onPlans={showPlans} onSignOut={signOut}/>;

 const tabs:[Tab,string,React.ComponentType<{size?:number}>][]=[['home','Home',HomeIcon],['courses','Courses',BookOpen],['practice','Practice',PenLine],['play','Play',Gamepad2],['mentor','Mentor',MessageCircle],['me','Me',User]];
 return <Shell>
  <header className="wla-top" inert={sheet}><div><img src="/images/whatslearn-logo-green.png" alt="" width={32} height={32}/><strong>{overlay==='creations'?'My Creations':overlay?'Settings':saved?'Saved':titles[tab]}</strong></div>
   {signed?<span className="wla-pts">{snap?.points?.balance??0} pts</span>:<button type="button" className="wla-pill" onClick={()=>setStage('auth')}>Sign in</button>}</header>
  {!online&&<p className="wla-banner" role="status">You’re offline. Reconnect to save work and get AI reviews.</p>}
  {loadError&&<div className="wla-banner wla-retry" role="status"><span>{loadError}</span><button type="button" className="wla-link" disabled={loading} onClick={retryLoad}>{loading?'Loading…':'Try again'}</button></div>}
  <main className="wla-main" ref={mainRef} inert={sheet}><div key={'screen:'+tab+overlay+(saved?'s':'')+(open?'o':'')} className="wla-screen" hidden={tab==='practice'&&!overlay&&!saved}>{body}</div><div key="practice-flow" className="wla-screen" hidden={tab!=='practice'||!!overlay||!!saved}>{practiceBody}</div></main>
  <nav className="wla-tabs" aria-label="App sections" inert={sheet}>{tabs.map(([id,label,Icon])=><button key={id} type="button" aria-current={tab===id&&!overlay?'page':undefined} className={tab===id&&!overlay?'on':''} onClick={()=>goTab(id)}><Icon size={24}/>{label}</button>)}</nav>
  {sheet&&<AppSheet title="Membership plans" onClose={closePlans} returnFocusTo={sheetOpener.current}>
   <p className="wla-muted">Explore includes the first 3 tasks in each course and 3 AI reviews a day.</p>
   <div className="wla-card wla-plan"><div className="wla-split"><strong>Plus</strong><span><strong>₹199</strong> <small>per month</small></span></div><small>All 10 tasks in each course · 10 AI reviews a day</small></div>
   <div className="wla-card wla-split"><strong>Pro</strong><small>₹499/month · 25 AI reviews a day</small></div>
   <a className="wla-primary wla-full" href="/membership" target="_blank" rel="noopener">See all plans on the website</a>
   <button type="button" className="wla-link wla-center" onClick={()=>setSheet(false)}>Maybe later</button>
  </AppSheet>}
 </Shell>;
}

function Shell({children}:{children:React.ReactNode}){return <div className="wla" data-app-release="2026-10-28-mobile-polish-v3"><AppErrorBoundary>{children}</AppErrorBoundary></div>}
class AppErrorBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true}}
 render(){if(!this.state.failed)return this.props.children;
  return <div className="wla-page wla-center" role="alert"><img src="/images/app-icon-192.png" alt="" width={72} height={72} style={{borderRadius:18,alignSelf:'center'}}/><h1 className="wla-h1">Something went <em>wrong.</em></h1><p className="wla-muted">Your saved work is safe. Try again, and if it keeps happening, message us from Help.</p><button type="button" className="wla-primary wla-full" onClick={()=>window.location.reload()}>Try again</button></div>}
}
function SignInCard({what,onSignIn}:{what:string;onSignIn:()=>void}){return <div className="wla-stack"><div className="wla-card"><strong>Sign in to {what}</strong><p className="wla-muted">Your work, points and AI reviews are saved to your account.</p><button type="button" className="wla-primary wla-full" onClick={onSignIn}>Sign in or create an account</button></div></div>}
function Celebrate({s,snap,onHome,onPlay}:{s:Saved;snap:Snapshot|null;onHome:()=>void;onPlay:()=>void}){
 const track=s.track||snap?.profile?.track||'marketing';const done=snap?missionsOfCourse(track).filter(m=>snap.work.some(w=>w.mission_id===m.id)).length:0;
 const awarded=s.status==='awarded';const pct=Math.min(1,done/10);const c=2*Math.PI*64;
 return <div className="wla-stack wla-center wla-celebrate">
  <div className="wla-confetti" aria-hidden="true">{Array.from({length:18},(_,i)=><i key={i} style={{left:`${(i*53)%100}%`,animationDelay:`${(i%6)*0.12}s`,background:['#087A4B','#D5F4DE','#FFB27A','#9FB8FF','#C9A9F2'][i%5]}}/>)}</div>
  <div className="wla-ring"><svg width="150" height="150" viewBox="0 0 150 150" aria-hidden="true"><circle cx="75" cy="75" r="64" fill="none" stroke="#E4F8ED" strokeWidth="14"/><circle cx="75" cy="75" r="64" fill="none" stroke="#087A4B" strokeWidth="14" strokeLinecap="round" strokeDasharray={`${c*pct} ${c}`} transform="rotate(-90 75 75)"/></svg><div><strong>{done}/10</strong><small>tasks saved</small></div></div>
  <h2 className="wla-h1 wla-tight">Task saved. <em>Nice work.</em></h2>
  {awarded&&s.points!==undefined?<p className="wla-win">+{s.points} points{s.balance!==undefined?` · ${s.balance} total`:''}</p>:null}
  {s.message&&<p className="wla-muted">{s.message}</p>}
  <p className="wla-muted">It’s in My Creations now.</p>
  {(snap?.points?.streak?.current||0)>0&&<p className="wla-streak-big"><Flame size={20}/>{snap!.points!.streak.current}-day streak</p>}
  {(()=>{const n=snap?nextFor(track,snap):null;return n&&(n.kind==='mission'||n.kind==='plan')?<div className="wla-card wla-tomorrow"><p className="wla-kicker"><CalendarClock size={14}/> TOMORROW · DAY {n.position} OF 10</p><strong>{n.mission.title}</strong><small>{n.mission.minutes} min · up to 100 points</small></div>:n&&n.kind==='checkpoint'?<div className="wla-card wla-tomorrow"><p className="wla-kicker">NEXT · MINI CHALLENGE</p><strong>Clear it to unlock your next task.</strong></div>:null})()}
  <a className="wla-outline wla-full" href="/settings?connect=whatsapp#whatsapp" target="_blank" rel="noopener"><BellRing size={18}/>Remind me on WhatsApp tomorrow</a>
  <button type="button" className="wla-primary wla-full" onClick={onHome}>Back to Home</button>
  <button type="button" className="wla-link wla-center" onClick={onPlay}><Gamepad2 size={16}/> Play today’s game</button>
 </div>;
}
