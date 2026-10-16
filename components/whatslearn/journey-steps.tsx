'use client';
import {useState} from 'react';
import {Plus,Minus} from 'lucide-react';

const steps=[
 {n:'01',title:'Bring your ambition.',text:'Pick your goal, level and language.'},
 {n:'02',title:'Meet a real-world challenge.',text:'Solve a realistic problem. Make something useful.'},
 {n:'03',title:'Make. Reflect. Level up.',text:'Get feedback. Improve your work. Grow your portfolio.'}
];

export default function JourneySteps(){
 const [open,setOpen]=useState<string[]>(['01']);
 return <>{steps.map(step=>{
  const expanded=open.includes(step.n);
  return <div className="how-step" key={step.n}>
   <h3><button className="how-step-toggle" aria-expanded={expanded} aria-controls={`journey-step-${step.n}`} onClick={()=>setOpen(current=>expanded?current.filter(n=>n!==step.n):[...current,step.n])}>
    <span className="how-step-number">{step.n}</span><span className="how-step-title">{step.title}</span>
    {expanded?<Minus size={21} aria-hidden="true"/>:<Plus size={21} aria-hidden="true"/>}
   </button></h3>
   <div id={`journey-step-${step.n}`} className="how-step-detail" hidden={!expanded}><p>{step.text}</p></div>
  </div>;
 })}</>;
}
