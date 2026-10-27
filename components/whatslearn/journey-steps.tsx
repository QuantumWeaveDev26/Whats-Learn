'use client';
import {useState} from 'react';
import {Plus,Minus} from 'lucide-react';

const steps=[
 {n:'01',title:'Choose your course.',text:'After the starter, choose your goal, level and language.'},
 {n:'02',title:'Do one practical task.',text:'Each course task is called a mission. Solve an everyday problem and make something useful.'},
 {n:'03',title:'Get feedback. Keep learning.',text:'Improve your work, then open your next task. Find saved work in My Creations on your dashboard.'}
];

export default function JourneySteps({hasCourse=false}:{hasCourse?:boolean}={}){
 const [open,setOpen]=useState<string[]>([]);
 return <>{steps.map(step=>{
  const expanded=open.includes(step.n);
  return <div className="how-step" key={step.n}>
   <h3><button className="how-step-toggle" aria-expanded={expanded} aria-controls={`journey-step-${step.n}`} onClick={()=>setOpen(current=>expanded?current.filter(n=>n!==step.n):[...current,step.n])}>
    <span className="how-step-number">{step.n}</span><span className="how-step-title">{hasCourse&&step.n==='01'?'Open your current task.':step.title}</span>
    {expanded?<Minus size={21} aria-hidden="true"/>:<Plus size={21} aria-hidden="true"/>}
   </button></h3>
   <div id={`journey-step-${step.n}`} className="how-step-detail" hidden={!expanded}><p>{hasCourse&&step.n==='01'?'Your course is saved. Open My Journey to pick up your current task.':step.text}</p></div>
  </div>;
 })}</>;
}
