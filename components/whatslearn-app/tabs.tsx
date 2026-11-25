'use client';
import {useEffect,useRef,useState} from 'react';
import type {AppAvatar} from './avatar';
import {LevelCard,DailyMissions,BadgeGrid,BadgeToast,markMentorDay,levelOf} from './rewards';
import {ArrowLeft,ArrowUpRight,Check,ChevronRight,Lock,MessageCircle,Send,Mic,Square,Megaphone,Code,Clapperboard,Images,CreditCard,SlidersHorizontal,Languages,LifeBuoy,UserRound,Shield,FileText,Receipt,LogOut,Trash2,BookMarked,Flame,Trophy,Sparkles,Target,Clock,ArrowRight,Star,Award,Share2,BellRing,Gamepad2} from 'lucide-react';
import {shareStarterCard} from './share';
import {missions,type Mission} from '@/lib/missions';
import {programmes} from '@/lib/programmes';
import {lockFor,missionsOfCourse} from '@/lib/progression';
import {needsMembership} from '@/lib/mission-access';
import {checkpointPositions,checkpointKey,checkpointFor} from '@/lib/checkpoints';
import {readableBody} from '@/lib/practical';
import {agencyStory,agencyTracks,type AgencyTrack} from '@/lib/agency-story';
import {languages} from '@/lib/languages';
import {api,currentAccount,readLocal,type Snapshot} from './api';
import {feedbackOf,historyKey,versionsOf} from './learning-state';
import {FeedbackCard} from './feedback';
import {useCourseSwipe} from './swipe';
import {useDictation} from './dictation';
import {appTranslator,appCourseName,appMissionTitle} from './app-language';
import {localizeMission} from '@/lib/personalization';

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
function week(s:Snapshot,language:string){const weekday=new Intl.DateTimeFormat(language,{weekday:'narrow'});const today=s.points?.today?new Date(s.points.today+'T00:00:00'):new Date();const active=new Set((s.points?.scores||[]).map(x=>x.day));
 return Array.from({length:7},(_,i)=>{const d=new Date(today);d.setDate(today.getDate()-6+i);const key=d.toISOString().slice(0,10);const local=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;return {label:weekday.format(d),on:active.has(local)||active.has(key),today:i===6}})}

/** Time left until midnight India time, when a new task can earn points again. */
function Countdown({language}:{language:string}){
 const translate=appTranslator(language);
 const left=()=>{const ist=Date.now()+5.5*3600e3;const ms=864e5-ist%864e5;return translate("{0} h {1} min",[Math.floor(ms/36e5),Math.floor(ms%36e5/6e4)])};
 const [t,setT]=useState(left);
 useEffect(()=>{const id=setInterval(()=>setT(left()),30000);return()=>clearInterval(id)},[]);
 return <b>{t}</b>;
}

