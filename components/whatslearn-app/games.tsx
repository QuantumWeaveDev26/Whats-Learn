'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,X,Timer,Share2,RotateCcw,Crown,Dices,Trophy,Users,LogOut,Copy,Coffee,Bike,Umbrella,Smartphone,Key,Dog,Rocket,Book,Music,Camera,TreePine,Cake} from 'lucide-react';
import {api,readLocal,writeLocal} from './api';
import {appTranslator} from './app-language';
import {markGameDay} from './rewards';
import {courseLook} from './tabs';
import {GameArt} from './game-art';
import {ClientMission} from './client-mission';
import {useGameDeck,nextGameRun,type GameRun,type ShotCard,type StoryPrompt} from './game-decks';
import {games,hookFeed,channels,budgetRounds,bugRounds,shotTypes,shotQuiz,diceItems,captionRounds,type GameId,type GameMeta} from './games-data';

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
export function GamesHub({who,track,challenge,onChallengeDone,joinCode,onSignIn,view,onView,language='en'}:{who:string;track?:string;challenge?:Challenge|null;onChallengeDone:()=>void;joinCode?:string;onSignIn?:()=>void;view:PlayView;onView:(view:PlayView)=>void;language?:string}){
 const t=appTranslator(language);
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
  return <GameScreen language={language} key={playing+tick} meta={meta} who={who} beat={beat} tournament={board?.game===meta.id} onExit={()=>{setPlaying(null);setBeat(undefined);onView('games');onChallengeDone();void loadBoard()}} onAgain={()=>setTick(t=>t+1)}/>}
 if(view==='client')return <ClientMission language={language} key={who||'guest'} who={who} onBack={()=>onView('games')}/>;
 if(view!=='games')return <div className="wla-stack wla-challenge-screen">
  <button type="button" className="wla-back" onClick={()=>onView('games')}><ArrowLeft size={18}/>{t("All games")}</button>
  <div><h2 ref={heading} tabIndex={-1} className="wla-h1">{view==='weekly'?t("Weekly tournament"):view==='squad'?t("Squad challenge"):t("Challenge a friend")}</h2><p className="wla-muted">{view==='friend'?t("Choose a game, finish a round, then share your score with a friend."):view==='squad'?t("Create a squad or join your friends with their six-character code."):t("One game each week. Your best score counts.")}</p></div>
  {view==='friend'?<div className="wla-challenge-games">{games.map(g=><button type="button" key={g.id} className="wla-challenge-row" onClick={()=>setPlaying(g.id)}><span className="wla-ghead-art"><GameArt id={g.id}/></span><span className="wla-grow"><strong>{t(g.name)}</strong><small>{g.minutes} {t("min ·")}{' '}{t(g.tagline)}</small></span><ArrowRight size={18}/></button>)}</div>
   :view==='weekly'?<Tournament language={language} board={board} error={boardErr} who={who} onPlay={id=>setPlaying(id)} onSignIn={onSignIn}/>
   :boardErr?<div className="wla-card"><p className="wla-error" role="alert">{boardErr}</p><button type="button" className="wla-outline wla-full" onClick={()=>void loadBoard()}>{t("Try again")}</button></div>:<Squad language={language} board={board} who={who} joinCode={joinCode} onChanged={loadBoard} onSignIn={onSignIn}/>}
 </div>;
 const today=todaysGame(filter==='all'?track:filter);
 // Games come first, each with its own bright illustration, so every card invites a tap.
 return <div className="wla-stack">
  <div><h2 className="wla-h1 wla-tight">{t("Play a little.")}<em>{t("Learn a lot.")}</em></h2><p className="wla-muted">{t("Quick 1–2 minute games from each course.")}{' '}{plays?`${plays} game${plays===1?'':'s'} played on this phone.`:t("Beat your best, then challenge a friend.")}</p></div>
  <button type="button" className="wla-today wla-today-compact" onClick={()=>setPlaying(today.id)}>
   <span className="wla-today-art"><GameArt id={today.id}/></span>
   <span className="wla-today-details"><span className="wla-today-label">{t("TODAY’S GAME")}</span><strong>{t(today.name)}</strong><small>{t(today.tagline)}</small>
    <span className="wla-today-bottom"><small>{best(today.id)?t("Best {0}",[best(today.id)]):t("{0} min · Not played yet",[today.minutes])}</small><span className="wla-today-play">{t("Play")}<ArrowRight size={14}/></span></span></span>
  </button>
  <div className="wla-game-filters" role="group" aria-label={t("Filter games by course")}>{[['all','All courses'],['marketing','Marketing'],['development','Development'],['filmmaking','Filmmaking'],['storytelling','Storytelling']].map(([id,label])=><button type="button" key={id} aria-pressed={filter===id} onClick={()=>setFilter(id)}>{t(label)}</button>)}</div>
  <div className="wla-games">{games.filter(g=>filter==='all'||g.track===filter).map(g=>{const b=best(g.id);
   return <button key={g.id} type="button" className="wla-game wla-game-photo" onClick={()=>setPlaying(g.id)}>
    <span className="wla-gimg"><GameArt id={g.id}/><span className="wla-game-best">{b?<><Crown size={13}/>{b}</>:t("{0} min",[g.minutes])}</span></span>
    <span className="wla-gbody"><strong>{t(g.name)}</strong><small>{t(g.tagline)}</small></span></button>})}</div>
  <button type="button" className="wla-challenge-row wla-client-link" onClick={()=>onView('client')}><Coffee size={20}/><span className="wla-grow"><strong>{t("Client Studio · The café brief")}</strong><small>{t("Make a decision, write an advert, handle a revision · 5 min")}</small></span><ArrowRight size={18}/></button>
  <div className="wla-challenge-links" aria-label={t("Play with friends")}>
   <button type="button" className="wla-challenge-row" onClick={()=>onView('weekly')}><Trophy size={20}/><span className="wla-grow"><strong>{t("Weekly tournament")}</strong><small>{t("See this week’s game and leaderboard")}</small></span><ArrowRight size={18}/></button>
   <button type="button" className="wla-challenge-row" onClick={()=>onView('squad')}><Users size={20}/><span className="wla-grow"><strong>{t("Squad challenge")}</strong><small>{t("Create a team or join with a code")}</small></span><ArrowRight size={18}/></button>
   <button type="button" className="wla-challenge-row" onClick={()=>onView('friend')}><Share2 size={20}/><span className="wla-grow"><strong>{t("Challenge a friend")}</strong><small>{t("Choose a game and share your score")}</small></span><ArrowRight size={18}/></button>
  </div>
 </div>;
}

