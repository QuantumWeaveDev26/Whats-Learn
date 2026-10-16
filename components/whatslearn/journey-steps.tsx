'use client';
import {useState} from 'react';
import {Plus,Minus} from 'lucide-react';

const steps=[
 {n:'01',title:'Bring your ambition.',text:'Choose your goal, starting point and language. Your journey should fit you.'},
 {n:'02',title:'Meet a real-world challenge.',text:'A local business. A useful app. A story worth telling. Learn one idea, then put it to work.'},
 {n:'03',title:'Make. Reflect. Level up.',text:'Check your decisions, improve your work and collect practice XP. Build a portfolio one small win at a time.'}
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