export function Home({s,onOpen,onTab,onCourse,reviewsLeft,language='en'}:{s:Snapshot;language?:string;onOpen:(n:Next)=>void;onTab:(t:string)=>void;onCourse:(id:string)=>void;reviewsLeft?:number}){
 const t=appTranslator(language);
 const swipe=useCourseSwipe();
 const track=s.profile?.track||'marketing';const prog=programmes.find(p=>p.id===track)!;const next=nextFor(track,s);
 const {completed}=progressOf(s);const saved=missionsOfCourse(track).filter(m=>completed.has(m.id)).length;
 const doneToday=!!s.points?.todayUsed;const hour=new Date().getHours();const greet=hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';
 const streak=s.points?.streak?.current||0;const days=week(s,language);
 // Evening in India and no task saved yet: the streak is about to break.
 const streakAtRisk=streak>0&&!doneToday&&new Date(Date.now()+5.5*3600e3).getUTCHours()>=17;
 const goal=s.profile?.minutes&&s.profile.minutes!=='flexible'?t("{0} min a day",[s.profile.minutes]):t("Your own pace");
 // Home keeps its direct mentor shortcut alongside the task and courses.
 return <div className="wla-stack wla-home">
  <div className="wla-hello"><div><p className="wla-muted">{t(greet)}{s.name?`, ${s.name}`:''}</p><h2 className="wla-h1 wla-tight">{doneToday?t("Nice work today"):t("Continue learning")}</h2>
   <p className="wla-goal"><Target size={14}/>{goal}{reviewsLeft!==undefined?" · "+t(reviewsLeft===1?"{0} AI review left":"{0} AI reviews left",[reviewsLeft]):''}</p></div>
   <span className={'wla-streak'+(streak?' on':'')} aria-label={t("{0}-day streak",[streak])}><Flame size={18}/>{streak}</span></div>

  {streakAtRisk&&<p className="wla-risk" role="status"><Flame size={18}/>{t("Your")}{' '}{streak}{t("-day streak ends at midnight. Save today’s task to keep it.")}</p>}
  {next.kind==='finished'?<div className="wla-hero-card"><p className="wla-hero-kicker">{appCourseName(prog.id,prog.name,language).toUpperCase()}</p><p className="wla-hero-title">{t("Course complete. All 10 tasks saved.")}</p><button type="button" className="wla-mint" onClick={()=>onTab('courses')}>{t("Choose another course")}</button></div>
  :doneToday&&next.kind==='mission'?<div className="wla-hero-card"><p className="wla-hero-kicker"><Check size={14}/> {t("Done for today · Day")}{' '}{next.position} {t("of 10 next")}</p><p className="wla-hero-title">{t("Tomorrow:")}{' '}{appMissionTitle(next.mission.id,localizeMission(next.mission,language,s.profile?.level).title,language)}</p><p className="wla-hero-sub"><Clock size={14}/> {t("Earns points in")}{' '}<Countdown language={language}/>{t(". You can read and draft it now.")}</p><button type="button" className="wla-mint" onClick={()=>onTab('play')}><Gamepad2 size={18}/>{t("Play today’s game")}</button><button type="button" className="wla-hero-link" onClick={()=>onOpen(next)}>{t("Start drafting tomorrow’s task")}</button></div>
  :next.kind==='checkpoint'?<div className="wla-hero-card"><p className="wla-hero-kicker">{t("MINI CHALLENGE")}</p><p className="wla-hero-title">{t(checkpointFor(next.track,next.after)?.title||'')}</p><p className="wla-hero-sub">{t("Clear it to unlock your next task. No points needed.")}</p><button type="button" className="wla-mint" onClick={()=>onOpen(next)}>{t("Start mini challenge")}</button></div>
  :<div className="wla-hero-card wla-home-mission" data-track={track}>
   <span className="wla-mission-emoji" aria-hidden="true"></span>
   <p className="wla-hero-kicker">{appCourseName(prog.id,prog.name,language)} {t("· Day")}{' '}{next.position} {t("of 10")}</p>
   <p className="wla-hero-title">{appMissionTitle(next.mission.id,localizeMission(next.mission,language,s.profile?.level).title,language)}</p>
   <p className="wla-hero-sub"><Clock size={14}/> {next.mission.minutes} {t("min ·")}{' '}{t(next.mission.skill)}</p>
   <button type="button" className="wla-mint" onClick={()=>onOpen(next)}>{next.kind==='plan'?<><Lock size={16}/>{t("Unlock with a plan")}</>:<>{t("Continue task")}<ArrowRight size={18}/></>}</button>
  </div>}

  <DailyMissions language={language} s={s} who={s.accountKey} onTask={()=>next.kind==='mission'||next.kind==='plan'||next.kind==='checkpoint'?onOpen(next):onTab('courses')} onGame={()=>onTab('play')} onMentor={()=>onTab('mentor')}
   footer={<div className="wla-week" role="img" aria-label={t("Practised on {0} of the last 7 days",[days.filter(d=>d.on).length])}>
    <div className="wla-split"><small>{t("This week")}</small><small>{t("{0}/7 days · {1}/10 tasks",[days.filter(d=>d.on).length,saved])}</small></div>
    <div className="wla-days">{days.map((d,i)=><span key={i} className={(d.on?'on ':'')+(d.today?'today':'')}><i>{d.on?<Check size={13}/>:null}</i>{d.label}</span>)}</div>
   </div>}/>
  <BadgeToast language={language} s={s} who={s.accountKey}/>
  <button type="button" className="wla-home-mentor" onClick={()=>onTab('mentor')}><span className="wla-home-mentor-icon" aria-hidden="true"></span><span className="wla-grow"><strong>{t("Stuck? Ask your mentor")}</strong><small>{t("Get help with your current task")}</small></span><ArrowRight size={18}/></button>

  <div className="wla-split wla-sec-head"><strong>{t("Courses")}</strong><button type="button" className="wla-link" onClick={()=>onTab('courses')}>{t("See all")}</button></div>
  <div {...swipe.handlers} className={'wla-carousel'+(swipe.dragging?' is-dragging':'')} role="region" aria-label={t("Explore courses. Swipe or drag horizontally.")} tabIndex={0}>{programmes.map(p=>{const L=courseLook[p.id];const I=L.Icon;const done=missionsOfCourse(p.id).filter(m=>completed.has(m.id)).length;
   return <button key={p.id} type="button" className={'wla-ccard '+L.cls} onClick={()=>onCourse(p.id)}><span className="wla-ccard-icon"><I size={22}/></span><strong>{appCourseName(p.id,p.name,language)}</strong><small>{t(p.headline)}</small><span className="wla-cbar"><span style={{width:`${done*10}%`}}/></span><small className="wla-ccard-foot">{done?t("{0}/10 saved",[done]):t("10 tasks · start free")}</small></button>})}</div>
 </div>;
}