function GameScreen({meta,who,beat,tournament,onExit,onAgain,language='en'}:{meta:GameMeta;who:string;beat?:number;tournament?:boolean;onExit:()=>void;onAgain:()=>void;language?:string}){
 const t=appTranslator(language);
 const run=useGameDeck(meta.id,who);
 const [score,setScore]=useState<number|null>(null),[rank,setRank]=useState<number|null>(null);const L=courseLook[meta.track];
 const posted=useRef<Promise<unknown>|null>(null);
 /** Leaving waits for the score to finish saving, so the board never shows an old rank. */
 const exit=async()=>{try{await posted.current}catch{}onExit()};
 const finish=(s:number)=>{const v=Math.max(0,Math.min(100,Math.round(s)));if(who)posted.current=api('/api/games',{method:'POST',body:{action:'score',game:meta.id,score:v},timeoutMs:10000}).then(async r=>{if(tournament&&r.ok){const b=await api<{me:null|{rank:number}}>('/api/games',{timeoutMs:10000});if(b.ok&&b.data.me)setRank(b.data.me.rank)}}).catch(()=>{});const prev=Number(readLocal(bestKey(who,meta.id))||0);if(v>prev)writeLocal(bestKey(who,meta.id),String(v));writeLocal(playsKey(who),String(Number(readLocal(playsKey(who))||0)+1));markGameDay(who);setScore(v)};
 return <div className="wla-stack wla-game-screen">
  <button type="button" className="wla-back" onClick={exit}><ArrowLeft size={18}/>{t("All games")}</button>
  <div className={'wla-game-head '+L.cls}><span className="wla-ghead-art"><GameArt id={meta.id}/></span><div><strong>{t(meta.name)}</strong><small>{t(meta.how)}</small></div></div>
  {beat!==undefined&&score===null&&<p className="wla-note"><Crown size={16}/>{t("Your friend scored")}{' '}{beat}{t(". Can you beat it?")}</p>}
  {tournament&&score===null&&<p className="wla-note"><Trophy size={16}/>{t("This week’s tournament game")}{who?t(": your best score this week counts."):t(". Sign in to get on the board.")}</p>}
  {score===null?<Game language={language} run={run} who={who} onDone={finish}/>:<Result language={language} meta={meta} score={score} who={who} beat={beat} rank={rank} tournament={!!tournament} onAgain={onAgain} onExit={exit}/>}
 </div>;
}
function Game({run,who,onDone,language='en'}:{run:GameRun;who:string;onDone:(s:number)=>void;language?:string}){
 const t=appTranslator(language);
 switch(run.id){case 'hook-hunter':return <HookHunter language={language} feed={run.rounds} onDone={onDone}/>;case 'budget-boss':return <BudgetBoss language={language} rounds={run.rounds} onDone={onDone}/>;case 'bug-hunt':return <BugHunt language={language} rounds={run.rounds} onDone={onDone}/>;
  case 'build-the-flow':return <OrderGame language={language} rounds={run.rounds} noun="screen" onDone={onDone}/>;
  case 'shot-order':return <OrderGame language={language} rounds={run.rounds} noun="frame" onDone={onDone}/>;
  case 'guess-the-shot':return <GuessTheShot language={language} cards={run.rounds} onDone={onDone}/>;case 'story-dice':return <StoryDice language={language} prompt={run.rounds[0]} onRoll={()=>nextGameRun('story-dice',who).rounds[0]} onDone={onDone}/>;default:return <CaptionIt language={language} rounds={run.rounds} onDone={onDone}/>}
}

