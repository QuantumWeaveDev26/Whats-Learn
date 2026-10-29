'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,X,Timer,Share2,RotateCcw,Crown,Dices,Trophy,Users,LogOut,Copy,Coffee,Bike,Umbrella,Smartphone,Key,Dog,Rocket,Book,Music,Camera,TreePine,Cake} from 'lucide-react';
import {api,readLocal,writeLocal} from './api';
import {markGameDay} from './rewards';
import {courseLook} from './tabs';
import {GameArt} from './game-art';
import {ClientMission} from './client-mission';
import {games,hookFeed,channels,budgetRounds,bugRounds,flowRounds,shotRounds,shotTypes,shotQuiz,diceItems,captionRounds,type GameId,type GameMeta} from './games-data';

export type Challenge={game:GameId;beat:number};
export type PlayView='games'|'weekly'|'squad'|'friend'|'client';
const bestKey=(who:string,id:GameId)=>`wla-game-best:${who||'guest'}:${id}`;
const playsKey=(who:string)=>`wla-game-plays:${who||'guest'}`;
function shuffle<T>(list:readonly T[]):T[]{const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
/** One featured game per course and India date. Tournaments retain their shared game. */
export function todaysGame(track?:string){const list=games.filter(g=>g.track===track),pool=list.length?list:games;const n=Math.floor((Date.now()+19800000)/864e5);return pool[n%pool.length]}
export const gameLink=(id:GameId,score:number)=>`https://whatslearn.in/app?play=${id}&beat=${score}`;

/** The Play tab: today's game, every course game with its best score, and friend challenges. */
type Board={week:string;endsAt:string;game:GameId;players:number;signedIn:boolean;top:{rank:number;name:string;score:number;me:boolean}[];squads:{rank:number;name:string;members:number;total:number}[];me:null|{score:number;rank:number};squad:null|{name:string;code:string;owner:boolean;total:number;rank:number;members:{name:string;score:number;me:boolean}[]}};
export function GamesHub({who,track,challenge,onChallengeDone,joinCode,onSignIn,view,onView}:{who:string;track?:string;challenge?:Challenge|null;onChallengeDone:()=>void;joinCode?:string;onSignIn?:()=>void;view:PlayView;onView:(view:PlayView)=>void}){
 const [filter,setFilter]=useState(()=>games.some(g=>g.track===track)?track!:'all');
 const [board,setBoard]=useState<Board|null>(null),[boardErr,setBoardErr]=useState('');
 const loadBoard=async()=>{const r=await api<Board>('/api/games');if(r.ok){setBoard(r.data);setBoardErr('')}else setBoardErr(r.data.error||'Leaderboard unavailable.')};
 useEffect(()=>{void loadBoard()},[who]);
 const [playing,setPlaying]=useState<GameId|null>(challenge?.game||null);
 const [beat,setBeat]=useState<number|undefined>(challenge?.beat);
 const [tick,setTick]=useState(0);
 const previousView=useRef(view),heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{if(previousView.current!==view){setPlaying(null);setBeat(undefined);previousView.current=view}heading.current?.focus({preventScroll:true})},[view]);
 useEffect(()=>{if(challenge){setPlaying(challenge.game);setBeat(challenge.beat)}},[challenge]);
 const best=(id:GameId)=>Number(readLocal(bestKey(who,id))||0);
 const plays=Number(readLocal(playsKey(who))||0);
 if(playing){const meta=games.find(g=>g.id===playing)!;
  return <GameScreen key={playing+tick} meta={meta} who={who} beat={beat} tournament={board?.game===meta.id} onExit={()=>{setPlaying(null);setBeat(undefined);onView('games');onChallengeDone();void loadBoard()}} onAgain={()=>setTick(t=>t+1)}/>}
 if(view==='client')return <ClientMission key={who||'guest'} who={who} onBack={()=>onView('games')}/>;
 if(view!=='games')return <div className="wla-stack wla-challenge-screen">
  <button type="button" className="wla-back" onClick={()=>onView('games')}><ArrowLeft size={18}/>All games</button>
  <div><h2 ref={heading} tabIndex={-1} className="wla-h1">{view==='weekly'?'Weekly tournament':view==='squad'?'Squad challenge':'Challenge a friend'}</h2><p className="wla-muted">{view==='friend'?'Choose a game, finish a round, then share your score with a friend.':view==='squad'?'Create a squad or join your friends with their six-character code.':'One game each week. Your best score counts.'}</p></div>
  {view==='friend'?<div className="wla-challenge-games">{games.map(g=><button type="button" key={g.id} className="wla-challenge-row" onClick={()=>setPlaying(g.id)}><span className="wla-ghead-art"><GameArt id={g.id}/></span><span className="wla-grow"><strong>{g.name}</strong><small>{g.minutes} min · {g.tagline}</small></span><ArrowRight size={18}/></button>)}</div>
   :view==='weekly'?<Tournament board={board} error={boardErr} who={who} onPlay={id=>setPlaying(id)} onSignIn={onSignIn}/>
   :boardErr?<div className="wla-card"><p className="wla-error" role="alert">{boardErr}</p><button type="button" className="wla-outline wla-full" onClick={()=>void loadBoard()}>Try again</button></div>:<Squad board={board} who={who} joinCode={joinCode} onChanged={loadBoard} onSignIn={onSignIn}/>}
 </div>;
 const today=todaysGame(filter==='all'?track:filter);
 // Games come first, each with its own bright illustration, so every card invites a tap.
 return <div className="wla-stack">
  <div><h2 className="wla-h1 wla-tight">Play a little. <em>Learn a lot.</em></h2><p className="wla-muted">Quick 1–2 minute games from each course. {plays?`${plays} game${plays===1?'':'s'} played on this phone.`:'Beat your best, then challenge a friend.'}</p></div>
  <button type="button" className="wla-today wla-today-compact" onClick={()=>setPlaying(today.id)}>
   <span className="wla-today-art"><GameArt id={today.id}/></span>
   <span className="wla-today-details"><span className="wla-today-label">TODAY’S GAME</span><strong>{today.name}</strong><small>{today.tagline}</small>
    <span className="wla-today-bottom"><small>{best(today.id)?`Best ${best(today.id)}`:`${today.minutes} min · Not played yet`}</small><span className="wla-today-play">Play<ArrowRight size={14}/></span></span></span>
  </button>
  <div className="wla-game-filters" role="group" aria-label="Filter games by course">{[['all','All courses'],['marketing','Marketing'],['development','Development'],['filmmaking','Filmmaking'],['storytelling','Storytelling']].map(([id,label])=><button type="button" key={id} aria-pressed={filter===id} onClick={()=>setFilter(id)}>{label}</button>)}</div>
  <div className="wla-games">{games.filter(g=>filter==='all'||g.track===filter).map(g=>{const b=best(g.id);
   return <button key={g.id} type="button" className="wla-game wla-game-photo" onClick={()=>setPlaying(g.id)}>
    <span className="wla-gimg"><GameArt id={g.id}/><span className="wla-game-best">{b?<><Crown size={13}/>{b}</>:`${g.minutes} min`}</span></span>
    <span className="wla-gbody"><strong>{g.name}</strong><small>{g.tagline}</small></span></button>})}</div>
  <button type="button" className="wla-challenge-row wla-client-link" onClick={()=>onView('client')}><Coffee size={20}/><span className="wla-grow"><strong>Client Studio · The café brief</strong><small>Make a decision, write an advert, handle a revision · 5 min</small></span><ArrowRight size={18}/></button>
  <div className="wla-challenge-links" aria-label="Play with friends">
   <button type="button" className="wla-challenge-row" onClick={()=>onView('weekly')}><Trophy size={20}/><span className="wla-grow"><strong>Weekly tournament</strong><small>See this week’s game and leaderboard</small></span><ArrowRight size={18}/></button>
   <button type="button" className="wla-challenge-row" onClick={()=>onView('squad')}><Users size={20}/><span className="wla-grow"><strong>Squad challenge</strong><small>Create a team or join with a code</small></span><ArrowRight size={18}/></button>
   <button type="button" className="wla-challenge-row" onClick={()=>onView('friend')}><Share2 size={20}/><span className="wla-grow"><strong>Challenge a friend</strong><small>Choose a game and share your score</small></span><ArrowRight size={18}/></button>
  </div>
 </div>;
}