export function Courses({s,onOpen,onSignIn,initialTrack,onTrackChange,language='en'}:{s:Snapshot|null;language?:string;onOpen:(n:Next)=>void;onSignIn:()=>void;initialTrack?:string;onTrackChange?:(id:string|undefined)=>void}){
 const t=appTranslator(language);
 const [localTrack,setLocalTrack]=useState(initialTrack||'');const requested=onTrackChange?initialTrack||'':localTrack;const open=programmes.some(p=>p.id===requested)?requested:'';
 const setOpen=(id:string)=>{setLocalTrack(id);onTrackChange?.(id||undefined);setNotice('')};
 const {completed,cleared}=s?progressOf(s):{completed:new Set<string>(),cleared:new Set<string>()};const [notice,setNotice]=useState('');
 const heading=useRef<HTMLHeadingElement>(null);useEffect(()=>{heading.current?.focus({preventScroll:true})},[open]);
 return <div className="wla-stack">
  {open&&<button type="button" className="wla-back" onClick={()=>setOpen('')}><ArrowLeft size={18}/>{t("Back to courses")}</button>}
  {!open&&<div><h2 ref={heading} tabIndex={-1} className="wla-h1 wla-tight">{t("Courses")}</h2><p className="wla-muted">{t("Try the first three tasks of any course free.")}</p></div>}
  {notice&&<p className="wla-note" role="status"><Lock size={16}/>{t(notice)}</p>}
  {programmes.filter(p=>!open||p.id===open).map(p=>{const list=missionsOfCourse(p.id);const done=list.filter(m=>completed.has(m.id)).length;const isOpen=open===p.id;const L=courseLook[p.id];const I=L.Icon;
   const hours=Math.round(list.reduce((t,m)=>t+(m.minutes||0),0)/30)/2;
   return <div key={p.id} className={'wla-course '+L.cls+(isOpen?' wla-course-detail':'')}>
    {!isOpen?<button type="button" className="wla-course-cover wla-course-card" onClick={()=>setOpen(p.id)}>
     <span className="wla-course-top"><span className="wla-ccard-icon"><I size={20}/></span><small className="wla-cnum">{t("COURSE")}{' '}{p.number}</small><small className="wla-course-status">{done>=10?t("Completed"):done?t("{0}/10 done",[done]):t("Free to start")}</small></span>
     <strong className="wla-course-name">{appCourseName(p.id,p.name,language)}</strong>
     <span className="wla-course-make"><small>{t("You’ll make")}</small>{t(p.finishedOutcome)}</span>
     <span className="wla-course-emoji" aria-hidden="true"></span>
     <small className="wla-course-meta">{t("10 tasks · about")}{' '}{hours} {t("hrs")}</small>
     {done>0&&<span className="wla-cbar" aria-hidden="true"><span style={{width:`${done*10}%`}}/></span>}
     <span className="wla-course-pill">{done?t("Continue"):t("View tasks")}<ChevronRight size={18}/></span>
    </button>:<div className="wla-course-summary">
     <h2 ref={heading} tabIndex={-1} className="wla-h1 wla-tight">{appCourseName(p.id,p.name,language)}</h2>
     <p><strong>{t("You’ll make:")}</strong> {t(p.finishedOutcome)}</p>
     <span className="wla-course-emoji" aria-hidden="true"/>
     <small>{list.length} {t("tasks · about")}{' '}{hours} {t("hrs · first 3 free")}</small>
     <div className="wla-course-progress"><small>{done}/{list.length} {t("tasks saved")}</small><progress value={done} max={list.length} aria-label={t("tasks saved")}/></div>
    </div>}
    {isOpen&&<div className="wla-course-body">{list.flatMap((m,i)=>{
     const isDone=completed.has(m.id);const lock=lockFor(m,completed,cleared);const plan=needsMembership(m,s?.paidAccess||false);
     const state=!s?(plan?'Plan':'Free'):isDone?'Saved':plan?'Plan':lock.locked?'Locked':'Open';
     const row=<button key={m.id} type="button" className={'wla-task'+(s&&lock.locked&&!isDone&&!plan?' locked':'')+(state==='Open'?' current':'')} onClick={()=>{setNotice('');if(!s){onSignIn();return}if(lock.locked&&!lock.checkpoint&&!isDone){setNotice(lock.message);return}onOpen(plan&&!isDone?{kind:'plan',mission:m,position:i+1}:lock.checkpoint?{kind:'checkpoint',track:lock.checkpoint.track,after:lock.checkpoint.after}:{kind:'mission',mission:m,position:i+1})}}>
      <span className={'wla-dot'+(isDone?' done':state==='Open'?' now':'')}>{isDone?<Check size={14}/>:s&&lock.locked&&!plan?<Lock size={12}/>:i+1}</span><span className="wla-grow">{appMissionTitle(m.id,localizeMission(m,language).title,language)}<small>{m.minutes} {t("min ·")} {t(m.skill)}</small></span><small className={'wla-state s-'+state.toLowerCase()}>{state==='Plan'?<><Lock size={11}/> Plus</>:t(state)}</small></button>;
     const after=i+1;const cp=(checkpointPositions as readonly number[]).includes(after)?checkpointFor(p.id,after):undefined;
     const cpCleared=cleared.has(checkpointKey(p.id,after));
     return cp?[row,<button type="button" key={'cp'+after} className="wla-task wla-cp" onClick={()=>{setNotice('');if(!s){onSignIn();return}if(cpCleared){setNotice('Mini challenge cleared. Nice work.');return}if(!isDone){setNotice(`This mini challenge opens after you save task ${after}.`);return}onOpen({kind:'checkpoint',track:p.id,after})}}><span className={'wla-dot star'+(cpCleared?' done':'')}>{cpCleared?<Check size={14}/>:<Star size={13}/>}</span><span className="wla-grow">{t("Mini challenge")}<small>{t(cp.title)}</small></span><small className="wla-state">{cpCleared?t("Cleared"):isDone?t("Open"):'After task '+after}</small></button>]:[row];
    })}</div>}
   </div>})}
 </div>;
}

