'use client';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {usePathname} from 'next/navigation';
import {MASCOT_EVENT,type MascotMoment} from '@/lib/mascot-events';
/**
 * The WhatsLearn mascot, one shared component for every page (mounted once in the root layout).
 * An upright stick figure with a plain round head (no glasses), drawn after the pose sheet, standing in the page flow next to the main heading or card (never across a border), on its own: no caption, label or speech bubble.
 * Each page gets its own pose: home waves, My Journey points to the next mission, Skill paths opens both hands, a mission stands calm, a mini challenge thinks, Membership points gently, Settings tunes a dial, the companion gestures to a chat bubble, sign-in and legal pages give a small wave.
 * Only real successes change it: a recorded clue gives a thumbs-up, a saved mission or a cleared mini challenge gives a jump and cheer. Then it returns to the page pose.
 * The drawing is decorative (aria-hidden). Moments are also announced as text in a polite live region. No audio. With reduced motion everything is a still drawing.
 */
type Base='walk'|'run'|'rest'|'hello'|'beckon'|'come'|'paths'|'calm'|'think'|'point'|'tune'|'chat'|'quiet';
type Pose=Base|'thumbs'|'cheer';
type Play=''|'wave'|'bounce'|'blink';
const WAVES=new Set<Pose>(['walk','run','hello','calm','tune','chat','paths','point']);
const SAY:Record<MascotMoment,string>={clue:'Clue revealed. Thumbs up.',mission:'Mission saved. Well done.',checkpoint:'Mini challenge cleared. Well done.'};
const ink='#173b2c',accent='#177349';
function pageBase(path:string):Base{
 if(path==='/')return 'walk';if(path.startsWith('/learn'))return 'come';if(path.startsWith('/find-my-path'))return 'beckon';
 if(path.startsWith('/membership'))return 'point';if(path.startsWith('/settings'))return 'tune';if(path.startsWith('/companion'))return 'chat';return 'quiet';
}
const Hand=({x,y,r=3.6}:{x:number;y:number;r?:number})=><circle cx={x} cy={y} r={r} fill="#fff"/>;
const Rest=()=><g className="hand-over"><g className="rest-arm"><path d="M60 62Q46 82 44 102"/><Hand x={44} y={104}/></g></g>;
const Hip=()=><g className="hand-over"><g className="rest-arm"><path d="M60 62Q40 74 52 92"/><Hand x={53} y={92}/></g></g>;
const Phone=({x,y,r=0}:{x:number;y:number;r?:number})=><rect x={x} y={y} width="8" height="13" rx="2" fill="#fff" transform={`rotate(${r} ${x+4} ${y+6})`}/>;
/** Poses follow the pose sheet: wave with a hand on the hip, pointing, open palm, finger-up idea, hand on chin, two-fist flex, holding a phone, phone at the ear, cross-legged calm. */
function Arms({pose}:{pose:Pose}){
 switch(pose){
  case 'walk':return <><g className="walk-arm-l"><path d="M60 62Q44 76 38 92"/><Hand x={37} y={95}/></g><g className="walk-arm-r"><path d="M60 62Q78 78 82 92"/><Hand x={83} y={95}/></g></>;
  case 'run':return <><g className="run-arm-l"><path d="M60 62Q38 66 30 48"/><Hand x={28} y={46}/></g><g className="run-arm-r"><path d="M60 62Q82 76 92 62"/><Hand x={94} y={61}/></g></>;
  case 'rest':return <><Hip/><g className="rest-arm"><path d="M60 62Q78 84 94 94"/><Hand x={96} y={95}/></g></>;
  case 'hello':return <><Hip/><g className="wave-arm"><path d="M60 62Q84 66 90 38"/><Hand x={90} y={34} r={4.4}/><path d="M86 29 84 25M90 28 90 24M94 29 96 25"/></g></>;
  case 'quiet':return <g className="hands"><path d="M60 64Q42 80 38 102"/><Hand x={37} y={104}/><path d="M37 101 34 97M60 64Q78 80 82 102"/><Hand x={83} y={104}/><path d="M83 101 86 97"/></g>;
  case 'come': case 'beckon':return <><g className="beckon-arm"><path d="M60 62Q40 74 30 56"/><Hand x={29} y={53}/></g><g className="point-arm"><path d="M60 62Q86 68 108 74"/><path d="M108 74 116 76"/><Hand x={106} y={73}/></g></>;
  case 'paths':return <><Hip/><g className="point-arm"><path d="M60 62Q88 58 110 68"/><path d="M110 68 117 70"/><Hand x={108} y={67}/></g></>;
  case 'calm':return <><Hip/><g className="idea-arm"><path d="M60 62Q74 84 66 100"/><Hand x={66} y={102}/><path d="M66 98V91"/></g></>;
  case 'think':return <><Hip/><g className="chin-arm"><path d="M60 62Q80 76 64 52"/><Hand x={63} y={49}/></g><g className="thought" fill={ink} stroke="none"><circle cx="86" cy="30" r="2"/><circle cx="92" cy="21" r="2.8"/><circle cx="101" cy="11" r="3.6"/></g></>;
  case 'point':return <><Hip/><g className="point-arm"><path d="M60 62Q88 62 108 64"/><Hand x={110} y={64} r={5.4}/><path d="M113 60 118 57M114 64 119 64M113 68 118 71"/></g></>;
  case 'tune':return <><Rest/><g className="dial"><path d="M60 62Q78 82 84 74"/><Phone x={82} y={62} r={-14}/><Hand x={85} y={76}/></g></>;
  case 'chat':return <><g className="hand-over"><g className="rest-arm"><path d="M60 62Q44 78 34 88"/><Hand x={32} y={90} r={4.4}/></g></g><g className="call-arm"><path d="M60 62Q82 62 76 36"/><Phone x={72} y={26}/><Hand x={77} y={36}/></g></>;
  case 'thumbs':return <><Hip/><path d="M60 62Q84 72 90 54"/><circle cx="90" cy="51" r="5" fill="#fff"/><g className="thumb"><path d="M91 46 93 36"/><circle cx="93" cy="35" r="2.6" fill="#fff"/></g></>;
  case 'cheer':return <><g className="pump-l"><path d="M60 62Q42 66 38 46"/><Hand x={37} y={42} r={5}/></g><g className="pump-r"><path d="M60 62Q78 66 82 46"/><Hand x={83} y={42} r={5}/></g><g stroke={accent} strokeWidth="2"><path d="M22 36l-6-3M98 36l6-3M24 8l-4-5M96 8l4-5"/></g></>;
 }
}
function Legs({pose}:{pose:Pose}){
 if(pose==='walk')return <g className="walk-legs"><path d="M60 100Q48 121 39 143M60 100Q75 118 79 140"/><ellipse cx="35" cy="146" rx="7" ry="2.8" fill="#fff"/><ellipse cx="83" cy="143" rx="7" ry="2.8" fill="#fff"/></g>;
 if(pose==='run')return <g className="run-legs"><path d="M60 100Q43 114 29 128M60 100Q76 111 93 103"/><ellipse cx="25" cy="131" rx="7" ry="2.8" fill="#fff"/><ellipse cx="98" cy="105" rx="7" ry="2.8" fill="#fff"/></g>;
 if(pose==='rest')return <g className="rest-legs"><path d="M60 100Q43 112 30 119M60 100Q75 111 95 119"/><ellipse cx="26" cy="121" rx="8" ry="2.8" fill="#fff"/><ellipse cx="99" cy="121" rx="8" ry="2.8" fill="#fff"/></g>;
 if(pose==='quiet')return <><path d="M60 100Q36 100 30 118Q60 128 90 118Q84 100 60 100"/><ellipse cx="33" cy="120" rx="7" ry="3" fill="#fff"/><ellipse cx="87" cy="120" rx="7" ry="3" fill="#fff"/></>;
 if(pose==='cheer')return <><path d="M60 100Q46 124 36 144M60 100Q74 124 84 144"/><ellipse cx="32" cy="147" rx="7" ry="2.8" fill="#fff"/><ellipse cx="88" cy="147" rx="7" ry="2.8" fill="#fff"/></>;
 if(pose==='come'||pose==='beckon')return <><path d="M60 100Q50 124 40 144M60 100Q70 120 78 138"/><ellipse cx="36" cy="147" rx="7" ry="2.8" fill="#fff"/><ellipse cx="82" cy="140" rx="7" ry="2.8" fill="#fff" transform="rotate(-12 82 140)"/></>;
 return <><path d="M60 100Q52 122 49 144M60 100Q68 122 71 144"/><ellipse cx="46" cy="147" rx="7" ry="2.8" fill="#fff"/><ellipse cx="74" cy="147" rx="7" ry="2.8" fill="#fff"/></>;
}
function Drawing({pose,play,onEnter,onTap}:{pose:Pose;play:Play;onEnter:(e:React.PointerEvent)=>void;onTap:(e:React.PointerEvent)=>void}){
 const looksUp=pose==='think',calmEyes=pose==='quiet',smile=pose==='cheer'||pose==='thumbs'||pose==='walk'||pose==='run'||pose==='rest'||pose==='hello'||pose==='quiet'||pose==='calm'||pose==='paths';
 return <svg className="mascot" data-pose={pose} data-play={play||undefined} onPointerEnter={onEnter} onPointerDown={onTap} viewBox="0 0 124 156" aria-hidden="true" focusable="false">
  <g fill="none" stroke={ink} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
   <g className="react"><g className="sway"><g className="figure">
    <g className="nod"><g className="head">
     <circle cx="60" cy="34" r="17" fill="#fff"/>
     <g className="lids">{calmEyes?<path d="M49 33q4 3 8 0M63 33q4 3 8 0" strokeWidth="2.2"/>:<g className="pupils" fill={ink} stroke="none"><circle cx={looksUp?54.5:53.5} cy={looksUp?31:33.5} r="2"/><circle cx={looksUp?68.5:66.5} cy={looksUp?31:33.5} r="2"/></g>}</g>
     {pose==='think'&&<path d="M48 25q5-3 9-1M63 24q5-2 9 1" strokeWidth="2.2"/>}
     <path d={pose==='cheer'?'M52 43c3 6 13 6 16 0z':smile?'M52.5 43.5c4 3.5 11 3.5 15 0':'M54 44.5c4 2 8 2 12 0'} fill={pose==='cheer'?ink:'none'}/>
    </g></g>
    <path d={pose==='quiet'?'M60 51Q61 76 60 100':'M60 51Q63 76 60 100'}/><circle cx="60" cy="74" r="2.6" fill={accent} stroke="none"/>
    <Legs pose={pose}/>
    <Arms pose={pose}/>
   </g></g></g>
  </g></svg>;
}
function pick():{kind:'before'|'after'|'prepend'|'append'|'fallback';el:Element|null;dialog:'mission'|'checkpoint'|null}{
 const dlg=document.querySelector('[role="dialog"][data-mascot-dialog][data-state="open"]');
 if(dlg){const card=dlg.querySelector('.mini-quest');return {kind:card?'before':'prepend',el:card||dlg,dialog:dlg.querySelector('.checkpoint-body')?'checkpoint':'mission'}}
 const hero=document.querySelector('main .visual-intro');if(hero)return {kind:'append',el:hero,dialog:null};
 const intro=document.querySelector('main.workspace>.intro');if(intro)return {kind:'after',el:intro,dialog:null};
 const a=document.querySelector('main .mini-quest,main [data-mascot-anchor],.account-main .account-card,.account-main article,.legal-copy');
 if(a)return {kind:'before',el:a,dialog:null};
 return {kind:'fallback',el:document.querySelector('[data-mascot-fallback]'),dialog:null};
}
export default function Mascot(){
 const path=usePathname()||'/';
 const [host,setHost]=useState<HTMLElement|null>(null),[react,setReact]=useState<'thumbs'|'cheer'|''>(''),[say,setSay]=useState(''),[dialog,setDialog]=useState<'mission'|'checkpoint'|null>(null);
 const timer=useRef<ReturnType<typeof setTimeout>>(undefined),el=useRef<HTMLElement|null>(null),playTimer=useRef<ReturnType<typeof setTimeout>>(undefined),count=useRef(0);
 const [play,setPlay]=useState<Play>('');
 useEffect(()=>{
  const h=document.createElement('div');h.className='mascot-host mascot-scene-'+(path==='/'?'home':path.startsWith('/learn')?'learn':path.startsWith('/find-my-path')?'journey':'rest');el.current=h;
  let frame=0;
  const place=()=>{frame=0;const {kind,el:t,dialog:d}=pick();setDialog(old=>old===d?old:d);if(!t)return;
   h.dataset.where=d?'dialog':kind;
   if(kind==='prepend'){if(h.parentNode!==t||t.firstChild!==h)t.insertBefore(h,t.firstChild);return}
   if(kind==='append'){if(h.parentNode!==t||t.lastChild!==h)t.appendChild(h);return}
   if(kind==='after'){if(t.nextSibling!==h)t.parentNode?.insertBefore(h,t.nextSibling);return}
   if(kind==='fallback'){if(h.parentNode!==t)t.appendChild(h);return}
   // Never become a cell of a grid or a row of a flex row: stand before the whole group instead.
   let at:Element=t;for(let i=0;i<4&&at.parentElement&&at.parentElement!==document.body;i++){const cs=getComputedStyle(at.parentElement);if(cs.display.includes('grid')||(cs.display.includes('flex')&&cs.flexDirection.startsWith('row')))at=at.parentElement;else break}
   if(at.previousSibling!==h)at.parentNode?.insertBefore(h,at);
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(place)};
  place();const first=requestAnimationFrame(()=>setHost(h));
  const mo=new MutationObserver(schedule);mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-state']});window.addEventListener('resize',schedule);
  const onMoment=(e:Event)=>{const kind=(e as CustomEvent<{kind:MascotMoment}>).detail?.kind;if(kind!=='clue'&&kind!=='mission'&&kind!=='checkpoint')return;
   clearTimeout(timer.current);setReact(kind==='clue'?'thumbs':'cheer');setSay(SAY[kind]);timer.current=setTimeout(()=>{setReact('');setSay('')},kind==='clue'?2400:2800)};
  window.addEventListener(MASCOT_EVENT,onMoment);
  return()=>{cancelAnimationFrame(first);mo.disconnect();window.removeEventListener('resize',schedule);window.removeEventListener(MASCOT_EVENT,onMoment);clearTimeout(timer.current);if(frame)cancelAnimationFrame(frame);h.remove()};
 },[path]);
 const base:Base=dialog==='checkpoint'?'think':dialog==='mission'?'calm':pageBase(path);
 const pose:Pose=react||base;
 // Playful reaction to a mouse pointer or a tap. It rotates (wave, bounce, blink) so it never repeats identically, ends by itself and eases back into the idle loop. A success pose is never interrupted.
 const fire=()=>{if(react)return;const kinds:Play[]=WAVES.has(pose)?['wave','bounce','blink']:['bounce','blink'];const k=kinds[count.current++%kinds.length];setPlay(k);clearTimeout(playTimer.current);playTimer.current=setTimeout(()=>setPlay(''),1500)};
 const onEnter=(e:React.PointerEvent)=>{if(e.pointerType==='mouse')fire()},onTap=(e:React.PointerEvent)=>{if(e.pointerType!=='mouse')fire()};
 useEffect(()=>()=>clearTimeout(playTimer.current),[]);
 return <><div className="mascot-fallback" data-mascot-fallback/>{host&&createPortal(<><Drawing pose={pose} play={react?'':play} onEnter={onEnter} onTap={onTap}/><span className="mascot-sr" role="status" aria-live="polite">{say}</span></>,host)}</>;
}
