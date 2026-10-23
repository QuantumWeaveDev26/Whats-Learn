'use client';

import {useEffect,useRef,useState} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import {observeTourTarget} from '@/lib/tour-target';
import {tourLayout} from '@/lib/tour-layout';
import {createPortal} from 'react-dom';
import {Compass,X,ArrowRight,ArrowLeft} from 'lucide-react';
import './website-tour.css';

type Step={id:string;url:string;target:string;title:string;text:string};
const learnerSteps:Step[]=[
 {id:'journey',url:'/learn',target:'.workspace .intro',title:'Your next step lives here',text:'My Journey shows your current course and the mission to do next.'},
 {id:'mission',url:'/learn',target:'.mission-card',title:'Make something real',text:'Choose Start or Continue mission. Read the brief, then build and test your work.'},
 {id:'review',url:'/learn',target:'.mission-card .primary',title:'Review happens inside a mission',text:'Open a mission, make and test your work, then review it. Choose Tour this screen inside the mission for help with the controls available there.'},
 {id:'roadmap',url:'/learn?view=paths',target:'#course-roadmap .roadmap-heading',title:'See your 10-day roadmap',text:'See completed missions, your next task, and what you’ll build. The first 3 missions per course are free.'},
 {id:'creations',url:'/learn?view=portfolio',target:'.workspace-tabbar',title:'Find your saved work',text:'My Creations keeps your accepted submissions. Open a piece to review or improve it.'},
 {id:'settings',url:'/settings',target:'[data-tour="direction"]',title:'Change your direction',text:'Edit your course, goal, starting point or daily time here. Choose Save my settings when finished.'},
 {id:'language',url:'/settings',target:'[data-tour="language"]',title:'Choose your language',text:'Lesson and mentor language controls replies on the website and linked WhatsApp.'},
 {id:'whatsapp',url:'/settings?connect=whatsapp#whatsapp',target:'#whatsapp',title:'Take your learning to WhatsApp',text:'Link your number using the steps here. Then ask the mentor to show, resume or review your task. Website learning stays available.'},
 {id:'options',url:'/companion',target:'.account-main',title:'Choose how to learn',text:'Continue on the website or in your linked WhatsApp chat. If the optional ChatGPT companion is available, open it here for separate guidance.'},
];
const guestSteps:Step[]=[
 {id:'courses',url:'/',target:'.programme-row > button',title:'Find your course',text:'Explore four courses. Each has 10 practical missions, with the first 3 free.'},
 {id:'starter',url:'/',target:'.agency-lanes',title:'Try a small challenge',text:'Choose a subject in the starter to try it. You can explore before creating an account.'},
 learnerSteps[0],learnerSteps[3],
 {id:'signin',url:'/',target:'.public-nav .nav-cta',title:'Keep your learning together',text:'Choose Sign up / Sign in to save progress and connect WhatsApp. Personal setup is offered once after sign-in.'},
];
const blocked=['/welcome','/find-my-path','/reset-password','/verify-email','/forgot-password'];
const runKey='whatslearn-tour-run-v3';
type Run={index:number;guest:boolean;accountKey:string};
function restore():Run|null{try{const r=JSON.parse(sessionStorage.getItem(runKey)||'null');return r&&Number.isInteger(r.index)&&r.index>=0&&r.index<(r.guest?guestSteps:learnerSteps).length&&typeof r.guest==='boolean'&&typeof r.accountKey==='string'?r:null}catch{return null}}