type MentorBlock=
 | {kind:'text';lines:string[]}
 | {kind:'ordered'|'unordered';items:{number?:number;text:string}[]};

function renderMentorReply(reply:string){
 const blocks:MentorBlock[]=[];
 const lines=reply.split(/\r?\n/);
 const listMarker=/^\s*(?:(\d{1,3})[.)]|[-*•])(?:[ \t]+(.*)|\s*)$/;
 for(let i=0;i<lines.length;i++){
  const line=lines[i];
  const match=line.match(listMarker);
  if(match){
   let item=match[2]?.trim();
   const next=lines[i+1]?.trim();
   if(!item&&next&&!listMarker.test(next)){item=next;i++}
   if(item){
    const kind=match[1]===undefined?'unordered':'ordered';
    const entry={number:match[1]===undefined?undefined:Number(match[1]),text:item};
    const previous=blocks.at(-1);
    if(previous?.kind===kind)previous.items.push(entry);
    else blocks.push({kind,items:[entry]});
    continue;
   }
  }
  const previous=blocks.at(-1);
  if(previous?.kind==='text')previous.lines.push(line);
  else if(line.trim())blocks.push({kind:'text',lines:[line]});
 }
 return blocks.map((block,i)=>{
  if(block.kind==='text')return <div key={i}>{block.lines.join('\n').trimEnd()}</div>;
  const List=block.kind==='ordered'?'ol':'ul';
  return <List key={i} start={List==='ol'?block.items[0].number:undefined}>{block.items.map((item,j)=><li key={j} value={item.number}>{item.text}</li>)}</List>;
 });
}