function GameScreen({meta,who,beat,tournament,onExit,onAgain}:{meta:GameMeta;who:string;beat?:number;tournament?:boolean;onExit:()=>void;onAgain:()=>void}){
 const [score,setScore]=useState<number|null>(null),[rank,setRank]=useState<number|null>(null);const L=courseLook[meta.track];
 const posted=useRef<Promise<unknown>|null>(null);
 /** Leaving waits for the score to finish saving, so the board never shows an old rank. */
 const exit=async()=>{try{await posted.current}catch{}onExit()};
 const finish=(s:number)=>{const v=Math.max(0,Math.min(100,Math.round(s)));if(who)posted.current=api('/api/games',{method:'POST',body:{action:'score',game:meta.id,score:v}}).then(async r=>{if(tournament&&r.ok){const b=await api<{me:null|{rank:number}}>('/api/games');if(b.ok&&b.data.me)setRank(b.data.me.rank)}});const prev=Number(readLocal(bestKey(who,meta.id))||0);if(v>prev)writeLocal(bestKey(who,meta.id),String(v));writeLocal(playsKey(who),String(Number(readLocal(playsKey(who))||0)+1));markGameDay(who);setScore(v)};
 return <div className="wla-stack wla-game-screen">
  <button type="button" className="wla-back" onClick={exit}><ArrowLeft size={18}/>All games</button>
  <div className={'wla-game-head '+L.cls}><span className="wla-ghead-art"><GameArt id={meta.id}/></span><div><strong>{meta.name}</strong><small>{meta.how}</small></div></div>
  {beat!==undefined&&score===null&&<p className="wla-note"><Crown size={16}/>Your friend scored {beat}. Can you beat it?</p>}
  {tournament&&score===null&&<p className="wla-note"><Trophy size={16}/>This week’s tournament game{who?': your best score this week counts.':'. Sign in to get on the board.'}</p>}
  {score===null?<Game id={meta.id} onDone={finish}/>:<Result meta={meta} score={score} who={who} beat={beat} rank={rank} tournament={!!tournament} onAgain={async()=>{try{await posted.current}catch{}onAgain()}} onExit={exit}/>}
 </div>;
}
function Game({id,onDone}:{id:GameId;onDone:(s:number)=>void}){
 switch(id){case 'hook-hunter':return <HookHunter onDone={onDone}/>;case 'budget-boss':return <BudgetBoss onDone={onDone}/>;case 'bug-hunt':return <BugHunt onDone={onDone}/>;
  case 'build-the-flow':return <OrderGame rounds={flowRounds.map(r=>({title:r.title,items:r.steps,why:r.why}))} noun="screen" onDone={onDone}/>;
  case 'shot-order':return <OrderGame rounds={shotRounds.map(r=>({title:r.title,items:r.frames,why:r.why}))} noun="frame" onDone={onDone}/>;
  case 'guess-the-shot':return <GuessTheShot onDone={onDone}/>;case 'story-dice':return <StoryDice onDone={onDone}/>;default:return <CaptionIt onDone={onDone}/>}
}