function Result({meta,score,who,beat,rank,tournament,onAgain,onExit,language='en'}:{meta:GameMeta;score:number;who:string;beat?:number;rank?:number|null;tournament?:boolean;onAgain:()=>void;onExit:()=>void;language?:string}){
 const t=appTranslator(language);
 const best=Number(readLocal(bestKey(who,meta.id))||0);const isBest=score>=best&&score>0;
 const text=`I scored ${score}${meta.id==='story-dice'?' completion points':''} in ${meta.name} on WhatsLearn. Can you beat it? Sign in free and play: ${gameLink(meta.id,score)}`;
 return <div className="wla-stack wla-center wla-celebrate">
  {score>=60&&<div className="wla-confetti" aria-hidden="true">{Array.from({length:16},(_,i)=><i key={i} style={{left:`${(i*53)%100}%`,animationDelay:`${(i%6)*0.12}s`,background:['#087A4B','#D5F4DE','#FFB27A','#9FB8FF','#C9A9F2'][i%5]}}/>)}</div>}
  <div className="wla-score"><strong>{score}</strong><small>{t("out of 100")}</small></div>
  <h2 className="wla-h1 wla-tight">{meta.id==='story-dice'?t("Story drafted"):score>=80?<>{t("Brilliant.")}{' '}<em>{t("Sharp eye.")}</em></>:score>=50?<>{t("Good run.")}{' '}<em>{t("Go again?")}</em></>:<>{t("Warming up.")}{' '}<em>{t("Try once more.")}</em></>}</h2>
  {meta.id==='story-dice'&&<p className="wla-muted">{t("Completion score: distinct frames and required items, not a rating of creativity or story quality.")}</p>}
  {beat!==undefined&&<p className={score>beat?'wla-win':'wla-note'}>{score>beat?t("You beat your friend’s {0}!",[beat]):score===beat?t("A tie with your friend’s {0}.",[beat]):t("Your friend’s {0} still stands.",[beat])}</p>}
  <p className="wla-muted">{isBest?t("New personal best on this phone."):t("Your best: {0}",[best])}</p>
  {tournament&&(who?<p className="wla-rank"><Trophy size={18}/>{rank?t("You’re #{0} in this week’s tournament",[rank]):t("Saving your tournament score…")}</p>:<p className="wla-note"><Trophy size={16}/>{t("Sign in to put this score on the weekly board.")}</p>)}
  <a className="wla-primary wla-full" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener"><Share2 size={18}/>{t("Challenge a friend on WhatsApp")}</a>
  <button type="button" className="wla-outline wla-full" onClick={onAgain}><RotateCcw size={18}/>{t("Play again")}</button>
  <button type="button" className="wla-link wla-center" onClick={onExit}>{t("Back to all games")}</button>
 </div>;
}

function Progress({at,of,label,language='en'}:{at:number;of:number;label?:string;language?:string}){
 const t=appTranslator(language);return <div className="wla-gprog"><div className="wla-split"><small>{label||`${t("Round")} ${Math.min(at+1,of)} ${t("of")} ${of}`}</small></div><div className="wla-progress"><span style={{width:`${at*100/of}%`}}/></div></div>}
function Explain({ok,why,onNext,last,language='en'}:{ok:boolean;why:string;onNext:()=>void;last:boolean;language?:string}){
 const t=appTranslator(language);
 useEffect(()=>{try{navigator.vibrate?.(ok?25:[50,40,50])}catch{}},[ok]);
 return <div className={'wla-explain '+(ok?'ok':'no')} role="status"><strong>{ok?<><Check size={18}/>{t("Correct")}</>:<><X size={18}/>{t("Not this time")}</>}</strong><p>{t(why)}</p><button type="button" className="wla-primary wla-full" onClick={onNext}>{last?t("See my score"):t("Next")}</button></div>;
}

function HookHunter({onDone,feed:provided=hookFeed,language='en'}:{onDone:(s:number)=>void;feed?:typeof hookFeed;language?:string}){
 const t=appTranslator(language);
 const feed=useMemo(()=>shuffle(provided),[provided]);const [i,setI]=useState(0),[right,setRight]=useState(0),[pick,setPick]=useState<boolean|null>(null);
 const start=useRef<number|null>(null);const p=feed[i];
 const answer=(keep:boolean)=>{if(pick!==null)return;setPick(keep);if(keep===p.strong)setRight(r=>r+1)};
 const next=()=>{if(i+1>=feed.length){onDone(right*100/feed.length);return}setI(i+1);setPick(null)};
 return <div className="wla-stack">
  <Progress language={language} at={i} of={feed.length}/>
  <div className={'wla-post'+(pick===null?'':pick?' kept':' skipped')} onPointerDown={e=>{start.current=e.clientX}} onPointerUp={e=>{if(start.current===null)return;const dx=e.clientX-start.current;start.current=null;if(Math.abs(dx)>60)answer(dx>0)}}>
   <div className="wla-post-head"><span/><div><strong>{t("local.business")}</strong><small>{t("Sponsored")}</small></div></div><p>{t(p.post)}</p>
  </div>
  {pick===null?<div className="wla-split wla-swipe-btns"><button type="button" className="wla-outline" onClick={()=>answer(false)}><X size={18}/>{t("Skip")}</button><button type="button" className="wla-primary" onClick={()=>answer(true)}><Check size={18}/>{t("Keep")}</button></div>
  :<Explain language={language} ok={pick===p.strong} why={t(p.why)} onNext={next} last={i+1>=feed.length}/>}
  {pick===null&&<p className="wla-muted wla-center">{t("Swipe right to keep, left to skip.")}</p>}
 </div>;
}