type Msg={me:boolean;text:string};
export function Mentor({missionId,language,signedIn,onSignIn}:{missionId:string;language:string;signedIn:boolean;onSignIn?:()=>void}){
 const t=appTranslator(language);
 const [msgs,setMsgs]=useState<Msg[]>([{me:false,text:t("Need a hand? Ask for an explanation, an example, or a next step.")}]);
 const [q,setQ]=useState(''),[busy,setBusy]=useState(false);const end=useRef<HTMLDivElement>(null);
 const [failed,setFailed]=useState<{question:string;message:string}|null>(null);
 const sending=useRef(false);
 const voice=useDictation({language,value:q,onChange:setQ});
 useEffect(()=>{end.current?.scrollIntoView({block:'end'})},[msgs,busy]);
 const m=missions.find(x=>x.id===missionId);
 const ideas=['Explain this task simply','Show me an example','What should I do first?'].map(label=>t(label));
 async function ask(text:string,retry=false){
  const question=text.trim().slice(0,500);
  if(!question||sending.current||voice.listening)return;
  sending.current=true;
  setBusy(true);
  setFailed(null);
  if(!retry){setQ('');setMsgs(previous=>previous.concat({me:true,text:question}))}
  try{
   const result=await api<{answer?:string}>('/api/feedback',{method:'POST',body:{action:'ask',missionId,question,body:'',language},timeoutMs:30000});
   if(result.ok&&result.data.answer?.trim()){
    markMentorDay(currentAccount());
    const answer=result.data.answer;
    setMsgs(previous=>previous.concat({me:false,text:answer}));
   }else{
    setFailed({question,message:result.status===0?(result.data.error||'Check your connection and try again.'):(result.data.error||'The mentor couldn’t answer right now.')});
   }
  }finally{sending.current=false;setBusy(false)}
 }
 if(!signedIn)return <div className="wla-stack">
  <div className="wla-chat wla-chat-demo" aria-label={t("Example mentor chat")}><div className="wla-mentor-intro"><span><MessageCircle size={18}/></span><div><strong>{t("WhatsLearn Mentor")}</strong><small>{t("Example conversation")}</small></div></div>
   <div className="wla-msgs"><p className="me">{t("I don’t get what a “hook” is.")}</p><div className="wla-bot"><span><MessageCircle size={14}/></span><p>{t("A hook is the first line that makes the right person stop scrolling. Try: name who it’s for, then the problem you solve for them.")}</p></div></div></div>
  <div className="wla-card"><strong>{t("Sign in to chat with your mentor")}</strong><p className="wla-muted">{t("The mentor uses your current task and progress.")}</p>{onSignIn&&<button type="button" className="wla-primary wla-full" onClick={onSignIn}>{t("Sign in or create an account")}</button>}</div></div>;
 return <div className="wla-chat wla-mentor-chat"><div className="wla-mentor-feed" role="log" aria-label={t("Mentor conversation")} aria-live="polite">
  {m&&<p className="wla-muted wla-task-context">{t("Task:")}{' '}{appMissionTitle(m.id,localizeMission(m,language).title,language)}</p>}
  <div className="wla-mentor-intro"><span><MessageCircle size={18}/></span><div><strong>{t("WhatsLearn Mentor")}</strong><small>{t("Help with this task")}</small></div></div>
  <div className="wla-msgs">{msgs.map((x,i)=>x.me?<p key={i} className="me">{x.text}</p>:<div key={i} className="wla-bot"><span><MessageCircle size={14}/></span><div className="wla-mentor-reply">{renderMentorReply(x.text)}</div></div>)}{busy&&<p className="typing" role="status" aria-label={t("Mentor is typing")}><span/><span/><span/></p>}<div ref={end}/></div>
  {msgs.length<2&&<div className="wla-ideas">{ideas.map(idea=><button key={idea} type="button" onClick={()=>ask(idea)}>{idea}</button>)}</div>}
  {failed&&<div className="wla-note" role="status"><span>{t(failed.message)}</span><button type="button" className="wla-link" disabled={voice.listening} onClick={()=>ask(failed.question,true)}>{t("Retry question")}</button></div>}
  </div><div className="wla-mentor-compose">
  <form className="wla-ask" onSubmit={e=>{e.preventDefault();ask(q)}}><label htmlFor="wla-ask" className="wla-sr">{t("Ask the mentor")}</label><input id="wla-ask" value={q} readOnly={voice.listening} onChange={e=>setQ(e.target.value)} placeholder={t("Ask about your task…")} maxLength={500}/><button type="button" className={'wla-mic'+(voice.listening?' listening':'')} aria-label={voice.listening?t("Stop dictation"):t("Dictate a question")} aria-pressed={voice.listening} aria-describedby="wla-voice-note" disabled={busy} onClick={voice.toggle}>{voice.listening?<Square size={17}/>:<Mic size={19}/>}</button><button type="submit" aria-label={t("Send")} disabled={busy||voice.listening||!q.trim()}><Send size={20}/></button></form>
  <p id="wla-voice-note" className="wla-voice-note" role="status">{t(voice.message||"Voice uses your browser’s speech service. Review the text before sending.")}</p>
  <a className="wla-outline wla-full" href="/settings?connect=whatsapp#whatsapp" target="_blank" rel="noopener">{t("Continue on WhatsApp")}</a>
  </div>
 </div>;
}

