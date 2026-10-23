'use client';
import {ArrowRight,BookOpen,CheckCircle2,FolderOpen,MessageCircle} from 'lucide-react';
import {programmes} from '@/lib/programmes';
import {homePrimaryAction,type HomeLearner} from '@/lib/home-learner';

export default function HomeCourseCard({learner}:{learner:HomeLearner}){
 if(learner.status!=='account')return null;
 const course=programmes.find(p=>p.id===learner.courseId);if(!course)return null;
 const progress=learner.progress?.[course.id],action=homePrimaryAction(learner);
 const percent=progress&&progress.total?Math.max(0,Math.min(100,100*progress.saved/progress.total)):0;
 const complete=progress&&progress.saved===progress.total;
 return <aside className="visual-chat home-course-card" aria-label="Your current course">
  <header><div><span className="agency-case-label">YOUR CURRENT COURSE</span><h2>{course.name}</h2></div><BookOpen size={30} aria-hidden="true"/></header>
  <div className="home-course-body">
   <div className="home-course-progress"><div className="home-course-ring" role="progressbar" aria-busy={!progress} aria-label="Course tasks saved" aria-valuenow={progress?.saved} aria-valuemin={0} aria-valuemax={progress?.total||10}>
    <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52"/><circle cx="60" cy="60" r="52" pathLength="100" strokeDasharray={`${percent} 100`}/></svg>
    <strong>{progress?`${progress.saved}/${progress.total}`:'…'}</strong>
   </div><div><span className="label">{complete?'COURSE COMPLETED':'YOUR PROGRESS'}</span><p role="status">{progress?complete?'Your creations are ready to revisit.':`${progress.saved} of ${progress.total} tasks saved`:'Loading your saved progress…'}</p></div></div>
   <p className="home-course-outcome"><strong>You’re building</strong>{course.finishedOutcome}.</p>
   <a className="primary account-full" href={action.href}>{action.label}<ArrowRight size={19}/></a>
   <div className="home-course-rhythm" aria-label="Your learning steps"><span><BookOpen size={19}/>Open your task</span><span><MessageCircle size={19}/>Get feedback</span><span><CheckCircle2 size={19}/>Keep improving</span></div>
   {!complete&&<a className="text-button" href="/learn?view=portfolio"><FolderOpen size={17}/>My Creations</a>}
  </div>
 </aside>;
}