function BudgetBoss({onDone,rounds=budgetRounds,language='en'}:{onDone:(s:number)=>void;rounds?:typeof budgetRounds;language?:string}){
 const t=appTranslator(language);
 const [r,setR]=useState(0),[alloc,setAlloc]=useState([1250,1250,1250,1250]),[shown,setShown]=useState<number|null>(null),[scores,setScores]=useState<number[]>([]);
 const round=rounds[r];const total=alloc.reduce((a,b)=>a+b,0);const left=5000-total;
 const change=(k:number,d:number)=>{if(shown!==null)return;const v=alloc[k]+d;if(v<0||(d>0&&left<d))return;setAlloc(alloc.map((x,n)=>n===k?v:x))};
 const check=()=>{const diff=alloc.reduce((s,v,k)=>s+Math.abs(v/50-round.ideal[k]),0);const sc=Math.max(0,Math.round(100-diff));setShown(sc);setScores(scores.concat(sc))};
 const next=()=>{if(r+1>=rounds.length){onDone(scores.reduce((a,b)=>a+b,0)/scores.length);return}setR(r+1);setAlloc([1250,1250,1250,1250]);setShown(null)};
 return <div className="wla-stack">
  <Progress language={language} at={r} of={rounds.length}/>
  <div className="wla-card wla-tint"><p className="wla-read"><strong>{t("Goal:")}</strong> {t(round.goal)}</p></div>
  <div className="wla-budget">{channels.map((c,k)=><div key={c} className="wla-budget-row"><span className="wla-grow"><strong>{t(c)}</strong><span className="wla-cbar"><span style={{width:`${alloc[k]/50}%`}}/></span></span>
   <button type="button" aria-label={t("Less on {0}",[c])} onClick={()=>change(k,-250)} disabled={shown!==null||alloc[k]===0}>−</button><b>₹{alloc[k].toLocaleString('en-IN')}</b><button type="button" aria-label={t("More on {0}",[c])} onClick={()=>change(k,250)} disabled={shown!==null||left<250}>+</button></div>)}</div>
  <p className={left?'wla-note':'wla-muted'}>{left?t("₹{0} left to place",[left.toLocaleString('en-IN')]):t("All ₹5,000 placed.")}</p>
  {shown===null?<button type="button" className="wla-primary wla-full" disabled={left!==0} onClick={check}>{t("Lock in my budget")}</button>
  :<div className="wla-explain ok" role="status"><strong>{t("Round score:")}{' '}{shown}/100</strong><p>{t("A strong split:")}{' '}{channels.map((c,k)=>`${t(c)} ${round.ideal[k]}%`).join(' · ')}. {t(round.why)}</p><button type="button" className="wla-primary wla-full" onClick={next}>{r+1>=rounds.length?t("See my score"):t("Next goal")}</button></div>}
 </div>;
}

function BugHunt({onDone,rounds:provided=bugRounds,language='en'}:{onDone:(s:number)=>void;rounds?:typeof bugRounds;language?:string}){
 const t=appTranslator(language);
 const rounds=useMemo(()=>shuffle(provided),[provided]);const [r,setR]=useState(0),[left,setLeft]=useState(25),[pick,setPick]=useState<number|null>(null),[total,setTotal]=useState(0);
 const round=rounds[r];const over=pick!==null||left<=0;
 useEffect(()=>{if(over)return;const t=setTimeout(()=>setLeft(s=>s-1),1000);return()=>clearTimeout(t)},[left,over]);
 const tap=(n:number)=>{if(over)return;setPick(n);if(n===round.bug)setTotal(x=>x+12+Math.round(8*left/25))};
 const next=()=>{if(r+1>=rounds.length){onDone(total);return}setR(r+1);setLeft(25);setPick(null)};
 return <div className="wla-stack">
  <Progress language={language} at={r} of={rounds.length} label={t("Bug {0} of {1} · {2}",[r+1,rounds.length,t(round.title)])}/>
  <p className={'wla-timer'+(left<=8&&!over?' low':'')}><Timer size={16}/>{over?t("Stopped"):t("{0} seconds",[left])}</p>
  <div className="wla-code-lines">{round.lines.map((l,n)=><button key={n} type="button" className={over?(n===round.bug?'bug':n===pick?'wrong':''):''} onClick={()=>tap(n)}><i>{n+1}</i><code>{l}</code></button>)}</div>
  {over?<Explain language={language} ok={pick===round.bug} why={(pick===null?t("Time’s up.")+" ":"")+t("Line {0}: {1}",[round.bug+1,t(round.why)])} onNext={next} last={r+1>=rounds.length}/>:<p className="wla-muted wla-center">{t("Tap the line with the bug. Faster answers score more.")}</p>}
 </div>;
}

