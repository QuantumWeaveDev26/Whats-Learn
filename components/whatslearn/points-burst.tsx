'use client';
import {useEffect} from 'react';
export type Burst={key:number;kind:'welcome'|'earned'|'clue';title:string;detail:string};
const particles={welcome:14,earned:8,clue:0};
/**
 * A brief, quiet celebration for points: a message that stays readable for a few seconds, with a few small dots rising for welcome and mission points.
 * No sound. With reduced motion the message appears without any movement and no dots are drawn. Announced politely to screen readers. Dismisses itself or on request.
 */
export default function PointsBurst({burst,onDone}:{burst:Burst|null;onDone:()=>void}){
 // Read when a message is actually shown (never on the server). If the setting cannot be read, treat it as reduced motion.
 let calm=true;if(burst){try{calm=window.matchMedia('(prefers-reduced-motion: reduce)').matches}catch{calm=true}}
 useEffect(()=>{if(!burst)return;const t=setTimeout(onDone,calm?6000:4200);return()=>clearTimeout(t)},[burst,calm,onDone]);
 if(!burst)return null;
 const n=calm?0:particles[burst.kind];
 return <div className={`points-burst points-burst-${burst.kind}`} role="status" aria-live="polite" data-motion={calm?'reduced':'full'}>
  {n>0&&<span className="points-dots" aria-hidden="true">{Array.from({length:n},(_,i)=><i key={i} style={{'--i':i,'--n':n} as React.CSSProperties}/>)}</span>}
  <strong>{burst.title}</strong><span>{burst.detail}</span><button type="button" className="text-button" onClick={onDone} aria-label="Dismiss this message">Dismiss</button>
 </div>;
}
