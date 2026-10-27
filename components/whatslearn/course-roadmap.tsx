'use client';
import {needsMembership} from '@/lib/mission-access';
import type {Mission} from '@/lib/missions';
import {courseRoadmap} from '@/lib/course-roadmap';
import {courseLearningTopics} from '@/lib/course-learning-topics';
import {programmeNames} from '@/lib/programmes';

export default function CourseRoadmap({track,completed,cleared,onOpen,onCheckpoint,paidAccess=false}:{paidAccess?:boolean;track:string;completed:ReadonlySet<string>;cleared:ReadonlySet<string>;onOpen:(m:Mission)=>void;onCheckpoint?:(track:string,after:number)=>void}){
 const rows=courseRoadmap(track,completed,cleared),count=rows.filter(r=>r.status==='complete').length,next=rows.find(r=>r.status==='current');
 const phases=[{name:'Basics',start:1,end:3},{name:'Practice',start:4,end:7},{name:'Final project',start:8,end:10}];
 function action(r:typeof rows[number]){
  if(needsMembership(r.mission,paidAccess))return <a className="outline" href="/membership">See plans</a>;
  if(r.lock.checkpoint&&r.status==='current')return <button className="outline" onClick={()=>onCheckpoint?.(r.lock.checkpoint!.track,r.lock.checkpoint!.after)}>Open mini challenge</button>;
  return <button className="outline" disabled={r.lock.locked} onClick={()=>onOpen(r.mission)}>{r.status==='complete'?'Review my work':r.lock.locked?'Locked':'Open task'}</button>;
 }
 return <section id="course-roadmap" className="course-roadmap" aria-label={programmeNames[track]+' roadmap'}>
  <div className="roadmap-heading"><div><span className="play-label">YOUR LEARNING ROADMAP</span><h2>{programmeNames[track]}</h2></div><strong>{count}/10 <small>tasks saved</small></strong></div>
  <div className="roadmap-phases" aria-label="Course stages">{phases.map((phase,i)=><div key={phase.start} className={next&&next.day>=phase.start&&next.day<=phase.end?'active':''}><strong>{i+1}. {phase.name}</strong><p>{courseLearningTopics[track]?.[i]}</p><span>Days {phase.start}–{phase.end}</span></div>)}</div>
  <progress max={10} value={count} aria-label="Course tasks completed"/>
  <p className="roadmap-access">{paidAccess?'All 10 tasks included.':'First 3 tasks free. A paid plan unlocks tasks 4–10.'} One new task a day.</p>
  {next&&<div className="roadmap-next"><span className="play-label">NEXT · DAY {next.day}</span><h3>{next.deliverable}</h3>{next.lock.locked&&<p>{next.lock.message}</p>}{action(next)}</div>}
  <details className="roadmap-task-details"><summary>View all 10 tasks</summary><ol>{rows.map(r=><li key={r.mission.id} className={'roadmap-day '+r.status} aria-current={r.status==='current'?'step':undefined}><span className="roadmap-number">{r.status==='complete'?'✓':r.day}</span><div><span className="play-label">DAY {r.day} · {r.status==='complete'?'SAVED':r.status==='current'?'NEXT':'UPCOMING'}</span><h3>{r.deliverable}</h3><p>{r.mission.minutes} min</p>{r.lock.locked&&r.status==='current'&&<p>{r.lock.message}</p>}</div>{action(r)}</li>)}</ol></details>
  {count===10&&<div className="roadmap-finish"><h3>Course complete.</h3><p>Your final project is ready to revisit and improve.</p><button className="primary" onClick={()=>onOpen(rows[9].mission)}>Improve my project</button></div>}
 </section>;
}