function OrderGame({rounds,noun,onDone,language='en'}:{rounds:{title:string;items:string[];why:string}[];noun:string;onDone:(s:number)=>void;language?:string}){
 const t=appTranslator(language);
 const [r,setR]=useState(0),[order,setOrder]=useState<string[]>([]),[checked,setChecked]=useState(false),[scores,setScores]=useState<number[]>([]);
 const firstAttempt=useRef<number|null>(null);
 const retryCount=useRef(0);
 const round=rounds[r];const pool=useMemo(()=>shuffle(round.items),[round]);const full=order.length===round.items.length;
 const right=order.filter((x,n)=>round.items[n]===x).length;
 const check=()=>{if(checked)return;setChecked(true);if(firstAttempt.current===null){firstAttempt.current=right*100/round.items.length;setScores(scores.concat(firstAttempt.current))}};
 const next=()=>{if(r+1>=rounds.length){onDone(scores.reduce((a,b)=>a+b,0)/scores.length);return}firstAttempt.current=null;retryCount.current=0;setR(r+1);setOrder([]);setChecked(false)};
 return <div className="wla-stack">
  <Progress language={language} at={r} of={rounds.length} label={t("{0} of {1} · {2}",[r+1,rounds.length,t(round.title)])}/>
  <ol className="wla-order">{round.items.map((_,n)=>{const v=order[n];return <li key={n} className={checked?(v===round.items[n]?'right':'wrong'):''}><i>{n+1}</i>{v?<button type="button" disabled={checked} onClick={()=>setOrder(order.filter(x=>x!==v))}>{t(v)}</button>:<span>{t("Tap a {0} below",[t(noun)])}</span>}</li>})}</ol>
  {!checked&&<div className="wla-pool">{pool.filter(x=>!order.includes(x)).map(x=><button key={x} type="button" onClick={()=>setOrder(order.concat(x))}>{t(x)}</button>)}</div>}
  {!checked?<button type="button" className="wla-primary wla-full" disabled={!full} onClick={check}>{t("Check my order")}</button>
  :<section className="wla-card wla-order-result" aria-label={t("Round result")}><strong className={right===round.items.length?'wla-order-match':'wla-order-miss'} role="status">{t("{0} of {1} in the expected position",[right,round.items.length])}</strong><p className="wla-order-answer-title">{t("Reference order")}</p><ol className="wla-reference-order">{round.items.map(item=><li key={item}>{t(item)}</li>)}</ol><details className="wla-disclosure"><summary>{t("Why this order?")}</summary><p className="wla-read">{t(round.why)}</p></details><small className="wla-muted">{retryCount.current?t("Scored first attempt: {0}/{1}. This retry is practice.",[Math.round((firstAttempt.current||0)*round.items.length/100),round.items.length]):t("Your first attempt counts. Retrying is free practice.")}</small><div className="wla-order-actions">{right!==round.items.length&&<button type="button" className="wla-outline" onClick={()=>{retryCount.current++;setOrder([]);setChecked(false)}}>{t("Retry round")}</button>}<button type="button" className="wla-primary" onClick={next}>{r+1>=rounds.length?t("See my score"):t("Next")}</button></div></section>}
 </div>;
}

