'use client';
import {useEffect,useRef,useState} from 'react';
import {Check,Footprints,Flame,Zap,Star,Flag,Crown,Gamepad2,Target,Shapes,Trophy,Users,PenLine,MessageCircle,Award,X} from 'lucide-react';
import {api,readLocal,writeLocal,type Snapshot} from './api';
import {games} from './games-data';
import {missionsOfCourse} from '@/lib/progression';
import {programmes} from '@/lib/programmes';

/** India-time calendar day, matching how the website counts practice days. */
export const todayKey=()=>new Date(Date.now()+5.5*3600e3).toISOString().slice(0,10);
export const markGameDay=(who:string)=>writeLocal(`wla-game-day:${who||'guest'}`,todayKey());
export const markMentorDay=(who:string)=>writeLocal(`wla-mentor-day:${who||'guest'}`,todayKey());

/** Levels come from points earned on saved tasks (never reduced by hints), 200 XP per level. */
const titles=['Curious','Explorer','Maker','Builder','Creator','Pro','Trailblazer','Master'];
export function levelOf(s:Snapshot|null){
 const xp=Math.max(0,Number(s?.points?.totalPoints??0));
 const lv=Math.floor(xp/200)+1;return {lv,xp,into:xp%200,need:200,title:titles[Math.min(lv-1,titles.length-1)]};
}

/** Smoothly counts a number up when it first appears or changes. */
export function CountUp({value}:{value:number}){
 const [shown,setShown]=useState(value);const from=useRef(0);
 useEffect(()=>{const start=from.current,diff=value-start;if(!diff){setShown(value);return}const t0=performance.now();let raf=0;
  const step=(t:number)=>{const k=Math.min(1,(t-t0)/700);setShown(Math.round(start+diff*(1-Math.pow(1-k,3))));if(k<1)raf=requestAnimationFrame(step);else from.current=value};
  raf=requestAnimationFrame(step);return()=>cancelAnimationFrame(raf)},[value]);
 return <>{shown}</>;
}

export function LevelCard({s}:{s:Snapshot}){
 const l=levelOf(s);
 return <div className="wla-level" aria-label={`Level ${l.lv}, ${l.title}. ${l.into} of ${l.need} XP to the next level.`}>
  <span className="wla-level-badge"><small>LV</small><strong>{l.lv}</strong></span>
  <div className="wla-grow"><div className="wla-split"><strong>{l.title}</strong><small>{l.into}/{l.need} XP</small></div>
   <div className="wla-xp"><span style={{width:`${l.into*100/l.need}%`}}/></div>
   <small className="wla-muted">{l.need-l.into} XP to level {l.lv+1} · save a task for up to 100 XP</small></div>
 </div>;
}

