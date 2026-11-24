'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {Check,ArrowLeft,Clock} from 'lucide-react';
import type {Mission} from '@/lib/missions';
import {composeAnswer,emptyAnswer,LIMITS,type Answer} from '@/lib/practical';
import {wrongAnswerMessage} from '@/lib/submission';
import {api,readLocal,writeLocal} from './api';
import {learningGuide} from './learning-guide';
import {addVersion,answerBody,draftKey,feedbackOf,historyKey,missingParts,restoreDraft,type Evidence,type Feedback,type Step} from './learning-state';
import {FeedbackCard} from './feedback';
import {appTranslator,appMissionTitle} from './app-language';
import {withKannadaLesson} from './kannada-lessons';

export type Saved={points?:number;balance?:number;message:string;status:string;track?:string};
const practiceChecks: Record<string,{question:string;options:[string,string];answer:0|1;why:string}> = {
 m1:{question:'A bike shop wants more commuters to book a repair. Which first line gives them a reason to act?',options:['Your local repair experts','Flat tyre on your commute? Ask about today’s repair slots.'],answer:1,why:'It names the rider’s problem and gives a clear next action.'},
 d1:{question:'A library hold fails to save. What should the page show?',options:['Keep the book selected and offer Retry','Show Hold saved immediately'],answer:0,why:'A confirmation should follow a successful save. Keeping the selection makes recovery easier.'},
 f1:{question:'Which line makes a scene easier to picture?',options:['A person feels sad one day','A baker sets aside an untouched slice on their father’s birthday'],answer:1,why:'The small action suggests emotion and gives the viewer something concrete to see.'},
 v1:{question:'A character drops a key in frame one. Which next frame moves the story forward?',options:['They search under the table','The same key drops again with no new information'],answer:0,why:'The search shows what the character does about the problem and sets up a possible ending.'},
};
type Props={accountKey:string;mission:Mission;position:number;language:string;online?:boolean;initialAnswer?:Answer;onSaved:(s:Saved)=>void;onUpgrade:()=>void;onBack:()=>void;onPoints?:()=>void};
export function MissionFlow({accountKey,mission:sourceMission,position,language,online=true,initialAnswer,onSaved,onUpgrade,onBack,onPoints}:Props){
 const t=appTranslator(language);
 const mission=withKannadaLesson(sourceMission,language);
 const key=draftKey(accountKey,mission.id),guide=learningGuide(mission);
 const [initial]=useState(()=>restoreDraft(readLocal(key),mission,language,initialAnswer||emptyAnswer()));
 const [step,setStep]=useState<Step>(initial.step),[part,setPart]=useState(initial.part);
 const [answer,setAnswer]=useState<Answer>(initial.answer),[evidence,setEvidence]=useState<Evidence>(initial.evidence);
 const [quizPassed,setQuizPassed]=useState(initial.quizPassed),[missed,setMissed]=useState<number[]>([]),[checks,setChecks]=useState(initial.checks);
 const [practicePick,setPracticePick]=useState<number|null>(null);
 const [review,setReview]=useState<Feedback|null>(initial.review),[allow,setAllow]=useState<{limit?:number;used?:number}>({});
 const [reviewBody,setReviewBody]=useState(initial.review?composeAnswer(mission.practical,{...initial.answer,reasoning:answerBody(initial.answer,initial.evidence)}):'');
 const [busy,setBusy]=useState(''),[err,setErr]=useState(''),[leaving,setLeaving]=useState(false),[help,setHelp]=useState<''|'simple'|'example'>('');
 const [attempted,setAttempted]=useState(false),[focusPart,setFocusPart]=useState(''),[draftSaved,setDraftSaved]=useState(true);
 const heading=useRef<HTMLHeadingElement>(null),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[]);
 const body=useMemo(()=>composeAnswer(mission.practical,{...answer,reasoning:answerBody(answer,evidence)}),[mission.practical,answer,evidence]);
 const latestBody=useRef(body);latestBody.current=body;
 const hasDraft=quizPassed||Object.entries(answer.fields).some(([id,value])=>value!==(initialAnswer?.fields[id]??mission.practical?.fields.find(field=>field.id===id)?.starter??''))||answer.reasoning!==(initialAnswer?.reasoning??'')||answer.link!==(initialAnswer?.link??'')||Object.values(evidence).some(value=>value.trim());
 const fields=mission.practical?.fields||[],missing=missingParts(mission,answer,evidence);
 const total=fields.length+5,complete=total-new Set(missing.filter(x=>x.id!=='f-link').map(x=>x.id)).size;
 const left=allow.limit===undefined?undefined:Math.max(0,allow.limit-(allow.used||0));
 const steps:Step[]=['learn','check','make','self','review'],at=steps.indexOf(step);
 const stepNames=['Learn','Check','Make','Self-check','Review'].map(label=>t(label));
 useEffect(()=>{const ok=writeLocal(key,JSON.stringify({v:2,answer,evidence,step,part,checks,quiz:quizPassed?mission.answer:null,language,level:mission.practiceLevel||'practising',review,reviewBody}));setDraftSaved(ok!==false)},[key,answer,evidence,step,part,checks,quizPassed,mission.answer,mission.practiceLevel,language,review,reviewBody]);
 useEffect(()=>{let active=true;api<{limit?:number;used?:number}>('/api/feedback').then(r=>{if(active&&r.ok)setAllow(r.data)});return()=>{active=false}},[]);
 useEffect(()=>{heading.current?.scrollIntoView({block:'start'});heading.current?.focus({preventScroll:true})},[step]);
 useEffect(()=>{if(!focusPart)return;const field=document.getElementById(focusPart);field?.focus();field?.scrollIntoView({block:'center',behavior:'smooth'});setFocusPart('')},[focusPart,part,step]);
 function changeAnswer(a:Answer){setAnswer(a);setReview(null);setReviewBody('');setErr('')}
 function changeEvidence(id:keyof Evidence,value:string){setEvidence(e=>({...e,[id]:value}));setReview(null);setReviewBody('');setErr('')}
 function nextMissing(){const next=missing[0];if(!next)return;setAttempted(true);setStep('make');setPart(next.part);setFocusPart(next.id)}
 function go(next:Step){setErr('');setStep(next)}
 const instructions=<ol className="wla-guide-steps">{guide.steps.map((line,i)=><li key={i}>{t(line)}</li>)}</ol>;
 const practiceCheck=language==='en'?practiceChecks[mission.id]:undefined;
 const problem=(id:string)=>attempted?missing.find(x=>x.id===id)?.message:undefined;
 const common=(id:string)=>({'aria-required':true as const,'aria-invalid':!!problem(id),'aria-describedby':id+'-help'});
 const note=(id:string,hint?:string)=><small id={id+'-help'} className={problem(id)?'wla-field-error':undefined}>{problem(id)?(language==='kn'?'ಮುಂದುವರಿಯಲು ಈ ಕ್ಷೇತ್ರವನ್ನು ಪರಿಶೀಲಿಸಿ.':problem(id)):hint}</small>;
 function remember(r:Feedback){writeLocal(historyKey(accountKey,mission.id),addVersion(readLocal(historyKey(accountKey,mission.id)),body,r,new Date().toISOString()))}
 async function getReview(){
  if(missing.length){nextMissing();return}setErr('');if(left===0){onUpgrade();return}setBusy('review');
  const r=await api<{review?:unknown;limit?:number;used?:number}>('/api/feedback',{method:'POST',body:{action:'review',quiz:mission.answer,missionId:mission.id,body,language}});
  if(!alive.current)return;setBusy('');
  if(latestBody.current!==body){setErr('Your work changed during the review. Review the current version when you are ready.');return}
  if(r.status===403){onUpgrade();return}const parsed=feedbackOf(r.data.review);
  if(!r.ok||!parsed){setErr(r.data.error||'The review could not finish. Your draft is still here. Try again when you are ready.');return}
  setReview(parsed);setReviewBody(body);remember(parsed);setAllow({limit:r.data.limit,used:r.data.used});go('review');
 }
 async function save(){
  if(!review||reviewBody!==body){setErr('Review your current work before saving.');return}setErr('');setBusy('save');
  const r=await api<{saved?:boolean;review?:unknown;award?:{status:string;message:string;score?:{points:number};balance?:number}}>('/api/work',{method:'POST',body:{missionId:mission.id,body,checks,quiz:mission.answer}});
  if(!alive.current)return;setBusy('');
  if(r.status===403&&/plan|Explore/i.test(r.data.error||'')){onUpgrade();return}
  if(!r.ok||r.data.saved!==true){const corrected=feedbackOf(r.data.review);if(corrected){setReview(corrected);setReviewBody(body);remember(corrected)}setErr(r.data.award?.message||r.data.error||'Your work was not confirmed saved. Keep this draft and try again.');return}
  const finalReview=feedbackOf(r.data.review);if(finalReview)remember(finalReview);
  if(latestBody.current!==body){setErr('The submitted version was saved. Your newer edits remain on this device; review them before saving again.');onPoints?.();return}writeLocal(key,'');
  onSaved({track:mission.track,points:r.data.award?.score?.points,balance:r.data.award?.balance,message:r.data.award?.message||'',status:r.data.award?.status||'saved'});
 }
 return <div className="wla-stack wla-practice-flow">
  <div className="wla-practice-top"><button type="button" className="wla-back" disabled={busy==='save'} onClick={()=>step==='learn'||step==='check'?onBack():setLeaving(true)}><ArrowLeft size={18}/>{t("All tasks")}</button><span className="wla-kicker">{t("Task")} {String(position).padStart(2,'0')} / 10</span></div>
  {leaving&&<div className="wla-card wla-confirm" role="alertdialog" aria-labelledby="wla-leave-t"><strong id="wla-leave-t">{t("Leave this task?")}</strong><p className="wla-muted">{draftSaved?t("Your draft and current step are saved on this device."):t("This device could not save your draft. Copy your work before leaving.")}</p><div className="wla-row-btns"><button type="button" className="wla-ghost" onClick={()=>setLeaving(false)}>{t("Stay")}</button><button type="button" className="wla-outline" onClick={onBack}>{t("Leave")}</button></div></div>}
  <div className="wla-practice-progress" aria-label={t("Step {0} of 5: {1}",[at+1,stepNames[at]])}><strong>{stepNames[at]} <small>{at+1}/5</small></strong><div className="wla-steps">{steps.map((s,i)=><span key={s} aria-current={s===step?'step':undefined} className={(i<=at?'on':'')+(s===step?' now':'')}><i aria-hidden="true"/><span className="wla-sr">{stepNames[i]}</span></span>)}</div></div>
  <h2 ref={heading} tabIndex={-1} className="wla-h2">{appMissionTitle(mission.id,mission.title,language)}</h2>
  {step==='learn'&&<p className="wla-meta"><Clock size={15}/>{t("About")} {mission.minutes} {t("min")}</p>}
  {hasDraft&&!leaving&&<p className={draftSaved?'wla-draft-status':'wla-error'} role="status">{draftSaved?(online?t("Draft saved on this phone"):t("Draft saved on this phone. Reconnect to submit.")):t("Couldn’t save this draft. Copy your work before leaving.")}</p>}
  {step==='learn'&&<>
   <div className="wla-card wla-tint"><p>{t(mission.brief)}</p></div>
   <div className="wla-card"><strong>{t("What to do")}</strong>{instructions}</div>
   <details className="wla-disclosure"><summary>{t("The idea behind it")}</summary><p className="wla-read">{t(mission.lesson)}</p></details>
   <button type="button" className="wla-primary wla-full" onClick={()=>go('check')}>{t("Check my understanding")}</button>
   {quizPassed&&<button type="button" className="wla-ghost wla-full" onClick={()=>go('make')}>{t("Return to my work")}</button>}
  </>}
  {step==='check'&&<>
   <button type="button" className="wla-back" onClick={()=>go('learn')}><ArrowLeft size={16}/>{t("Back to lesson")}</button>
   <h3 className="wla-q">{t(mission.question)}</h3>
   <div className="wla-options">{mission.options.map((o,i)=><button key={i} type="button" disabled={missed.includes(i)} className={'wla-option'+(missed.includes(i)?' off':'')} onClick={()=>{if(i===mission.answer){setQuizPassed(true);go('make')}else setMissed(x=>x.concat(i))}}><span>{t(o)}</span></button>)}</div>
   {missed.length>0&&<>
    <div className="wla-explain wla-round-feedback no" role="status"><div className="wla-feedback-message"><span className="wla-feedback-emoji" aria-hidden="true">💡</span><p>{language==='en'?wrongAnswerMessage(mission):t(mission.explanation)}</p></div></div>
    <details className="wla-disclosure"><summary>{t("Worked example")}{practiceCheck?" "+t("and extra practice"):''}</summary>
     <p className="wla-read">{language==='kn'&&/[\u0C80-\u0CFF]/.test(mission.example)?mission.example:t(guide.example[0])}</p>
     {practiceCheck?<fieldset className="wla-fieldset"><legend>{practiceCheck.question}</legend><div className="wla-options">{practiceCheck.options.map((option,index)=><button key={option} type="button" className="wla-option" aria-pressed={practicePick===index} onClick={()=>setPracticePick(index)}>{option}</button>)}</div>{practicePick!==null&&<p className="wla-muted" role="status">{practicePick===practiceCheck.answer?t("Correct."):t("Try the other choice.")}{practiceCheck.why}</p>}</fieldset>:<p className="wla-read">{t(guide.example[1])}</p>}
    </details>
   </>}
  </>}
  {step==='make'&&<>
   <button type="button" className="wla-back" onClick={()=>go('check')}><ArrowLeft size={16}/>{t("Back to check")}</button>
   <details className="wla-disclosure"><summary>{t("Task instructions")}</summary>{instructions}{mission.levelTask&&<p className="wla-read">{t(mission.levelTask)}</p>}</details>
   <div className="wla-form-progress"><strong>{language==='kn'?`${total} ಭಾಗಗಳಲ್ಲಿ ${complete} ಸಿದ್ಧ`:t("{0} of {1} parts ready",[complete,total])}</strong></div>
   <div className="wla-part-tabs" aria-label={t("Practical work sections")}>{['Your work','Test evidence','Your choices'].map((label,i)=><button type="button" key={label} aria-pressed={part===i} onClick={()=>setPart(i)}>{i+1}. {t(label)}</button>)}</div>
   {part===0&&<fieldset className="wla-fieldset"><legend>{t("Your work")}</legend>{fields.map(f=>{const id='f-'+f.id;return <div key={f.id} className="wla-field"><label htmlFor={id}>{t(f.prompt||f.label)}</label>{note(id,f.hint?t(f.hint):undefined)}
    {f.type==='choice'?<select id={id} {...common(id)} value={answer.fields[f.id]||''} onChange={e=>changeAnswer({...answer,fields:{...answer.fields,[f.id]:e.target.value}})}><option value="">{t("Choose one…")}</option>{(f.options||[]).map(o=><option key={o} value={o}>{t(o)}</option>)}</select>
    :f.type==='short'?<input id={id} {...common(id)} value={answer.fields[f.id]||''} maxLength={LIMITS.short} onChange={e=>changeAnswer({...answer,fields:{...answer.fields,[f.id]:e.target.value}})}/>
    :<textarea id={id} {...common(id)} className={f.type==='code'?'wla-code':''} rows={f.type==='code'?7:4} value={answer.fields[f.id]||''} maxLength={f.type==='code'?LIMITS.code:LIMITS.long} onChange={e=>changeAnswer({...answer,fields:{...answer.fields,[f.id]:e.target.value}})}/>}
   </div>})}<button type="button" className="wla-outline wla-full" onClick={()=>setPart(1)}>{t("Next: add test evidence")}</button></fieldset>}
   {part===1&&<fieldset className="wla-fieldset"><legend>{t("Show what you tried")}</legend><p className="wla-muted">{t("Share your actual results. Leave out passwords and personal details.")}</p>
    {([['artifact','Your artifact or relevant code','Paste a short relevant extract, or refer to the code field in Your work.',800],['test','The test you actually ran','What did you try, using which input or viewing conditions?',180],['result','What actually happened','Give the output or observation. Label an expected result separately.',180],['improvement','The improvement you made','What did you change after the test, and what happened next?',180]] as const).map(([name,label,hint,max])=>{const id='e-'+name;return <div className="wla-field" key={name}><label htmlFor={id}>{t(label)}</label>{note(id,t(hint))}<textarea id={id} {...common(id)} className={name==='artifact'&&mission.track==='development'?'wla-code':''} rows={name==='artifact'?6:3} maxLength={max} value={evidence[name]} onChange={e=>changeEvidence(name,e.target.value)}/></div>})}
    <button type="button" className="wla-outline wla-full" onClick={()=>setPart(2)}>{t("Next: explain your choices")}</button></fieldset>}
   {part===2&&<fieldset className="wla-fieldset"><legend>{t("Your choices")}</legend><div className="wla-field"><label htmlFor="f-reason">{t("Why did you make these choices?")}</label>{note('f-reason',t("Explain your reasoning in your own words. At least {0} characters.",[LIMITS.minReasoning]))}<textarea id="f-reason" {...common('f-reason')} rows={4} maxLength={LIMITS.reasoning} value={answer.reasoning} onChange={e=>changeAnswer({...answer,reasoning:e.target.value})}/></div>
    {mission.practical?.link&&<div className="wla-field"><label htmlFor="f-link">{t(mission.practical.link.label)} {t("· optional")}</label>{note('f-link',mission.practical.link.hint?t(mission.practical.link.hint):undefined)}<input id="f-link" aria-invalid={!!problem('f-link')} aria-describedby="f-link-help" inputMode="url" placeholder="https://" value={answer.link} maxLength={LIMITS.link} onChange={e=>changeAnswer({...answer,link:e.target.value})}/></div>}</fieldset>}
   <details className="wla-disclosure"><summary>{t("Free learning help")}</summary><div className="wla-help"><button type="button" aria-pressed={help==='simple'} onClick={()=>setHelp(help==='simple'?'':'simple')}>{t("Explain simply")}</button><button type="button" aria-pressed={help==='example'} onClick={()=>setHelp(help==='example'?'':'example')}>{t("Worked example · free")}</button></div>
    {help==='simple'&&<div className="wla-help-text"><p className="wla-read">{t("Make one small version, try it yourself, and show what you learned:")}</p>{instructions}</div>}
    {help==='example'&&<div className="wla-help-text"><p className="wla-kicker">{t("Illustration")}</p><p className="wla-read">{language==='kn'&&/[\u0C80-\u0CFF]/.test(mission.example)?mission.example:t(guide.example[0])}</p><p className="wla-read"><strong>{t("Try it in your own work:")}</strong> {t(guide.example[1])}</p><small className="wla-muted">{t("This is a teaching example, not an executed test or a completed submission. No points or AI reviews are used.")}</small></div>}
   </details>
   {answerBody(answer,evidence).length>LIMITS.reasoning*.85&&<p className="wla-muted">{t("Evidence and reasoning:")}{' '}{answerBody(answer,evidence).length}/{LIMITS.reasoning} {t("characters")}</p>}
   {missing.length>0?<button type="button" className="wla-primary wla-full" onClick={nextMissing}>{language==='kn'?`ಬಾಕಿ ಇರುವ ಭಾಗಕ್ಕೆ ಹೋಗಿ · ${missing.length} ಉಳಿದಿವೆ`:t("Go to next incomplete part · {0} left",[missing.length])}</button>:<button type="button" className="wla-primary wla-full" onClick={()=>go('self')}>{t("Next: check your work")}</button>}
  </>}
  {step==='self'&&<>
   <p className="wla-muted">{t("Check your work honestly. The AI will review it too.")}</p><div className="wla-options">{mission.checks.slice(0,5).map((c,i)=><button key={i} type="button" className={'wla-option'+(checks[i]?' on':'')} aria-pressed={checks[i]} onClick={()=>setChecks(checks.map((x,n)=>n===i?!x:x))}><span>{t(c)}</span>{checks[i]&&<Check size={18}/>}</button>)}</div>
   {err&&<p className="wla-error" role="alert">{t(err)}</p>}
   <button type="button" className="wla-primary wla-full" disabled={busy==='review'||!online} onClick={getReview}>{busy==='review'?t("Reading your work…"):`${t("Get AI review")}${left!==undefined?` · ${language==='kn'?`ಇಂದು ${left} ಉಳಿದಿವೆ`:t("{0} left today",[left])}`:''}`}</button><button type="button" className="wla-ghost wla-full" disabled={busy==='review'} onClick={()=>go('make')}>{t("Edit my work")}</button>
  </>}
  {step==='review'&&review&&<><FeedbackCard review={review} language={language}/>{err&&<p className="wla-error" role="alert">{t(err)}</p>}<button type="button" className="wla-primary wla-full" disabled={busy==='save'||!online} onClick={save}>{busy==='save'?t("Checking and saving…"):t("Save my task")}</button><button type="button" className="wla-ghost wla-full" disabled={busy==='save'} onClick={()=>go('make')}>{t("Improve it first")}</button></>}
 </div>;
}