/** A drawn film frame: the same figure at different sizes shows each shot type. */
function Frame({type,card,language}:{type:number;card?:ShotCard;language:string}){const t=shotTypes[type];const s=t.scale;const translate=appTranslator(language);
 return <svg className="wla-frame" viewBox="0 0 300 190" role="img" aria-label={translate("A film frame showing a person")}>
  <rect width="300" height="190" fill={card?.sky||'#DCE9E2'}/><rect y="132" width="300" height="58" fill={card?.ground||'#C6D9CE'}/>
  <path d="M25 132V36h44v96M230 132V52h45v80" fill="none" stroke={card?.ground||'#C6D9CE'} strokeWidth="5"/>
  <g transform={`translate(${(t.ots?185:150)+(card?.offset||0)} ${t.ty}) scale(${s})`}>
   <circle cx="0" cy="-55" r="22" fill="#2E4A3B"/><path d="M-45 40 Q-40 -25 0 -28 Q40 -25 45 40 Z" fill={card?.shirt||'#2E4A3B'}/>
   {s>=2&&<><circle cx="-8" cy="-58" r="2.6" fill="#DCE9E2"/><circle cx="8" cy="-58" r="2.6" fill="#DCE9E2"/></>}
  </g>
  {t.ots&&<g><circle cx="40" cy="70" r="55" fill="#1B2E24" opacity=".85"/><path d="M-30 190 Q-10 100 60 110 Q110 120 120 190 Z" fill="#1B2E24" opacity=".85"/></g>}
  <rect x="2" y="2" width="296" height="186" fill="none" stroke="#0C3825" strokeWidth="4"/>
 </svg>;
}
function GuessTheShot({onDone,cards=shotQuiz.map(type=>({type,scene:'A film scene',sky:'#DCE9E2',ground:'#C6D9CE',shirt:'#2E4A3B',offset:0})),language='en'}:{onDone:(s:number)=>void;cards?:ShotCard[];language?:string}){
 const t=appTranslator(language);
 const [r,setR]=useState(0),[pick,setPick]=useState<number|null>(null),[right,setRight]=useState(0);const card=cards[r],type=card.type;
 const options=useMemo(()=>shuffle([type,...shuffle(shotTypes.map((_,n)=>n).filter(n=>n!==type)).slice(0,3)]),[type,r]);
 const answer=(n:number)=>{if(pick!==null)return;setPick(n);if(n===type)setRight(x=>x+1)};
 const next=()=>{if(r+1>=cards.length){onDone(right*100/cards.length);return}setR(r+1);setPick(null)};
 return <div className="wla-stack">
  <Progress language={language} at={r} of={cards.length}/>
  <p className="wla-muted">{t(card.scene)}</p><Frame language={language} type={type} card={card}/>
  <div className="wla-options">{options.map(n=><button key={n} type="button" disabled={pick!==null} className={'wla-option'+(pick!==null&&n===type?' on':'')+(pick===n&&n!==type?' off':'')} onClick={()=>answer(n)}><span>{t(shotTypes[n].name)}</span></button>)}</div>
  {pick!==null&&<Explain language={language} ok={pick===type} why={t("This is a {0}.",[t(shotTypes[type].name).toLocaleLowerCase(language)])+" "+t(['It shows the whole place and how small the person is in it.','It frames the person from the waist up, good for conversation.','It fills the frame with the face to show emotion.','It shows one detail, like the eyes, for intensity.','It looks past one person’s shoulder at another, common in dialogue.'][type])} onNext={next} last={r+1>=cards.length}/>}
 </div>;
}

const diceIcons:Record<string,React.ComponentType<{size?:number}>>={coffee:Coffee,bike:Bike,umbrella:Umbrella,phone:Smartphone,key:Key,dog:Dog,rocket:Rocket,book:Book,music:Music,camera:Camera,tree:TreePine,cake:Cake};
const synonyms:Record<string,string[]>={coffee:['coffee','chai','cup','tea'],bike:['bike','cycle','scooter','ride'],umbrella:['umbrella','rain'],phone:['phone','mobile','call','message'],key:['key','lock','door'],dog:['dog','puppy','pup'],rocket:['rocket','space','launch'],book:['book','read','page','novel'],music:['music','song','sing','tune'],camera:['camera','photo','picture','film'],tree:['tree','branch','leaf','forest'],cake:['cake','bake','birthday','dessert']};
function StoryDice({onDone,prompt,onRoll,language='en'}:{onDone:(s:number)=>void;prompt?:StoryPrompt;onRoll?:()=>StoryPrompt;language?:string}){
 const t=appTranslator(language);
 const roll=()=>shuffle(diceItems).slice(0,3);const [items,setItems]=useState<string[]>(()=>prompt?.items||roll()),[brief,setBrief]=useState(prompt?.brief||'Tell a story with a beginning, a change and an ending.'),[rerolls,setRerolls]=useState(1),[frames,setFrames]=useState(['','','']);
 const all=frames.join(' ').toLowerCase();const used=items.map(it=>[t(it).toLocaleLowerCase(language),...synonyms[it]].some(w=>all.includes(w)));
 // A frame counts when it has at least 6 words and is not a copy of another frame.
 const norm=frames.map(f=>f.trim().toLowerCase().replace(/\s+/g,' '));const filled=frames.map((f,n)=>f.trim().split(/\s+/).filter(Boolean).length>=6&&norm.indexOf(norm[n])===n);
 const score=filled.filter(Boolean).length*20+used.filter(Boolean).length*(40/3);
 return <div className="wla-stack">
  <p className="wla-muted">{t("Completion checks, not a creativity rating: 60 points for three distinct frames of 6+ words, 40 for using the rolled items.")}</p>
  <p className="wla-note">{t(brief)}</p>
  <div className="wla-dice">{items.map(it=>{const I=diceIcons[it];return <span key={it}><I size={30}/><small>{t(it)}</small></span>})}</div>
  <button type="button" className="wla-ghost" disabled={!rerolls} onClick={()=>{if(!rerolls)return;const next=onRoll?.();setItems(next?.items||roll());if(next)setBrief(next.brief);setRerolls(0)}}><Dices size={18}/>{rerolls?t("Roll again (1 left)"):t("No rolls left")}</button>
  {['Beginning: who wants what?','Change: what happens?','Ending: how does it land?'].map((label,n)=><div key={n} className="wla-field"><label htmlFor={'sd'+n}>{t("Frame")}{' '}{n+1} · {t(label)}</label><textarea id={'sd'+n} rows={2} maxLength={200} value={frames[n]} onChange={e=>setFrames(frames.map((f,k)=>k===n?e.target.value:f))}/></div>)}
  <ul className="wla-checklist">{filled.map((f,n)=><li key={'f'+n} className={f?'met':''}>{f?<Check size={14}/>:'•'} {t("Frame")}{' '}{n+1} {t("has 6+ words of its own")}</li>)}{items.map((it,n)=><li key={it} className={used[n]?'met':''}>{used[n]?<Check size={14}/>:'•'} {t("Uses the")}{' '}{t(it)}</li>)}</ul>
  <button type="button" className="wla-primary wla-full" disabled={!filled.some(Boolean)} onClick={()=>onDone(score)}>{t("Finish my story")}</button>
 </div>;
}