/** Three small things to do each day. Finishing all three earns a celebration. */
export function DailyMissions({s,who,onTask,onGame,onMentor}:{s:Snapshot;who:string;onTask:()=>void;onGame:()=>void;onMentor:()=>void}){
 const day=todayKey();
 const items=[
  {id:'task',label:'Save today’s task',done:!!s.points?.todayUsed,go:onTask,Icon:PenLine},
  {id:'game',label:'Play today’s game',done:readLocal(`wla-game-day:${who||'guest'}`)===day,go:onGame,Icon:Gamepad2},
  {id:'mentor',label:'Ask your mentor one question',done:readLocal(`wla-mentor-day:${who||'guest'}`)===day,go:onMentor,Icon:MessageCircle}
 ];
 const done=items.filter(i=>i.done).length;const all=done===3;const c=2*Math.PI*22;
 const firstAll=all&&readLocal(`wla-daily-done:${who}`)!==day;
 useEffect(()=>{if(firstAll){writeLocal(`wla-daily-done:${who}`,day);try{navigator.vibrate?.([30,40,30])}catch{}}},[firstAll,who,day]);
 return <section className={'wla-daily'+(all?' all':'')} aria-labelledby="wla-daily-t">
  {firstAll&&<div className="wla-confetti" aria-hidden="true">{Array.from({length:14},(_,i)=><i key={i} style={{left:`${(i*53)%100}%`,animationDelay:`${(i%5)*0.1}s`,background:['#087A4B','#F6C445','#FFB27A','#9FB8FF','#C9A9F2'][i%5]}}/>)}</div>}
  <div className="wla-daily-head"><svg width="54" height="54" viewBox="0 0 54 54" aria-hidden="true"><circle cx="27" cy="27" r="22" fill="none" stroke="#E4EDE6" strokeWidth="6"/><circle cx="27" cy="27" r="22" fill="none" stroke={all?'#F6C445':'#087A4B'} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${c*done/3} ${c}`} transform="rotate(-90 27 27)"/><text x="27" y="32" textAnchor="middle" fontSize="15" fontWeight="700" fill="#202020">{done}/3</text></svg>
   <div><p className="wla-kicker">DAILY MISSIONS</p><strong id="wla-daily-t">{all?'All done today. Brilliant!':`${3-done} left today`}</strong></div></div>
  <ul>{items.map(i=><li key={i.id}><button type="button" className={i.done?'done':''} onClick={i.go} disabled={i.done} aria-label={`${i.label}${i.done?', done':''}`}><span className="wla-dm-icon">{i.done?<Check size={16}/>:<i.Icon size={16}/>}</span><span className="wla-grow">{i.label}</span>{!i.done&&<small>Go</small>}</button></li>)}</ul>
 </section>;
}

type Badge={id:string;name:string;how:string;Icon:React.ComponentType<{size?:number}>;earned:boolean};
/** Badges are earned from real progress: saved tasks, streaks, mini challenges, games and the weekly board. */
export function badgesFor(s:Snapshot|null,who:string,board?:{me:null|{rank:number}}|null,inSquad?:boolean):Badge[]{
 const done=new Set(s?.work.map(w=>w.mission_id)||[]);const perCourse=programmes.map(p=>missionsOfCourse(p.id).filter(m=>done.has(m.id)).length);
 const best=(id:string)=>Number(readLocal(`wla-game-best:${who||'guest'}:${id}`)||0);const played=games.filter(g=>best(g.id)>0||readLocal(`wla-game-best:${who||'guest'}:${g.id}`)!==null).length;
 const streak=s?.points?.streak;
 return [
  {id:'first',name:'First steps',how:'Save your first task',Icon:Footprints,earned:done.size>=1},
  {id:'roll',name:'On a roll',how:'Reach a 3-day streak',Icon:Flame,earned:(streak?.best||0)>=3},
  {id:'week',name:'Unstoppable',how:'Reach a 7-day streak',Icon:Zap,earned:(streak?.best||0)>=7},
  {id:'challenge',name:'Challenger',how:'Clear a mini challenge',Icon:Star,earned:(s?.checkpoints.length||0)>=1},
  {id:'half',name:'Halfway there',how:'Save 5 tasks in one course',Icon:Flag,earned:perCourse.some(n=>n>=5)},
  {id:'champ',name:'Course champion',how:'Finish all 10 tasks of a course',Icon:Crown,earned:perCourse.some(n=>n>=10)},
  {id:'gamer',name:'Game on',how:'Play any game',Icon:Gamepad2,earned:played>=1},
  {id:'perfect',name:'Perfect 100',how:'Score 100 in a game',Icon:Target,earned:games.some(g=>best(g.id)>=100)},
  {id:'all',name:'All-rounder',how:'Play all 8 games',Icon:Shapes,earned:played>=games.length},
  {id:'podium',name:'Podium',how:'Finish top 3 in a weekly tournament',Icon:Trophy,earned:!!board?.me&&board.me.rank<=3},
  {id:'team',name:'Team player',how:'Join a squad',Icon:Users,earned:!!inSquad}
 ];
}
export function BadgeGrid({s,who}:{s:Snapshot|null;who:string}){
 const [board,setBoard]=useState<{me:null|{rank:number};squad:unknown}|null>(null);
 useEffect(()=>{let live=true;void api<{me:null|{rank:number};squad:unknown}>('/api/games').then(r=>{if(live&&r.ok)setBoard(r.data)});return()=>{live=false}},[who]);
 const list=badgesFor(s,who,board,!!board?.squad);const got=list.filter(b=>b.earned).length;
 return <section className="wla-badges" aria-labelledby="wla-badges-t">
  <div className="wla-split"><p className="wla-section" id="wla-badges-t">BADGES</p><small className="wla-muted">{got} of {list.length}</small></div>
  <div className="wla-badge-grid">{list.map(b=><div key={b.id} className={'wla-badge'+(b.earned?' got':'')} title={b.how}><span><b.Icon size={22}/></span><strong>{b.name}</strong><small>{b.earned?'Earned':b.how}</small></div>)}</div>
 </section>;
}
/** Shows a short toast the first time a badge is earned on this phone. */
export function BadgeToast({s,who}:{s:Snapshot;who:string}){
 const [toast,setToast]=useState<Badge|null>(null);
 useEffect(()=>{
  const key=`wla-badges-seen:${who}`,initKey=`wla-badges-init:${who}`;const seen=new Set((readLocal(key)||'').split(',').filter(Boolean));
  const earned=badgesFor(s,who).filter(b=>b.earned);writeLocal(key,earned.map(b=>b.id).join(','));
  // The first visit on a phone records what is already earned without a toast.
  if(!readLocal(initKey)){writeLocal(initKey,'1');return}
  const fresh=earned.find(b=>!seen.has(b.id));if(!fresh)return;
  setToast(fresh);try{navigator.vibrate?.([20,30,20])}catch{}const t=setTimeout(()=>setToast(null),4500);return()=>clearTimeout(t);
 },[s,who]);
 if(!toast)return null;
 return <div className="wla-toast" role="status"><span><Award size={22}/></span><div><small>NEW BADGE</small><strong>{toast.name}</strong><small>{toast.how}</small></div><button type="button" aria-label="Close" onClick={()=>setToast(null)}><X size={18}/></button></div>;
}