function Result({meta,score,who,beat,rank,tournament,onAgain,onExit}:{meta:GameMeta;score:number;who:string;beat?:number;rank?:number|null;tournament?:boolean;onAgain:()=>void;onExit:()=>void}){
 const best=Number(readLocal(bestKey(who,meta.id))||0);const isBest=score>=best&&score>0;
 const text=`I scored ${score}${meta.id==='story-dice'?' completion points':''} in ${meta.name} on WhatsLearn. Can you beat it? Sign in free and play: ${gameLink(meta.id,score)}`;
 return <div className="wla-stack wla-center wla-celebrate">
  {score>=60&&<div className="wla-confetti" aria-hidden="true">{Array.from({length:16},(_,i)=><i key={i} style={{left:`${(i*53)%100}%`,animationDelay:`${(i%6)*0.12}s`,background:['#087A4B','#D5F4DE','#FFB27A','#9FB8FF','#C9A9F2'][i%5]}}/>)}</div>}
  <div className="wla-score"><strong>{score}</strong><small>out of 100</small></div>
  <h2 className="wla-h1 wla-tight">{meta.id==='story-dice'?'Story drafted':score>=80?<>Brilliant. <em>Sharp eye.</em></>:score>=50?<>Good run. <em>Go again?</em></>:<>Warming up. <em>Try once more.</em></>}</h2>
  {meta.id==='story-dice'&&<p className="wla-muted">Completion score: distinct frames and required items, not a rating of creativity or story quality.</p>}
  {beat!==undefined&&<p className={score>beat?'wla-win':'wla-note'}>{score>beat?`You beat your friend’s ${beat}!`:score===beat?`A tie with your friend’s ${beat}.`:`Your friend’s ${beat} still stands.`}</p>}
  <p className="wla-muted">{isBest?'New personal best on this phone.':`Your best: ${best}`}</p>
  {tournament&&(who?<p className="wla-rank"><Trophy size={18}/>{rank?`You’re #${rank} in this week’s tournament`:'Saving your tournament score…'}</p>:<p className="wla-note"><Trophy size={16}/>Sign in to put this score on the weekly board.</p>)}
  <a className="wla-primary wla-full" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener"><Share2 size={18}/>Challenge a friend on WhatsApp</a>
  <button type="button" className="wla-outline wla-full" onClick={onAgain}><RotateCcw size={18}/>Play again</button>
  <button type="button" className="wla-link wla-center" onClick={onExit}>Back to all games</button>
 </div>;
}