function CaptionIt({onDone,rounds=captionRounds,language='en'}:{onDone:(s:number)=>void;rounds?:typeof captionRounds;language?:string}){
 const t=appTranslator(language);
 const [r,setR]=useState(0),[pick,setPick]=useState<number|null>(null),[right,setRight]=useState(0);const round=rounds[r];
 const order=useMemo(()=>shuffle(round.options.map((_,n)=>n)),[round]);
 const answer=(n:number)=>{if(pick!==null)return;setPick(n);if(n===round.best)setRight(x=>x+1)};
 const next=()=>{if(r+1>=rounds.length){onDone(right*100/rounds.length);return}setR(r+1);setPick(null)};
 return <div className="wla-stack">
  <Progress language={language} at={r} of={rounds.length}/>
  <div className="wla-scene"><Camera size={22}/><p>{t(round.scene)}</p></div>
  <div className="wla-options">{order.map(n=><button key={n} type="button" disabled={pick!==null} className={'wla-option'+(pick!==null&&n===round.best?' on':'')+(pick===n&&n!==round.best?' off':'')} onClick={()=>answer(n)}><span>{t(round.options[n])}</span></button>)}</div>
  {pick!==null&&<Explain language={language} ok={pick===round.best} why={t(round.why)} onNext={next} last={r+1>=rounds.length}/>}
 </div>;
}