export function Creations({s,onBack,view,setView,onImprove,language='en'}:{s:Snapshot;language?:string;onBack:()=>void;view:string;setView:(id:string)=>void;onImprove?:(id:string)=>void}){const t=appTranslator(language);const w=s.work.find(x=>x.mission_id===view);const title=(id:string)=>missions.find(m=>m.id===id)?.title||id;
 if(w){const review=feedbackOf(w.evaluation),versions=versionsOf(readLocal(historyKey(s.accountKey,w.mission_id))),recent=(s.evidence||[]).filter(e=>e.mission_id===w.mission_id).flatMap(e=>{const r=feedbackOf(e.review);return r?[{...e,review:r}]:[]}).slice(0,5);
  return <div className="wla-stack"><button type="button" className="wla-back" onClick={()=>setView('')}><ArrowLeft size={18}/>{t("My Creations")}</button><h2 className="wla-h2">{t(title(w.mission_id))}</h2><p className="wla-muted">{t("Saved to your account ·")}{' '}{new Date(w.updated_at).toLocaleDateString(language)}</p>
   {review?<section className="wla-card"><p className="wla-kicker">{t("Saved feedback")}</p><p className="wla-read">{review.summary}</p><p className="wla-read"><strong>{t("Next step:")}</strong> {review.nextStep}</p><details className="wla-disclosure"><summary>{t("Review details")}</summary><FeedbackCard review={review} language={language}/></details></section>:<p className="wla-muted">{t("No saved feedback is available for this creation.")}</p>}
   <details className="wla-disclosure"><summary>{t("Your saved work")}</summary><pre className="wla-pre">{readableBody(w.body)}</pre></details>
   {onImprove&&<button type="button" className="wla-primary wla-full" onClick={()=>onImprove(w.mission_id)}>{t("Improve this work")}</button>}
   <details className="wla-disclosure"><summary>{t("Recent feedback ·")}{' '}{recent.length}</summary>{recent.length?recent.map((r,i)=><div className="wla-history-entry" key={r.reviewKey||i}><small>{new Date(r.created_at).toLocaleString()}</small><p className="wla-read">{r.review.summary}</p><p className="wla-read"><strong>{t("Next:")}</strong> {r.review.nextStep}</p></div>):<p className="wla-muted">{t("No earlier feedback was returned for this task.")}</p>}</details>
   <details className="wla-disclosure"><summary>{t("Reviewed versions on this device ·")}{' '}{versions.length}</summary><p className="wla-muted">{t("Up to five versions reviewed in this app are kept on this device for this account. These copies do not sync between devices.")}</p>{versions.map((v,i)=><details className="wla-history-entry" key={i}><summary>{t("Version from")}{' '}{new Date(v.createdAt).toLocaleString()}</summary><pre className="wla-pre">{readableBody(v.body)}</pre><p className="wla-read"><strong>{t("Feedback:")}</strong> {v.review.summary}</p><p className="wla-read"><strong>{t("Next:")}</strong> {v.review.nextStep}</p></details>)}</details>
  </div>;
 }
 const skills=new Set(s.work.flatMap(work=>missions.find(mission=>mission.id===work.mission_id)?.skill||[]));
 return <div className="wla-stack"><button type="button" className="wla-back" onClick={onBack}><ArrowLeft size={18}/>{t("Back")}</button><h2 className="wla-h1 wla-tight">{t("My")}{' '}<em>{t("creations.")}</em></h2>
  {skills.size>0&&<details className="wla-disclosure"><summary>{t("Skills practised ·")}{' '}{skills.size}</summary><ul className="wla-guide-steps">{[...skills].map(skill=><li key={skill}>{t(skill)}</li>)}</ul></details>}
  {s.work.length?s.work.map(x=><button key={x.mission_id} type="button" className="wla-tile" onClick={()=>setView(x.mission_id)}><span><strong>{t(title(x.mission_id))}</strong><small>{t("Saved")} {new Date(x.updated_at).toLocaleDateString(language)}</small></span><ChevronRight size={20}/></button>)
  :<div className="wla-card"><p className="wla-muted">{t("Nothing saved yet. Your saved tasks appear here.")}</p></div>}
 </div>;
}

/** Level and badges get their own screen so the Me tab stays a short, tidy list. */
export function Achievements({s,onBack,language='en'}:{s:Snapshot;onBack:()=>void;language?:string}){
 const t=appTranslator(language);
 return <div className="wla-stack"><button type="button" className="wla-back" onClick={onBack}><ArrowLeft size={18}/>{t("Back")}</button><h2 className="wla-h1 wla-tight">{t("Level &amp;")}{' '}<em>{t("badges.")}</em></h2>
  <LevelCard language={language} s={s}/><BadgeGrid language={language} s={s} who={s.accountKey}/>
 </div>;
}