function Progress({at,of,label}:{at:number;of:number;label?:string}){return <div className="wla-gprog"><div className="wla-split"><small>{label||`Round ${Math.min(at+1,of)} of ${of}`}</small></div><div className="wla-progress"><span style={{width:`${at*100/of}%`}}/></div></div>}
function Explain({ok,why,onNext,last}:{ok:boolean;why:string;onNext:()=>void;last:boolean}){
 useEffect(()=>{try{navigator.vibrate?.(ok?25:[50,40,50])}catch{}},[ok]);
 return <div className={'wla-explain '+(ok?'ok':'no')} role="status"><strong>{ok?<><Check size={18}/>Correct</>:<><X size={18}/>Not this time</>}</strong><p>{why}</p><button type="button" className="wla-primary wla-full" onClick={onNext}>{last?'See my score':'Next'}</button></div>;
}

function HookHunter({onDone}:{onDone:(s:number)=>void}){
 const feed=useMemo(()=>shuffle(hookFeed),[]);const [i,setI]=useState(0),[right,setRight]=useState(0),[pick,setPick]=useState<boolean|null>(null);
 const start=useRef<number|null>(null);const p=feed[i];
 const answer=(keep:boolean)=>{if(pick!==null)return;setPick(keep);if(keep===p.strong)setRight(r=>r+1)};
 const next=()=>{if(i+1>=feed.length){onDone(right*100/feed.length);return}setI(i+1);setPick(null)};
 return <div className="wla-stack">
  <Progress at={i} of={feed.length}/>
  <div className={'wla-post'+(pick===null?'':pick?' kept':' skipped')} onPointerDown={e=>{start.current=e.clientX}} onPointerUp={e=>{if(start.current===null)return;const dx=e.clientX-start.current;start.current=null;if(Math.abs(dx)>60)answer(dx>0)}}>
   <div className="wla-post-head"><span/><div><strong>local.business</strong><small>Sponsored</small></div></div><p>{p.post}</p>
  </div>
  {pick===null?<div className="wla-split wla-swipe-btns"><button type="button" className="wla-outline" onClick={()=>answer(false)}><X size={18}/>Skip</button><button type="button" className="wla-primary" onClick={()=>answer(true)}><Check size={18}/>Keep</button></div>
  :<Explain ok={pick===p.strong} why={`${p.strong?'Strong hook':'Weak hook'}: ${p.why}`} onNext={next} last={i+1>=feed.length}/>}
  {pick===null&&<p className="wla-muted wla-center">Swipe right to keep, left to skip.</p>}
 </div>;
}

function BudgetBoss({onDone}:{onDone:(s:number)=>void}){
 const [r,setR]=useState(0),[alloc,setAlloc]=useState([1250,1250,1250,1250]),[shown,setShown]=useState<number|null>(null),[scores,setScores]=useState<number[]>([]);
 const round=budgetRounds[r];const total=alloc.reduce((a,b)=>a+b,0);const left=5000-total;
 const change=(k:number,d:number)=>{if(shown!==null)return;const v=alloc[k]+d;if(v<0||(d>0&&left<d))return;setAlloc(alloc.map((x,n)=>n===k?v:x))};
 const check=()=>{const diff=alloc.reduce((s,v,k)=>s+Math.abs(v/50-round.ideal[k]),0);const sc=Math.max(0,Math.round(100-diff));setShown(sc);setScores(scores.concat(sc))};
 const next=()=>{if(r+1>=budgetRounds.length){onDone(scores.reduce((a,b)=>a+b,0)/scores.length);return}setR(r+1);setAlloc([1250,1250,1250,1250]);setShown(null)};
 return <div className="wla-stack">
  <Progress at={r} of={budgetRounds.length}/>
  <div className="wla-card wla-tint"><p className="wla-read"><strong>Goal:</strong> {round.goal}</p></div>
  <div className="wla-budget">{channels.map((c,k)=><div key={c} className="wla-budget-row"><span className="wla-grow"><strong>{c}</strong><span className="wla-cbar"><span style={{width:`${alloc[k]/50}%`}}/></span></span>
   <button type="button" aria-label={`Less on ${c}`} onClick={()=>change(k,-250)} disabled={shown!==null||alloc[k]===0}>−</button><b>₹{alloc[k].toLocaleString('en-IN')}</b><button type="button" aria-label={`More on ${c}`} onClick={()=>change(k,250)} disabled={shown!==null||left<250}>+</button></div>)}</div>
  <p className={left?'wla-note':'wla-muted'}>{left?`₹${left.toLocaleString('en-IN')} left to place`:'All ₹5,000 placed.'}</p>
  {shown===null?<button type="button" className="wla-primary wla-full" disabled={left!==0} onClick={check}>Lock in my budget</button>
  :<div className="wla-explain ok" role="status"><strong>Round score: {shown}/100</strong><p>A strong split: {channels.map((c,k)=>`${c} ${round.ideal[k]}%`).join(' · ')}. {round.why}</p><button type="button" className="wla-primary wla-full" onClick={next}>{r+1>=budgetRounds.length?'See my score':'Next goal'}</button></div>}
 </div>;
}