function daysLeft(endsAt:string,language:string){const t=appTranslator(language);const ms=new Date(endsAt).getTime()-Date.now();const d=Math.max(0,Math.ceil(ms/864e5));return d<=1?t("ends tonight"):t("{0} days left",[d])}
/** The weekly tournament: one game for everyone, best score of the week counts. */
function Tournament({board,error,who,onPlay,onSignIn,language='en'}:{board:Board|null;error:string;who:string;onPlay:(id:GameId)=>void;onSignIn?:()=>void;language?:string}){
 const t=appTranslator(language);
 const [all,setAll]=useState(false);
 if(!board)return error?<p className="wla-note">{t(error)}</p>:<div className="wla-card wla-skel" aria-busy="true">{t("Loading this week’s tournament…")}</div>;
 const meta=games.find(g=>g.id===board.game)!;const L=courseLook[meta.track];const rows=all?board.top:board.top.slice(0,3);
 return <section className="wla-tourney" aria-labelledby="wla-tourney-t">
  <div className="wla-split"><p className="wla-kicker"><Trophy size={14}/> {t("WEEKLY TOURNAMENT ·")}{' '}{daysLeft(board.endsAt,language).toUpperCase()}</p>{board.players>0&&<small className="wla-muted">{board.players} {t("playing")}</small>}</div>
  <h3 id="wla-tourney-t" className="wla-h2">{t(meta.name)}</h3>
  {board.me?<p className="wla-tourney-me">{t("You’re")}{' '}<strong>#{board.me.rank}</strong> {t("with")}{' '}{board.me.score}</p>:<p className="wla-muted">{who?t("Play once to get on the board. Your best score this week counts."):t("Sign in to get on the board.")}</p>}
  {rows.length?<ol className="wla-board">{rows.map(r=><li key={r.rank} className={r.me?'me':''}><span className={'wla-medal m'+r.rank}>{r.rank}</span><span className="wla-grow">{r.name}{r.me?t("(you)"):''}</span><b>{r.score}</b></li>)}</ol>:<p className="wla-muted">{t("No scores yet this week. Be the first.")}</p>}
  {board.top.length>3&&<button type="button" className="wla-link" onClick={()=>setAll(!all)}>{all?t("Show top 3"):t("See top 10")}</button>}
  <div className="wla-row-btns"><button type="button" className={'wla-primary '+L.cls} onClick={()=>onPlay(meta.id)}>{t("Play")}{' '}{t(meta.name)}</button>{!who&&onSignIn&&<button type="button" className="wla-outline" onClick={onSignIn}>{t("Sign in")}</button>}</div>
 </section>;
}
/** Squads: up to five friends; their best tournament scores this week add up to a team score. */
function Squad({board,who,joinCode,onChanged,onSignIn,language='en'}:{board:Board|null;who:string;joinCode?:string;onChanged:()=>Promise<void>|void;onSignIn?:()=>void;language?:string}){
 const t=appTranslator(language);
 const [name,setName]=useState(''),[code,setCode]=useState(joinCode||''),[busy,setBusy]=useState(false),[msg,setMsg]=useState(''),[copied,setCopied]=useState(false);
 useEffect(()=>{if(joinCode)setCode(joinCode)},[joinCode]);
 const act=async(body:Record<string,string>)=>{if(busy)return;setBusy(true);setMsg('');try{const r=await api<{error?:string}>('/api/games',{method:'POST',body});if(!r.ok){setMsg(r.data.error||'That did not work.');return}setName('');setCode('');if(body.action!=='leave')writeLocal('wla-squad-invite','');await onChanged()}finally{setBusy(false)}};
 if(!who)return <section className="wla-card wla-squad"><strong><Users size={18}/> {t("Squad challenge")}</strong><p className="wla-muted">{t("Team up with up to 5 friends. Your best scores in the weekly game add up to one team score.")}{joinCode?t(" You were invited to squad {0}.",[joinCode]):''}</p>{onSignIn&&<button type="button" className="wla-primary wla-full" onClick={onSignIn}>{t("Sign in to")}{' '}{joinCode?t("join"):t("start")} {t("a squad")}</button>}</section>;
 if(!board)return <div className="wla-card" role="status">{t("Loading your squad…")}</div>;
 const sq=board.squad;
 if(sq){const link=`https://whatslearn.in/app?squad=${sq.code}`;const text=`Join my WhatsLearn squad “${sq.name}”. We play one game a week and our scores add up: ${link}`;
  return <section className="wla-card wla-squad">
   <div className="wla-split"><strong><Users size={18}/> {sq.name}</strong><span className="wla-badge-pill">#{sq.rank} · {sq.total} {t("pts")}</span></div>
   <ol className="wla-board">{sq.members.map((m,i)=><li key={i} className={m.me?'me':''}><span className="wla-medal">{i+1}</span><span className="wla-grow">{m.name}{m.me?t("(you)"):''}</span><b>{m.score||'—'}</b></li>)}</ol>
   {sq.members.length<5&&<p className="wla-muted">{5-sq.members.length} {t("spot")}{5-sq.members.length===1?'':'s'} {t("left. Code")}{' '}<strong>{sq.code}</strong></p>}
   <a className="wla-primary wla-full" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener"><Share2 size={18}/>{t("Invite friends on WhatsApp")}</a>
   <div className="wla-row-btns"><button type="button" className="wla-ghost" onClick={async()=>{try{await navigator.clipboard.writeText(sq.code);setCopied(true)}catch{}}}><Copy size={16}/>{copied?t("Copied"):t("Copy code")}</button><button type="button" className="wla-ghost" disabled={busy} onClick={()=>act({action:'leave'})}><LogOut size={16}/>{t("Leave")}</button></div>
   {msg&&<p className="wla-error" role="alert">{msg}</p>}
   {board&&board.squads.length>1&&<><p className="wla-kicker">{t("TOP SQUADS THIS WEEK")}</p><ol className="wla-board">{board.squads.slice(0,5).map(s=><li key={s.rank} className={s.name===sq.name?'me':''}><span className={'wla-medal m'+s.rank}>{s.rank}</span><span className="wla-grow">{s.name}<small> · {s.members}</small></span><b>{s.total}</b></li>)}</ol></>}
  </section>}
 return <section className="wla-card wla-squad">
  <strong><Users size={18}/> {t("Squad challenge")}</strong>
  <p className="wla-muted">{t("Team up with up to 5 friends. Your best scores in this week’s game add up to one team score.")}</p>
  <form className="wla-field" onSubmit={e=>{e.preventDefault();if(!busy&&code.length===6)void act({action:'join',code})}}><label htmlFor="wla-sq-code">{t("Join with a code")}</label><div className="wla-inline"><input id="wla-sq-code" value={code} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6))} placeholder={t("Six-character code")} maxLength={6} autoCapitalize="characters" autoComplete="off" spellCheck={false}/><button type="submit" className="wla-primary" disabled={busy||code.length!==6}>{t("Join")}</button></div></form>
  <form className="wla-field" onSubmit={e=>{e.preventDefault();if(!busy&&name.trim().length>=2)void act({action:'create',name:name.trim()})}}><label htmlFor="wla-sq-name">{t("Or create a squad")}</label><div className="wla-inline"><input id="wla-sq-name" value={name} onChange={e=>setName(e.target.value)} placeholder={t("Squad name")} maxLength={30}/><button type="submit" className="wla-outline" disabled={busy||name.trim().length<2}>{t("Create")}</button></div></form>
  {msg&&<p className="wla-error" role="alert">{msg}</p>}
  {board&&board.squads.length>0&&<><p className="wla-kicker">{t("TOP SQUADS THIS WEEK")}</p><ol className="wla-board">{board.squads.slice(0,3).map(s=><li key={s.rank}><span className={'wla-medal m'+s.rank}>{s.rank}</span><span className="wla-grow">{s.name}<small> · {s.members}</small></span><b>{s.total}</b></li>)}</ol></>}
 </section>;
}