export function Me({s,signedIn,avatar,onSignIn,onCreations,onBadges,onPrefs,onContext,onLanguage,onPlans,onSignOut,language='en'}:{s:Snapshot|null;avatar?:AppAvatar;language?:string;signedIn:boolean;onSignIn:()=>void;onCreations:()=>void;onBadges:()=>void;onPrefs:()=>void;onContext?:()=>void;onLanguage:()=>void;onPlans:()=>void;onSignOut:()=>void}){ const t=appTranslator(language);const photoInput=useRef<HTMLInputElement>(null);const photoLabel=avatar?.src?t("Change photo"):language==="en"?"Add profile photo":t("Add photo");const ext=(href:string,label:string,Icon:React.ComponentType<{size?:number}>,danger?:boolean)=><a className={'wla-row'+(danger?' danger':'')} href={href} target="_blank" rel="noopener"><Icon size={20}/>{t(label)}<span className="wla-end"><ArrowUpRight size={18}/></span></a>;
 return <div className="wla-stack">
  {signedIn&&s?<div className="wla-profile">{avatar?<button type="button" className="wla-profile-photo wla-profile-picker" aria-label={avatar.ready?photoLabel:undefined} title={avatar.ready?photoLabel:undefined} disabled={avatar.busy||!avatar.ready} onClick={()=>photoInput.current?.click()}>{avatar?.src?<img src={avatar.src} alt=""/>:(s.name||'W').slice(0,1).toUpperCase()}{avatar.ready&&!avatar.src&&<span className="wla-profile-plus" aria-hidden="true">+</span>}</button>:<span className="wla-profile-photo">{(s.name||'W').slice(0,1).toUpperCase()}</span>}<div><strong>{s.name||t("Your account")}</strong><small>{s.paidAccess?t("Paid plan"):t("Explore plan · Free")} · {s.points?.balance??0} {t("points")}</small><small>{s.work.length} {t("task")}{s.work.length===1?'':'s'} {t("saved")}{(s.points?.streak?.current||0)>0?" · "+t("{0}-day streak",[s.points!.streak.current]):''}</small>
   {avatar&&<div className="wla-photo-actions">
    <input ref={photoInput} type="file" accept="image/*" hidden onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';if(file)void avatar.update(file)}}/>
    {avatar.ready&&!avatar.src&&!avatar.busy&&!avatar.message&&<small>{photoLabel}</small>}
    {avatar.loadFailed&&<button type="button" className="wla-link" onClick={avatar.retry}>{t("Try again")}</button>}
    {avatar.src&&<button type="button" className="wla-link" disabled={avatar.busy} onClick={()=>void avatar.update(null)}>{t("Remove photo")}</button>}
    {(avatar.busy||avatar.message)&&<p className="wla-photo-status" role="status">{t(avatar.busy?"Saving…":avatar.message)}</p>}
   </div>}
  </div></div>
  :<div className="wla-card"><strong>{t("You’re exploring as a guest")}</strong><p className="wla-muted">{t("Sign in to save your work and keep your points.")}</p><button type="button" className="wla-primary wla-full" onClick={onSignIn}>{t("Sign in or create an account")}</button></div>}
  <p className="wla-section">{t("LEARNING")}</p>
  <details className="wla-disclosure"><summary>{t("Points, reviews and saved work")}</summary><p className="wla-read">{t("Points record completed practice. A new task can earn up to 100 points, with one new scored task per day. Points are not money.")}</p><p className="wla-read">{t("AI reviews are a separate daily allowance. Explore includes 3 reviews per day after sign-in; paid plans provide more. The allowance resets at midnight India time.")}</p><p className="wla-read">{t("The app’s teaching examples are free. Drafts stay on this device; accepted work and its saved feedback are stored in your account.")}</p></details>
  <div className="wla-list">
   {signedIn&&s&&<button type="button" className="wla-row" onClick={onBadges}><Award size={20}/>{t("Level &amp; badges").replace("&amp;","&")}<span className="wla-end">{t("Lv")}{' '}{levelOf(s).lv}<ChevronRight size={18}/></span></button>}
   {signedIn&&<button type="button" className="wla-row" onClick={onCreations}><BookMarked size={20}/>{t("My Creations")}<span className="wla-end">{s?.work.length||0}<ChevronRight size={18}/></span></button>}
   {signedIn&&onContext&&<button type="button" className="wla-row" onClick={onContext}><UserRound size={20}/>{t("Personal setup")}<span className="wla-end"><ChevronRight size={18}/></span></button>}
   {signedIn&&<button type="button" className="wla-row" onClick={onPrefs}><SlidersHorizontal size={20}/>{t("Learning preferences")}<span className="wla-end"><ChevronRight size={18}/></span></button>}
   <button type="button" className="wla-row" onClick={onLanguage}><Languages size={20}/>{t("Language")}<span className="wla-end">{languages[s?.profile?.language||'en']}<ChevronRight size={18}/></span></button>
   {signedIn&&ext('/settings?connect=whatsapp#whatsapp','Connect WhatsApp reminders',MessageCircle)}
  </div>
  <p className="wla-section">{t("ACCOUNT")}</p>
  <div className="wla-list">
   <button type="button" className="wla-row" onClick={onPlans}><CreditCard size={20}/>{t("Membership & plans")}<span className="wla-end"><ChevronRight size={18}/></span></button>
   {ext('/support','Help & support',LifeBuoy)}
   {signedIn&&<button type="button" className="wla-row" onClick={onSignOut}><LogOut size={20}/>{t("Sign out")}</button>}
  </div>
  <p className="wla-section">{t("LEGAL")}</p>
  <div className="wla-list">
   {ext('/privacy','Privacy policy',Shield)}{ext('/terms','Terms of use',FileText)}{ext('/refunds','Refunds',Receipt)}
   {signedIn&&ext('/settings','Delete my account',Trash2,true)}
  </div>
  <p className="wla-muted wla-center">{t("WhatsLearn · A venture of BrandMint AI Pvt. Ltd.")}<br/><small>{t("App version 1.0")}</small></p>
 </div>;
}

