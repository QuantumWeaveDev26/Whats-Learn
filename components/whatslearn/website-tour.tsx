'use client';

import {useEffect,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
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
 {id:'language',url:'/settings',target:'[data-tour="language"]',title:'Choose your language',text:'Lesson and mentor language controls replies on the website and linked WhatsApp. A reference language is separate.'},
 {id:'whatsapp',url:'/settings?connect=whatsapp#whatsapp',target:'#whatsapp',title:'Take your learning to WhatsApp',text:'Link your number using the steps here. Then ask the mentor to show, resume or review your task. Website learning stays available.'},
 {id:'chatgpt',url:'/companion',target:'[data-tour="chatgpt"]',title:'Prefer ChatGPT?',text:'Open the optional WhatsLearn Companion here. It offers guidance in a separate chat; it does not save website mission progress.'},
];
const guestSteps:Step[]=[
 {id:'courses',url:'/',target:'.programme-row > button',title:'Find your course',text:'Explore four courses. Each has 10 practical missions, with the first 3 free.'},
 {id:'starter',url:'/',target:'.agency-lanes',title:'Try a small challenge',text:'Choose a subject in the starter to try it. You can explore before creating an account.'},
 {id:'signin',url:'/',target:'.public-nav .nav-cta',title:'Keep your learning together',text:'Choose Sign up / Sign in to save progress to your account. New learners complete personal setup once.'},
 ...learnerSteps,
];
const blocked=['/welcome','/find-my-path','/reset-password','/verify-email','/forgot-password'];
const runKey='whatslearn-tour-run-v1';
type Run={index:number;guest:boolean};
function restore():Run|null{try{const r=JSON.parse(sessionStorage.getItem(runKey)||'null');return r&&Number.isInteger(r.index)&&r.index>=0&&r.index<(r.guest?guestSteps:learnerSteps).length&&typeof r.guest==='boolean'?r:null}catch{return null}}