export default function WebsiteTour(){
 const pathname=usePathname(),router=useRouter();
 const [mounted,setMounted]=useState(false),[run,setRun]=useState<Run|null>(null),[offer,setOffer]=useState(false),[guest,setGuest]=useState(true),[sessionReady,setSessionReady]=useState(false);
 const [rect,setRect]=useState<DOMRect|null>(null),[size,setSize]=useState({width:0,height:0}),[phase,setPhase]=useState<'moving'|'ready'|'unavailable'>('moving'),[attempt,setAttempt]=useState(0),[cardHeight,setCardHeight]=useState(320);
 const [offerHost,setOfferHost]=useState<HTMLElement|null>(null);
 const dismissed=useRef(new Set<string>());
 const measured=useRef({width:0,height:0,cardHeight:0});
 const card=useRef<HTMLDivElement>(null),launcher=useRef<HTMLButtonElement>(null),previousFocus=useRef<HTMLElement|null>(null),scope=useRef(''),watch=useRef<ReturnType<typeof observeTourTarget>|null>(null);
 const steps=run?.guest?guestSteps:learnerSteps,step=run?steps[run.index]:null;
 const hidden=blocked.includes(pathname||'')||pathname?.startsWith('/auth/')||pathname?.startsWith('/api/');
 function rememberOffer(){if(scope.current)dismissed.current.add(scope.current);if(scope.current)try{localStorage.setItem('whatslearn-tour-seen-v1:'+scope.current,'1')}catch{}}
 function close(){const wasRunning=!!run;rememberOffer();setRun(null);setOffer(false);setRect(null);try{sessionStorage.removeItem(runKey)}catch{};if(wasRunning)requestAnimationFrame(()=>{if(previousFocus.current?.isConnected)previousFocus.current.focus();else launcher.current?.focus()})}
 function navigate(dest:Step){const url=new URL(dest.url,window.location.origin);if(window.location.pathname===url.pathname){if(url.pathname==='/learn')window.dispatchEvent(new CustomEvent('whatslearn-tour-view',{detail:{view:url.searchParams.get('view')||'today'}}));return;}try{router.push(dest.url,{scroll:false});}catch{setPhase('unavailable');}}
 function move(next:Run){const dest=(next.guest?guestSteps:learnerSteps)[next.index];if(!dest)return close();rememberOffer();setOffer(false);setPhase('moving');setRun(next);try{sessionStorage.setItem(runKey,JSON.stringify(next))}catch{};navigate(dest);}
 function retry(){if(!step)return;setPhase('moving');navigate(step);watch.current?.retry();setAttempt(n=>n+1);}
 function preloadStart(){if(!sessionReady)return;try{void Promise.resolve(router.prefetch((guest?guestSteps:learnerSteps)[0].url)).catch(()=>{});}catch{}}
 function start(){if(document.querySelector('[role="dialog"]:not(.website-tour-card)'))return;previousFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null;move({index:0,guest,accountKey:scope.current})}
 useEffect(()=>{setMounted(true);let alive=true;fetch('/api/session',{cache:'no-store'}).then(r=>r.ok?r.json() as Promise<{signedIn:boolean;accountKey?:string}>:null).then(d=>{if(!alive||!d)return;setGuest(!d.signedIn);scope.current=d.accountKey||'';const saved=restore();if(saved&&saved.guest===!d.signedIn&&saved.accountKey===scope.current)setRun(saved);else try{sessionStorage.removeItem(runKey)}catch{}}).catch(()=>{}).finally(()=>{if(alive)setSessionReady(true)});return()=>{alive=false}},[]);

 useEffect(()=>{
  if(hidden)return;
  const check=()=>{const marker=document.querySelector<HTMLElement>('[data-tour-account]'),host=document.querySelector<HTMLElement>('[data-tour-offer]');setOfferHost(old=>old===host?old:host);if(!marker||marker.dataset.tourReady!=='true'||!host){setOffer(false);return}scope.current=marker.dataset.tourAccount||'';setGuest(false);let seen=dismissed.current.has(scope.current);try{seen=seen||!!localStorage.getItem('whatslearn-tour-seen-v1:'+scope.current)}catch{}setOffer(!seen&&!restore()&&!document.querySelector('[role="dialog"]'));};
  check();const observer=new MutationObserver(check);observer.observe(document.body,{childList:true,subtree:true});return()=>observer.disconnect();
 },[pathname,hidden]);
 useEffect(()=>{
  if(!run)return;const next=steps[run.index+1];if(next&&new URL(next.url,window.location.origin).pathname!==pathname){try{void Promise.resolve(router.prefetch(next.url)).catch(()=>{});}catch{/* Prefetch is optional; ordinary navigation still works. */}}
 },[run,pathname,router]);
 useEffect(()=>{
  if(!step||hidden)return;
  const destination=new URL(step.url,window.location.origin),view=destination.searchParams.get('view')||'today';
  if(pathname===destination.pathname&&pathname==='/learn')window.dispatchEvent(new CustomEvent('whatslearn-tour-view',{detail:{view}}));
  const controller=observeTourTarget({
   routeReady:()=>window.location.pathname===destination.pathname&&(destination.pathname!=='/learn'||document.querySelector<HTMLElement>('[data-tour-view]')?.dataset.tourView===view),
   find:()=>document.querySelector<HTMLElement>(step.target),
   onWaiting:()=>setPhase('moving'),onMissing:()=>setPhase('unavailable'),
   onTarget:(target,first)=>{
    setSize(old=>old.width===window.innerWidth&&old.height===window.innerHeight?old:{width:window.innerWidth,height:window.innerHeight});
    const height=card.current?.offsetHeight||320,next=target.getBoundingClientRect();
    const resized=measured.current.width>0&&(measured.current.width!==window.innerWidth||measured.current.height!==window.innerHeight);
    const reflow=measured.current.cardHeight!==height;
    measured.current={width:window.innerWidth,height:window.innerHeight,cardHeight:height};
    if(first||resized||reflow){
     const layout=tourLayout(next,{width:window.innerWidth,height:window.innerHeight},height);
     if(Math.abs(layout.scrollDelta)>1)window.scrollBy({top:layout.scrollDelta,behavior:!resized&&window.matchMedia('(prefers-reduced-motion: no-preference)').matches?'smooth':'instant'});
     if(first)card.current?.focus({preventScroll:true});
    }
    const box=target.getBoundingClientRect();setRect(old=>old?.left===box.left&&old?.top===box.top&&old?.width===box.width&&old?.height===box.height?old:box);
    setCardHeight(old=>old===height?old:height);setPhase('ready');
   }
  });watch.current=controller;return()=>{controller.dispose();if(watch.current===controller)watch.current=null};
 },[step,hidden,pathname,attempt]);
 useEffect(()=>{if(!run)return;const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();close()}if(e.key==='Tab'&&card.current){const items=Array.from(card.current.querySelectorAll<HTMLElement>('button,a[href]')).filter(el=>!el.hasAttribute('disabled'));const first=items[0],last=items[items.length-1];if(e.shiftKey&&(!card.current.contains(document.activeElement)||document.activeElement===first||document.activeElement===card.current)){e.preventDefault();last?.focus()}else if(!e.shiftKey&&(!card.current.contains(document.activeElement)||document.activeElement===last||document.activeElement===card.current)){e.preventDefault();first?.focus()}}};document.addEventListener('keydown',key);card.current?.focus({preventScroll:true});return()=>document.removeEventListener('keydown',key)},[run]);
 if(!mounted||hidden)return null;
 const layout=rect?tourLayout(rect,size,cardHeight):null;
 const spotlight=layout?.spotlight,position=run?layout?.card:undefined;
 return <>
  <button ref={launcher} className="website-tour-launch" onClick={start} onPointerEnter={preloadStart} onFocus={preloadStart} disabled={!sessionReady} aria-busy={!sessionReady} aria-haspopup="dialog" aria-expanded={!!run}><span className="website-tour-icon" aria-hidden="true"><Compass size={26}/></span><strong>Take a tour</strong></button>
  {offer&&offerHost&&!run&&createPortal(<section className="website-tour-invitation" aria-label="Quick website tour"><div><strong>New here?</strong><p>Find your mission, saved work and mentor.</p></div><div className="website-tour-actions"><button type="button" onClick={close}>Not now</button><button type="button" className="website-tour-next" onClick={start}>Show me <ArrowRight size={16}/></button></div></section>,offerHost)}
  {run&&createPortal(<div className="website-tour-layer">
   <div className="website-tour-shade" style={spotlight&&phase==='ready'?{background:'transparent'}:undefined}/>
   {spotlight&&<div className="website-tour-spotlight" data-pending={phase!=='ready'} style={spotlight}/>}
   <div ref={card} className="website-tour-card" style={position} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="website-tour-title" aria-describedby="website-tour-description" aria-busy={phase==='moving'}>
    <button className="website-tour-close" onClick={close} aria-label="Close tour"><X size={18}/></button>
    <span className="website-tour-count">{run.index+1} / {steps.length}</span>
    <div className="website-tour-copy" key={step?.id}>
     <h2 id="website-tour-title">{step?.title}</h2><p id="website-tour-description" aria-live="polite">{step?.text}</p>
     {phase==='moving'&&<p className="website-tour-hint" role="status">Opening this section…</p>}
     {phase==='unavailable'&&<p className="website-tour-hint" role="status">This section could not load. Retry or skip this step.</p>}
    </div>
    <div className="website-tour-actions">
     <button onClick={close}>Skip</button>
     {run.index>0&&<button disabled={phase==='moving'} aria-label="Previous tour step" onClick={()=>move({...run,index:run.index-1})}><ArrowLeft size={16}/> Back</button>}
     {phase==='unavailable'&&<button onClick={retry}>Retry section</button>}
     <button className="website-tour-next" disabled={phase==='moving'} onClick={()=>move({...run,index:run.index+1})}>{phase==='unavailable'?'Skip this step':run.index===steps.length-1?'Done':'Next'} <ArrowRight size={16}/></button>
    </div>
   </div>
  </div>,document.body)}
 </>;
}