/** Guests get the website's free starter challenge with one real AI review a day. */
export function GuestHome({language,onSignIn}:{language:string;onSignIn:()=>void}){
 const t=appTranslator(language);
 const [track,setTrack]=useState<AgencyTrack|''>('');const [body,setBody]=useState(''),[busy,setBusy]=useState(false),[err,setErr]=useState('');
 const [fb,setFb]=useState<{quote:string;worked:string;improve:string;next:string;example?:string}|null>(null);
 const idx=agencyTracks.findIndex(t=>t.id===track);const task=track?agencyStory(language,track).copy.tasks[idx]:'';
 async function review(){setBusy(true);setErr('');const r=await api<{feedback?:typeof fb}>('/api/starter-feedback/guest',{method:'POST',body:{track,body,language}});setBusy(false);if(r.ok&&r.data.feedback)setFb(r.data.feedback);else setErr(r.data.error||'AI review is unavailable right now.')}
 return <div className="wla-stack">
  <div><h2 className="wla-h1 wla-tight">{t("Try a practical AI skill")}</h2><p className="wla-muted">{t("Start with a short task.")}</p></div>
  {!track?<div className="wla-hero-card"><p className="wla-hero-kicker">{t("Free starter task")}</p><p className="wla-hero-title">{t("About 3 minutes.")}</p><p className="wla-hero-sub">{t("One AI review included. No account needed.")}</p>
   <div className="wla-grid2">{agencyTracks.map((t,i)=>{const Icon=[Megaphone,Code,Clapperboard,Images][i];return <button key={t.id} type="button" className="wla-white" onClick={()=>{setTrack(t.id);setFb(null);setBody('')}}><Icon size={20}/><strong>{['Market','Build','Film','Story'][i]||t.label}</strong><small>{['Find the hook','Make it work','Set the scene','Tell it in frames'][i]}</small></button>})}</div></div>
  :<div className="wla-stack"><button type="button" className="wla-back" onClick={()=>setTrack('')}><ArrowLeft size={18}/>{t("Choose another skill")}</button>
   <label htmlFor="wla-starter" className="wla-q">{task}</label>
   <textarea id="wla-starter" rows={5} maxLength={400} value={body} onChange={e=>{setBody(e.target.value);setFb(null)}} placeholder={t("Write it in your own words. There’s no wrong answer — the AI will help you improve it.")}/>
   <small className="wla-muted">{t("{0}/400 · One or two sentences of your own",[body.length])}</small>
   {err&&<p className="wla-error" role="alert">{err}</p>}
   <button type="button" className="wla-primary wla-full" disabled={busy||body.trim().length<10} onClick={review}>{busy?t("Reading your answer…"):t("Get my free AI review")}</button>
   {fb&&<div className="wla-card wla-review"><p className="wla-kicker">{t("AI FEEDBACK ON YOUR ANSWER")}</p><p className="wla-read"><strong>{t("What worked:")}</strong> {fb.worked}</p><p className="wla-read"><strong>{t("Improve:")}</strong> {fb.improve}</p><p className="wla-read"><strong>{t("Next:")}</strong> {fb.next}</p>{fb.example&&<p className="wla-read"><strong>{t("Example revision:")}</strong> {fb.example}</p>}
    <button type="button" className="wla-outline wla-full" onClick={()=>void shareStarterCard(['Marketing','Build','Film','Story'][idx]||'skills',body,fb.worked)}><Share2 size={18}/>{t("Share my answer")}</button></div>}
  </div>}
  {/* Right after the first review is when a learner is most likely to want tomorrow's task. */}
  {fb?<div className="wla-hero-card wla-next-day"><p className="wla-hero-kicker">{t("Nice work")}</p><p className="wla-hero-title">{t("Day 2 unlocks tomorrow.")}</p><p className="wla-hero-sub">{t("Create a free account and connect WhatsApp, and we’ll nudge you when it’s ready.")}</p><button type="button" className="wla-mint" onClick={onSignIn}><BellRing size={18}/>{t("Remind me tomorrow")}</button></div>
  :<div className="wla-card"><strong>{t("Save your progress")}</strong><p className="wla-muted">{t("Sign in to start a full course, save your work, get 3 AI reviews a day and connect WhatsApp.")}</p><button type="button" className="wla-primary wla-full" onClick={onSignIn}>{t("Sign in or create an account")}</button></div>}
 </div>;
}