function BugHunt({onDone}:{onDone:(s:number)=>void}){
 const rounds=useMemo(()=>shuffle(bugRounds),[]);const [r,setR]=useState(0),[left,setLeft]=useState(25),[pick,setPick]=useState<number|null>(null),[total,setTotal]=useState(0);
 const round=rounds[r];const over=pick!==null||left<=0;
 useEffect(()=>{if(over)return;const t=setTimeout(()=>setLeft(s=>s-1),1000);return()=>clearTimeout(t)},[left,over]);
 const tap=(n:number)=>{if(over)return;setPick(n);if(n===round.bug)setTotal(x=>x+12+Math.round(8*left/25))};
 const next=()=>{if(r+1>=rounds.length){onDone(total);return}setR(r+1);setLeft(25);setPick(null)};
 return <div className="wla-stack">
  <Progress at={r} of={rounds.length} label={`Bug ${r+1} of ${rounds.length} · ${round.title}`}/>
  <p className={'wla-timer'+(left<=8&&!over?' low':'')}><Timer size={16}/>{over?'Stopped':`${left}s`}</p>
  <div className="wla-code-lines">{round.lines.map((l,n)=><button key={n} type="button" className={over?(n===round.bug?'bug':n===pick?'wrong':''):''} onClick={()=>tap(n)}><i>{n+1}</i><code>{l}</code></button>)}</div>
  {over?<Explain ok={pick===round.bug} why={(pick===null?'Time’s up. ':'')+`Line ${round.bug+1}: ${round.why}`} onNext={next} last={r+1>=rounds.length}/>:<p className="wla-muted wla-center">Tap the line with the bug. Faster answers score more.</p>}
 </div>;
}

function OrderGame({rounds,noun,onDone}:{rounds:{title:string;items:string[];why:string}[];noun:string;onDone:(s:number)=>void}){
 const [r,setR]=useState(0),[order,setOrder]=useState<string[]>([]),[checked,setChecked]=useState(false),[scores,setScores]=useState<number[]>([]);
 const firstAttempt=useRef<number|null>(null);
 const round=rounds[r];const pool=useMemo(()=>shuffle(round.items),[round]);const full=order.length===round.items.length;
 const right=order.filter((x,n)=>round.items[n]===x).length;
 const check=()=>{if(checked)return;setChecked(true);if(firstAttempt.current===null){firstAttempt.current=right*100/round.items.length;setScores(scores.concat(firstAttempt.current))}};
 const next=()=>{if(r+1>=rounds.length){onDone(scores.reduce((a,b)=>a+b,0)/scores.length);return}firstAttempt.current=null;setR(r+1);setOrder([]);setChecked(false)};
 return <div className="wla-stack">
  <Progress at={r} of={rounds.length} label={`${r+1} of ${rounds.length} · ${round.title}`}/>
  <ol className="wla-order">{round.items.map((_,n)=>{const v=order[n];return <li key={n} className={checked?(v===round.items[n]?'right':'wrong'):''}><i>{n+1}</i>{v?<button type="button" disabled={checked} onClick={()=>setOrder(order.filter(x=>x!==v))}>{v}</button>:<span>Tap a {noun} below</span>}</li>})}</ol>
  {!checked&&<div className="wla-pool">{pool.filter(x=>!order.includes(x)).map(x=><button key={x} type="button" onClick={()=>setOrder(order.concat(x))}>{x}</button>)}</div>}
  {!checked?<button type="button" className="wla-primary wla-full" disabled={!full} onClick={check}>Check my order</button>
  :<div className={'wla-explain '+(right===round.items.length?'ok':'no')} role="status"><strong>{right} of {round.items.length} in the right place</strong><p>Best order: {round.items.join(' → ')}</p><p>{round.why}</p>{right!==round.items.length&&<><button type="button" className="wla-outline wla-full" onClick={()=>{setOrder([]);setChecked(false)}}>Retry this round</button><small>Practice freely. Your first attempt counts toward this run’s score.</small></>}<button type="button" className="wla-primary wla-full" onClick={next}>{r+1>=rounds.length?'See my score':'Next'}</button></div>}
 </div>;
}

