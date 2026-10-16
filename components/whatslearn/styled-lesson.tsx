'use client';
import {useRef,useState} from 'react';
import {ArrowRight,Check,ChevronLeft,Gamepad2,MessageCircle,BookOpen,Zap,Flag} from 'lucide-react';
import type {Mission} from '@/lib/missions';
import {learningStyle,learningStyles,lessonFacts,styleLabels} from '@/lib/learning-styles';

type Props={mission:Mission;style?:string;language:string;choice?:number;onAnswer?:(choice:number)=>void;onContinue?:()=>void};
/** The presentation changes; the answer and finished work still use the shared mission assessment. */
export default function StyledLesson({mission,style,language,choice=-1,onAnswer,onContinue}:Props){
 const kind=learningStyle(style),t=styleLabels(language),[phase,setPhase]=useState(0),[fact,setFact]=useState(0);
 const heading=useRef<HTMLHeadingElement>(null),facts=lessonFacts(mission.lesson),correct=choice===mission.answer;
 const Icon={game:Gamepad2,casual:MessageCircle,story:BookOpen,facts:Zap}[kind];
 function advance(value:number){setPhase(value);requestAnimationFrame(()=>heading.current?.focus({preventScroll:true}))}
 const decision=<div className="style-decision">
  <span className="style-eyebrow">{kind==='game'?'CHECKPOINT · MAKE THE CALL':kind==='story'?'YOUR NEXT MOVE':kind==='casual'?'QUICK QUESTION FOR YOU':'CHECK YOUR UNDERSTANDING'}</span>
  <h4>{mission.question}</h4>
  <div className="style-decision-options" role="group" aria-label={t.question}>{mission.options.map((option,i)=><button type="button" key={i} aria-pressed={choice===i} onClick={()=>onAnswer?.(i)}><span className="style-option-letter">{String.fromCharCode(65+i)}</span><span>{option}</span>{choice===i&&<span aria-hidden="true">{correct?<Check size={19}/>: '↻'}</span>}</button>)}</div>
  {choice>=0&&<div className={'style-decision-result '+(correct?'is-correct':'try-again')} role="status"><strong>{correct?(kind==='game'?'Checkpoint cleared.':kind==='story'?'Here’s how that plays out.':'You’ve got it.'):'Try another move.'}</strong><p>{correct?mission.explanation:'No points lost. Revisit the idea, then choose again.'}</p>{correct&&<small>Understanding checked. Mission points are awarded when your completed work is saved.</small>}</div>}
  {!correct&&<details><summary>{t.idea}</summary><p>{mission.lesson}</p></details>}
  {correct&&<div className="style-next-move"><span>{kind==='game'?'NEXT LEVEL · CREATE':t.part}</span><p>{mission.task}</p><button type="button" className="primary" onClick={onContinue}>{kind==='game'?'Build my solution':kind==='story'?'Write my ending':kind==='casual'?'Let’s make it':'Apply this'} <ArrowRight size={17}/></button></div>}
 </div>;
 return <section className={'styled-lesson style-'+kind+' interactive-lesson'} aria-label={learningStyles[kind]} lang={language}>
  <div className="style-mode-heading"><span className="style-badge"><Icon size={15}/>{learningStyles[kind]}</span>{kind==='game'&&<span className="style-quest-status">{correct?'Decision cleared':'Quest in progress'}</span>}</div>
  <h3 ref={heading} tabIndex={-1}>{kind==='game'?'Your next small win':kind==='casual'?'Let’s talk it through':kind==='story'?'You’re in the scene':'The essentials. Then try it.'}</h3>
  {kind==='game'?<>
   <div className="quest-track" aria-label="Quest checkpoints"><button type="button" aria-current={phase===0?'step':undefined} onClick={()=>advance(0)}><span>{phase>0?<Check size={16}/>:1}</span>Get the brief</button><div aria-hidden="true"/><button type="button" aria-current={phase===1?'step':undefined} onClick={()=>advance(1)}><span>{correct?<Check size={16}/>:2}</span>Make the call</button><div aria-hidden="true"/><button type="button" disabled={!correct} onClick={onContinue}><span><Flag size={16}/></span>Create it</button></div>
   <div className="quest-meter" role="progressbar" aria-label="Quest preparation" aria-valuemin={0} aria-valuemax={3} aria-valuenow={correct?2:phase===1?1:0}><span style={{width:`${correct?66:phase===1?33:0}%`}}/></div>
   {phase===0?<div className="quest-brief"><span className="style-eyebrow">MISSION BRIEF · {mission.minutes} MIN</span><h4>{mission.title}</h4><p>{mission.brief}</p><div className="quest-rule"><Flag size={18}/><span>Make a decision. Create something useful. Review it to finish.</span></div><button type="button" className="primary" onClick={()=>advance(1)}>Start quest <ArrowRight size={17}/></button></div>:decision}
  </>:kind==='casual'?<>
   <div className="style-conversation"><p className="style-chat-bubble">{mission.brief}</p>{phase>=1&&<><span className="style-chat-reply">Okay, walk me through it.</span><p className="style-chat-bubble">{mission.lesson}</p></>}{phase>=2&&<span className="style-chat-reply">Got it. Let me try.</span>}</div>
   {phase===0?<button type="button" className="outline" onClick={()=>advance(1)}>Okay, walk me through it <ArrowRight size={17}/></button>:phase===1?<button type="button" className="primary" onClick={()=>advance(2)}>Let me try <ArrowRight size={17}/></button>:decision}
  </>:kind==='story'?<>
   <div className="story-scene"><span className="style-eyebrow">SCENE 01 · THE SETUP</span><blockquote>{mission.brief}</blockquote></div>
   {phase>=1&&<div className="story-turn"><span className="style-eyebrow">SCENE 02 · WHAT MATTERS</span><p>{mission.lesson}</p></div>}
   {phase===0?<button type="button" className="primary" onClick={()=>advance(1)}>Step into the story <ArrowRight size={17}/></button>:phase===1?<button type="button" className="primary" onClick={()=>advance(2)}>Make the next move <ArrowRight size={17}/></button>:decision}
  </>:<>
   <div className="fact-card"><span className="style-eyebrow">KEY FACT {fact+1} / {facts.length}</span><p>{facts[fact]}</p><div className="fact-controls"><button type="button" className="outline" disabled={fact===0} onClick={()=>setFact(fact-1)} aria-label="Previous fact"><ChevronLeft size={17}/></button><div className="fact-dots" role="group" aria-label="Choose a fact">{facts.map((_,i)=><button type="button" key={i} aria-label={`Fact ${i+1}`} aria-pressed={fact===i} onClick={()=>setFact(i)}>{i+1}</button>)}</div><button type="button" className="outline" disabled={fact===facts.length-1} onClick={()=>setFact(fact+1)} aria-label="Next fact"><ArrowRight size={17}/></button></div></div>
   {phase<2?<button type="button" className="primary" onClick={()=>advance(2)}>Check my understanding <ArrowRight size={17}/></button>:decision}
  </>}
  <details className="style-example"><summary>{t.example}</summary><p>{mission.example}</p></details>
  {phase>0&&<button type="button" className="text-button style-back" onClick={()=>advance(0)}><ChevronLeft size={15}/>Back to the brief</button>}
 </section>;
}
