'use client';
import {useEffect,useRef,useState} from 'react';

const hints=[
 {target:'.lesson-steps',title:'Follow your mission',text:'Discover the idea, make your work, review it, then see your saved result.'},
 {target:'[data-tour="mission-work"]',title:'Make it here',text:'Complete the practical task here. Include the evidence and test results requested by the brief.'},
 {target:'[data-tour="mission-review"]',title:'Review your work',text:'This button opens your review. It becomes available when both tasks meet the required format.'},
 {target:'[data-tour="mission-submit"]',title:'Evaluate and save',text:'Confirm the checklist, then submit here. Only accepted work completes the mission. Work needing changes stays a draft.'},
];
export default function MissionTour(){
 const root=useRef<HTMLDivElement>(null),[index,setIndex]=useState<number|null>(null),[items,setItems]=useState(hints);
 useEffect(()=>{if(index===null)return;const dialog=root.current?.closest('[role="dialog"]');const target=dialog?.querySelector<HTMLElement>(items[index]?.target);target?.classList.add('mission-tour-target');target?.scrollIntoView({block:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});return()=>target?.classList.remove('mission-tour-target')},[index,items]);
 function start(){const dialog=root.current?.closest('[role="dialog"]');const visible=hints.filter(h=>{const el=dialog?.querySelector<HTMLElement>(h.target);return !!el&&el.getBoundingClientRect().height>0});if(visible.length){setItems(visible);setIndex(0)}}
 return <div ref={root} className="mission-tour-help" onKeyDown={e=>{if(e.key==='Escape'&&index!==null){e.preventDefault();e.stopPropagation();setIndex(null)}}}>{index===null?<button type="button" className="text-button" onClick={start}>Tour this screen</button>:<section className="mission-tour-note" aria-label="Mission screen tour"><div aria-live="polite"><small>{index+1} / {items.length}</small><strong>{items[index].title}</strong><p>{items[index].text}</p></div><div className="website-tour-actions"><button type="button" onClick={()=>setIndex(null)}>Close</button>{index>0&&<button type="button" onClick={()=>setIndex(index-1)}>Back</button>}<button type="button" className="website-tour-next" onClick={()=>setIndex(index+1<items.length?index+1:null)}>{index+1===items.length?'Done':'Next'}</button></div></section>}</div>;
}