/** A drawn film frame: the same figure at different sizes shows each shot type. */
function Frame({type}:{type:number}){const t=shotTypes[type];const s=t.scale;
 return <svg className="wla-frame" viewBox="0 0 300 190" role="img" aria-label="A film frame showing a person">
  <rect width="300" height="190" fill="#DCE9E2"/><rect y="132" width="300" height="58" fill="#C6D9CE"/>
  <g transform={`translate(${t.ots?185:150} ${t.ty}) scale(${s})`}>
   <circle cx="0" cy="-55" r="22" fill="#2E4A3B"/><path d="M-45 40 Q-40 -25 0 -28 Q40 -25 45 40 Z" fill="#2E4A3B"/>
   {s>=2&&<><circle cx="-8" cy="-58" r="2.6" fill="#DCE9E2"/><circle cx="8" cy="-58" r="2.6" fill="#DCE9E2"/></>}
  </g>
  {t.ots&&<g><circle cx="40" cy="70" r="55" fill="#1B2E24" opacity=".85"/><path d="M-30 190 Q-10 100 60 110 Q110 120 120 190 Z" fill="#1B2E24" opacity=".85"/></g>}
  <rect x="2" y="2" width="296" height="186" fill="none" stroke="#0C3825" strokeWidth="4"/>
 </svg>;
}
function GuessTheShot({onDone}:{onDone:(s:number)=>void}){
 const [r,setR]=useState(0),[pick,setPick]=useState<number|null>(null),[right,setRight]=useState(0);const type=shotQuiz[r];
 const options=useMemo(()=>shuffle([type,...shuffle(shotTypes.map((_,n)=>n).filter(n=>n!==type)).slice(0,3)]),[type]);
 const answer=(n:number)=>{if(pick!==null)return;setPick(n);if(n===type)setRight(x=>x+1)};
 const next=()=>{if(r+1>=shotQuiz.length){onDone(right*100/shotQuiz.length);return}setR(r+1);setPick(null)};
 return <div className="wla-stack">
  <Progress at={r} of={shotQuiz.length}/>
  <Frame type={type}/>
  <div className="wla-options">{options.map(n=><button key={n} type="button" disabled={pick!==null} className={'wla-option'+(pick!==null&&n===type?' on':'')+(pick===n&&n!==type?' off':'')} onClick={()=>answer(n)}><span>{shotTypes[n].name}</span></button>)}</div>
  {pick!==null&&<Explain ok={pick===type} why={`This is a ${shotTypes[type].name.toLowerCase()}. ${['It shows the whole place and how small the person is in it.','It frames the person from the waist up, good for conversation.','It fills the frame with the face to show emotion.','It shows one detail, like the eyes, for intensity.','It looks past one person’s shoulder at another, common in dialogue.'][type]}`} onNext={next} last={r+1>=shotQuiz.length}/>}
 </div>;
}

const diceIcons:Record<string,React.ComponentType<{size?:number}>>={coffee:Coffee,bike:Bike,umbrella:Umbrella,phone:Smartphone,key:Key,dog:Dog,rocket:Rocket,book:Book,music:Music,camera:Camera,tree:TreePine,cake:Cake};
const synonyms:Record<string,string[]>={coffee:['coffee','chai','cup','tea'],bike:['bike','cycle','scooter','ride'],umbrella:['umbrella','rain'],phone:['phone','mobile','call','message'],key:['key','lock','door'],dog:['dog','puppy','pup'],rocket:['rocket','space','launch'],book:['book','read','page','novel'],music:['music','song','sing','tune'],camera:['camera','photo','picture','film'],tree:['tree','branch','leaf','forest'],cake:['cake','bake','birthday','dessert']};
function StoryDice({onDone}:{onDone:(s:number)=>void}){
 const roll=()=>shuffle(diceItems).slice(0,3);const [items,setItems]=useState<string[]>(roll),[rerolls,setRerolls]=useState(1),[frames,setFrames]=useState(['','','']);
 const all=frames.join(' ').toLowerCase();const used=items.map(it=>synonyms[it].some(w=>all.includes(w)));
 // A frame counts when it has at least 6 words and is not a copy of another frame.
 const norm=frames.map(f=>f.trim().toLowerCase().replace(/\s+/g,' '));const filled=frames.map((f,n)=>f.trim().split(/\s+/).filter(Boolean).length>=6&&norm.indexOf(norm[n])===n);
 const score=filled.filter(Boolean).length*20+used.filter(Boolean).length*(40/3);
 return <div className="wla-stack">
  <p className="wla-muted">Completion checks, not a creativity rating: 60 points for three distinct frames of 6+ words, 40 for using the rolled items.</p>
  <div className="wla-dice">{items.map(it=>{const I=diceIcons[it];return <span key={it}><I size={30}/><small>{it}</small></span>})}</div>
  <button type="button" className="wla-ghost" disabled={!rerolls} onClick={()=>{setItems(roll());setRerolls(0)}}><Dices size={18}/>{rerolls?'Roll again (1 left)':'No rolls left'}</button>
  {['Beginning: who wants what?','Change: what happens?','Ending: how does it land?'].map((label,n)=><div key={n} className="wla-field"><label htmlFor={'sd'+n}>Frame {n+1} · {label}</label><textarea id={'sd'+n} rows={2} maxLength={200} value={frames[n]} onChange={e=>setFrames(frames.map((f,k)=>k===n?e.target.value:f))}/></div>)}
  <ul className="wla-checklist">{filled.map((f,n)=><li key={'f'+n} className={f?'met':''}>{f?<Check size={14}/>:'•'} Frame {n+1} has 6+ words of its own</li>)}{items.map((it,n)=><li key={it} className={used[n]?'met':''}>{used[n]?<Check size={14}/>:'•'} Uses the {it}</li>)}</ul>
  <button type="button" className="wla-primary wla-full" disabled={!filled.some(Boolean)} onClick={()=>onDone(score)}>Finish my story</button>
 </div>;
}