export default function WebsiteTour(){
 const pathname=usePathname();
 const [mounted,setMounted]=useState(false),[run,setRun]=useState<Run|null>(null),[offer,setOffer]=useState(false),[guest,setGuest]=useState(true);
 const [rect,setRect]=useState<DOMRect|null>(null),[size,setSize]=useState({width:0,height:0}),[ready,setReady]=useState(false);
 const card=useRef<HTMLDivElement>(null),launcher=useRef<HTMLButtonElement>(null),previousFocus=useRef<HTMLElement|null>(null),scope=useRef('');
 const steps=run?.guest?guestSteps:learnerSteps,step=run?steps[run.index]:null;
 const hidden=blocked.includes(pathname||'')||pathname?.startsWith('/auth/')||pathname?.startsWith('/api/');
 function rememberOffer(){if(scope.current)try{localStorage.setItem('whatslearn-tour-seen-v1:'+scope.current,'1')}catch{}}
 function close(){rememberOffer();setRun(null);setOffer(false);setRect(null);try{sessionStorage.removeItem(runKey)}catch{};requestAnimationFrame(()=>{if(previousFocus.current?.isConnected)previousFocus.current.focus();else launcher.current?.focus()})}
 function move(next:Run){const dest=(next.guest?guestSteps:learnerSteps)[next.index];if(!dest)return close();rememberOffer();setOffer(false);setReady(false);setRect(null);setRun(next);try{sessionStorage.setItem(runKey,JSON.stringify(next))}catch{};const current=window.location.pathname+window.location.search+window.location.hash;if(current!==dest.url)window.location.assign(dest.url)}
 function start(){previousFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null;move({index:0,guest})}
 useEffect(()=>{setMounted(true);setRun(restore());let alive=true;fetch('/api/session',{cache:'no-store'}).then(r=>r.ok?r.json() as Promise<{signedIn:boolean}>:null).then(d=>{if(alive&&d)setGuest(!d.signedIn)}).catch(()=>{});return()=>{alive=false}},[]);

 useEffect(()=>{
  if(hidden)return;
  const check=()=>{const marker=document.querySelector<HTMLElement>('[data-tour-account]');if(!marker||marker.dataset.tourReady!=='true')return;scope.current=marker.dataset.tourAccount||'';setGuest(false);try{if(!localStorage.getItem('whatslearn-tour-seen-v1:'+scope.current)&&!restore()&&!document.querySelector('[role="dialog"]'))setOffer(true)}catch{}};
  check();const observer=new MutationObserver(check);observer.observe(document.body,{childList:true,subtree:true});return()=>observer.disconnect();
 },[pathname,hidden]);
 useEffect(()=>{
  if(!step||hidden)return;
  let target:HTMLElement|null=null;
  const locate=()=>{
   target=document.querySelector<HTMLElement>(step.target);
   if(target){let parent:HTMLElement|null=target;while(parent){if(parent instanceof HTMLDetailsElement)parent.open=true;parent=parent.parentElement}target.scrollIntoView({block:'center',behavior:'instant'});}
   measure();setReady(true);card.current?.focus();
  };
  const measure=()=>{setSize({width:window.innerWidth,height:window.innerHeight});const r=target?.getBoundingClientRect();setRect(r&&r.width>0&&r.height>0?r:null)};
  const timer=window.setTimeout(locate,120);const observer=new MutationObserver(()=>{if(!target){target=document.querySelector<HTMLElement>(step.target);if(target)locate()}});observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('resize',measure);window.addEventListener('scroll',measure,true);return()=>{clearTimeout(timer);observer.disconnect();window.removeEventListener('resize',measure);window.removeEventListener('scroll',measure,true)};
 },[step,hidden]);
 useEffect(()=>{if(!run&&!offer)return;const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();close()}if(e.key==='Tab'&&card.current){const items=Array.from(card.current.querySelectorAll<HTMLElement>('button,a[href]')).filter(el=>!el.hasAttribute('disabled'));const first=items[0],last=items[items.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===card.current)){e.preventDefault();last?.focus()}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===card.current)){e.preventDefault();first?.focus()}}};document.addEventListener('keydown',key);if(offer)card.current?.focus();return()=>document.removeEventListener('keydown',key)},[run,offer]);
 if(!mounted||hidden)return null;
 const spotlight=rect?{left:Math.max(8,rect.left-6),top:Math.max(8,rect.top-6),width:Math.min(rect.width+12,size.width-16),height:Math.min(rect.height+12,size.height-16)}:null;
 const narrow=size.width<640;
 const below=rect&&rect.bottom+340<size.height;
 const position=run&&!narrow&&rect?{left:Math.max(16,Math.min(rect.left,size.width-376)),top:below?Math.max(16,rect.bottom+16):Math.max(16,Math.min(rect.top-340,size.height-340))}:undefined;
 return <><button ref={launcher} className="website-tour-launch" onClick={start} aria-haspopup="dialog"><Compass size={17}/> Take a tour</button>{(run||offer)&&createPortal(<div className="website-tour-layer"><div className="website-tour-shade" style={run&&spotlight?{background:'transparent'}:undefined}/>{run&&spotlight&&<div className="website-tour-spotlight" style={spotlight}/>}<div ref={card} className={'website-tour-card'+(offer?' website-tour-offer':'')} style={position} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="website-tour-title" aria-describedby="website-tour-description"><button className="website-tour-close" onClick={close} aria-label="Close tour"><X size={18}/></button><span className="website-tour-count">{offer?'QUICK WEBSITE TOUR':`${(run?.index||0)+1} / ${steps.length}`}</span><h2 id="website-tour-title">{offer?'Find your way in a minute':step?.title}</h2><p id="website-tour-description" aria-live="polite">{offer?'See where to learn, save your work and connect your mentor.':step?.text}</p>{run&&!rect&&ready&&<p className="website-tour-hint">This section will appear when its page is ready. You can continue the tour.</p>}<div className="website-tour-actions">{offer?<><button onClick={close}>Not now</button><button className="website-tour-next" onClick={start}>Show me <ArrowRight size={16}/></button></>:<><button onClick={close}>Skip</button>{run&&run.index>0&&<button aria-label="Previous tour step" onClick={()=>move({...run,index:run.index-1})}><ArrowLeft size={16}/> Back</button>}<button className="website-tour-next" onClick={()=>run&&move({...run,index:run.index+1})}>{run&&run.index===steps.length-1?'Done':'Next'} <ArrowRight size={16}/></button></>}</div></div></div>,document.body)}</>;
}
