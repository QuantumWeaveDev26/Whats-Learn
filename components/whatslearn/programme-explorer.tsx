'use client';
import {useEffect,useState} from 'react';
import {ArrowUpRight,Plus,Minus,Check} from 'lucide-react';
import {courseOutcomes} from '@/lib/course-roadmap';
import {courseExamples} from '@/lib/starter-examples';
import {programmes} from '@/lib/programmes';
import {homePrimaryAction,type HomeLearner} from '@/lib/home-learner';
export default function ProgrammeExplorer({learner={status:'loading'}}:{learner?:HomeLearner}={}){
 const currentId=learner.status==='account'?learner.courseId:null;
 const [selected,setSelected]=useState<string|null>(null);
 useEffect(()=>setSelected(null),[currentId]);
 const open=selected===null?currentId||'':selected;
 const nextAction=homePrimaryAction(learner);
 const visibleProgrammes=[...programmes].sort((a,b)=>Number(b.id===currentId)-Number(a.id===currentId));
 return <section id="paths" className="programme-section">
  <div className="programme-heading"><p className="chapter-label">{currentId?'YOUR COURSE. YOUR PROGRESS.':'FOUR PROGRAMMES. YOUR KIND OF POSSIBILITY.'}</p>
   <h2>{currentId?<>Keep building.<br/><em>Your course is ready.</em></>:learner.status==='loading'?<>Practical skills.<br/><em>Real possibilities.</em></>:<>What do you want<br/>to <em>be able to do?</em></>}</h2>
   <p>{currentId?'Continue your current course, or explore another when you’re ready.':<>10 days. 10 practical tasks.<br/>One new task a day. Take longer if you need.</>}</p>
  </div>
  <div className="programme-list">{visibleProgrammes.map(p=>{
   const current=p.id===currentId,progress=learner.status==='account'?learner.progress?.[p.id]:undefined;
   return <article className={'programme-row '+p.color+(open===p.id?' is-selected':'')+(current?' is-current-course':'')} key={p.id}>
    <button aria-expanded={open===p.id} aria-controls={'programme-'+p.id} onClick={()=>setSelected(open===p.id?'':p.id)}><span>{p.number}</span>
     <h3>{p.name}{current&&<span className="current-course-badge"><Check size={15} aria-hidden="true"/> Your course{progress?` · ${progress.saved}/${progress.total} saved`:''}</span>}
      {!current&&progress&&progress.saved>0&&<span className="current-course-badge">{progress.saved}/{progress.total} saved</span>}
      <small>10-DAY COURSE · 10 PRACTICAL TASKS · FIRST 3 TASKS FREE</small><span className="course-outcome">Create: {p.finishedOutcome}</span></h3>
     {open===p.id?<Minus size={25}/>:<Plus size={25}/>}</button>
    {open===p.id&&<div id={'programme-'+p.id} className="programme-detail"><div><h4>{current?progress&&progress.saved===progress.total?'You finished this course.':'Your next step is in My Journey.':p.headline}</h4>
     <span className="play-label">10-DAY FOUNDATION COURSE · FIRST 3 MISSIONS FREE</span><p>{courseOutcomes[p.id]}</p><p className="small">Make it. Test it. Improve it.</p>
     <details className="course-example" lang="en"><summary>See an example you could create</summary><strong>{courseExamples[p.id]?.title}</strong><p>{courseExamples[p.id]?.artifact}</p><small>Illustrative project in English, not a learner submission or a tested result.</small></details>
     <span className="programme-preview">You’ll build: {p.steps[0]}</span>
     <a className={current||!currentId?'wl-button':'text-button'} href={current?nextAction.href:currentId?'/learn?view=paths&track='+p.id+'#course-roadmap':'/find-my-path?track='+p.id}>{current?nextAction.label:currentId?'Explore this course':'Choose this course'} <ArrowUpRight size={18}/></a>
     {current&&<a className="text-button" href="/find-my-path">Change my course <ArrowUpRight size={16}/></a>}
    </div><div className="programme-roadmap"><span>YOUR FIRST THREE STEPS</span>{p.steps.map((s,i)=><p key={s}><b>0{i+1}</b>{s}</p>)}
     <a href={'/learn?view=paths&track='+p.id+'#course-roadmap'}>See the 10-day roadmap →</a>{!current&&<a href={'/learn?mission='+p.first}>Try a sample challenge <ArrowUpRight size={16}/></a>}
    </div></div>}
   </article>;
  })}</div>
 </section>;
}