function CaptionIt({onDone}:{onDone:(s:number)=>void}){
 const [r,setR]=useState(0),[pick,setPick]=useState<number|null>(null),[right,setRight]=useState(0);const round=captionRounds[r];
 const order=useMemo(()=>shuffle(round.options.map((_,n)=>n)),[round]);
 const answer=(n:number)=>{if(pick!==null)return;setPick(n);if(n===round.best)setRight(x=>x+1)};
 const next=()=>{if(r+1>=captionRounds.length){onDone(right*100/captionRounds.length);return}setR(r+1);setPick(null)};
 return <div className="wla-stack">
  <Progress at={r} of={captionRounds.length}/>
  <div className="wla-scene"><Camera size={22}/><p>{round.scene}</p></div>
  <div className="wla-options">{order.map(n=><button key={n} type="button" disabled={pick!==null} className={'wla-option'+(pick!==null&&n===round.best?' on':'')+(pick===n&&n!==round.best?' off':'')} onClick={()=>answer(n)}><span>{round.options[n]}</span></button>)}</div>
  {pick!==null&&<Explain ok={pick===round.best} why={round.why} onNext={next} last={r+1>=captionRounds.length}/>}
 </div>;
}

function daysLeft(endsAt:string){const ms=new Date(endsAt).getTime()-Date.now();const d=Math.max(0,Math.ceil(ms/864e5));return d<=1?'ends tonight':`${d} days left`}
/** The weekly tournament: one game for everyone, best score of the week counts. */
function Tournament({board,error,who,onPlay,onSignIn}:{board:Board|null;error:string;who:string;onPlay:(id:GameId)=>void;onSignIn?:()=>void}){
 const [all,setAll]=useState(false);
 if(!board)return error?<p className="wla-note">{error}</p>:<div className="wla-card wla-skel" aria-busy="true">Loading this week’s tournament…</div>;
 const meta=games.find(g=>g.id===board.game)!;const L=courseLook[meta.track];const rows=all?board.top:board.top.slice(0,3);
 return <section className="wla-tourney" aria-labelledby="wla-tourney-t">
  <div className="wla-split"><p className="wla-kicker"><Trophy size={14}/> WEEKLY TOURNAMENT · {daysLeft(board.endsAt).toUpperCase()}</p>{board.players>0&&<small className="wla-muted">{board.players} playing</small>}</div>
  <h3 id="wla-tourney-t" className="wla-h2">{meta.name}</h3>
  {board.me?<p className="wla-tourney-me">You’re <strong>#{board.me.rank}</strong> with {board.me.score}</p>:<p className="wla-muted">{who?'Play once to get on the board. Your best score this week counts.':'Sign in to get on the board.'}</p>}
  {rows.length?<ol className="wla-board">{rows.map(r=><li key={r.rank} className={r.me?'me':''}><span className={'wla-medal m'+r.rank}>{r.rank}</span><span className="wla-grow">{r.name}{r.me?' (you)':''}</span><b>{r.score}</b></li>)}</ol>:<p className="wla-muted">No scores yet this week. Be the first.</p>}
  {board.top.length>3&&<button type="button" className="wla-link" onClick={()=>setAll(!all)}>{all?'Show top 3':'See top 10'}</button>}
  <div className="wla-row-btns"><button type="button" className={'wla-primary '+L.cls} onClick={()=>onPlay(meta.id)}>Play {meta.name}</button>{!who&&onSignIn&&<button type="button" className="wla-outline" onClick={onSignIn}>Sign in</button>}</div>
 </section>;
}
/** Squads: up to five friends; their best tournament scores this week add up to a team score. */
function Squad({board,who,joinCode,onChanged,onSignIn}:{board:Board|null;who:string;joinCode?:string;onChanged:()=>Promise<void>|void;onSignIn?:()=>void}){
 const [name,setName]=useState(''),[code,setCode]=useState(joinCode||''),[busy,setBusy]=useState(false),[msg,setMsg]=useState(''),[copied,setCopied]=useState(false);
 useEffect(()=>{if(joinCode)setCode(joinCode)},[joinCode]);
 const act=async(body:Record<string,string>)=>{if(busy)return;setBusy(true);setMsg('');try{const r=await api<{error?:string}>('/api/games',{method:'POST',body});if(!r.ok){setMsg(r.data.error||'That did not work.');return}setName('');setCode('');if(body.action!=='leave')writeLocal('wla-squad-invite','');await onChanged()}finally{setBusy(false)}};
 if(!who)return <section className="wla-card wla-squad"><strong><Users size={18}/> Squad challenge</strong><p className="wla-muted">Team up with up to 5 friends. Your best scores in the weekly game add up to one team score.{joinCode?` You were invited to squad ${joinCode}.`:''}</p>{onSignIn&&<button type="button" className="wla-primary wla-full" onClick={onSignIn}>Sign in to {joinCode?'join':'start'} a squad</button>}</section>;
 if(!board)return <div className="wla-card" role="status">Loading your squad…</div>;
 const sq=board.squad;
 if(sq){const link=`https://whatslearn.in/app?squad=${sq.code}`;const text=`Join my WhatsLearn squad “${sq.name}”. We play one game a week and our scores add up: ${link}`;
  return <section className="wla-card wla-squad">
   <div className="wla-split"><strong><Users size={18}/> {sq.name}</strong><span className="wla-badge-pill">#{sq.rank} · {sq.total} pts</span></div>
   <ol className="wla-board">{sq.members.map((m,i)=><li key={i} className={m.me?'me':''}><span className="wla-medal">{i+1}</span><span className="wla-grow">{m.name}{m.me?' (you)':''}</span><b>{m.score||'—'}</b></li>)}</ol>
   {sq.members.length<5&&<p className="wla-muted">{5-sq.members.length} spot{5-sq.members.length===1?'':'s'} left. Code <strong>{sq.code}</strong></p>}
   <a className="wla-primary wla-full" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener"><Share2 size={18}/>Invite friends on WhatsApp</a>
   <div className="wla-row-btns"><button type="button" className="wla-ghost" onClick={async()=>{try{await navigator.clipboard.writeText(sq.code);setCopied(true)}catch{}}}><Copy size={16}/>{copied?'Copied':'Copy code'}</button><button type="button" className="wla-ghost" disabled={busy} onClick={()=>act({action:'leave'})}><LogOut size={16}/>Leave</button></div>
   {msg&&<p className="wla-error" role="alert">{msg}</p>}
   {board&&board.squads.length>1&&<><p className="wla-kicker">TOP SQUADS THIS WEEK</p><ol className="wla-board">{board.squads.slice(0,5).map(s=><li key={s.rank} className={s.name===sq.name?'me':''}><span className={'wla-medal m'+s.rank}>{s.rank}</span><span className="wla-grow">{s.name}<small> · {s.members}</small></span><b>{s.total}</b></li>)}</ol></>}
  </section>}
 return <section className="wla-card wla-squad">
  <strong><Users size={18}/> Squad challenge</strong>
  <p className="wla-muted">Team up with up to 5 friends. Your best scores in this week’s game add up to one team score.</p>
  <form className="wla-field" onSubmit={e=>{e.preventDefault();if(!busy&&code.length===6)void act({action:'join',code})}}><label htmlFor="wla-sq-code">Join with a code</label><div className="wla-inline"><input id="wla-sq-code" value={code} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6))} placeholder="Six-character code" maxLength={6} autoCapitalize="characters" autoComplete="off" spellCheck={false}/><button type="submit" className="wla-primary" disabled={busy||code.length!==6}>Join</button></div></form>
  <form className="wla-field" onSubmit={e=>{e.preventDefault();if(!busy&&name.trim().length>=2)void act({action:'create',name:name.trim()})}}><label htmlFor="wla-sq-name">Or create a squad</label><div className="wla-inline"><input id="wla-sq-name" value={name} onChange={e=>setName(e.target.value)} placeholder="Squad name" maxLength={30}/><button type="submit" className="wla-outline" disabled={busy||name.trim().length<2}>Create</button></div></form>
  {msg&&<p className="wla-error" role="alert">{msg}</p>}
  {board&&board.squads.length>0&&<><p className="wla-kicker">TOP SQUADS THIS WEEK</p><ol className="wla-board">{board.squads.slice(0,3).map(s=><li key={s.rank}><span className={'wla-medal m'+s.rank}>{s.rank}</span><span className="wla-grow">{s.name}<small> · {s.members}</small></span><b>{s.total}</b></li>)}</ol></>}
 </section>;
}
