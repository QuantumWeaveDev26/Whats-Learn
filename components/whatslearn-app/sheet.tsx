'use client';
import {useEffect,useRef,type KeyboardEvent,type ReactNode} from 'react';
import {X} from 'lucide-react';

/** App-only sheet: keep focus inside it and return to the opening control. */
export function AppSheet({title,onClose,children,returnFocusTo,closeLabel='Close plans'}:{title:string;onClose:()=>void;children:ReactNode;returnFocusTo?:HTMLElement|null;closeLabel?:string}){
 const panel=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const trigger=returnFocusTo||document.activeElement as HTMLElement|null;
  panel.current?.querySelector<HTMLButtonElement>('[data-sheet-close]')?.focus();
  return()=>{if(trigger?.isConnected)trigger.focus()};
 },[onClose,returnFocusTo]);
 function onKeyDown(e:KeyboardEvent<HTMLDivElement>){
  if(e.key==='Escape'){e.preventDefault();onClose();return}
  if(e.key!=='Tab')return;
  const controls=Array.from(panel.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')||[]).filter(el=>el.getClientRects().length);
  const first=controls[0],last=controls.at(-1);
  if(!first){e.preventDefault();panel.current?.focus();return}
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
 }
 return <div className="wla-scrim" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
  <div ref={panel} className="wla-sheet" role="dialog" aria-modal="true" aria-labelledby="wla-sheet-t" tabIndex={-1} onKeyDown={onKeyDown}>
   <span className="wla-grab" aria-hidden="true"/><div className="wla-sheet-head"><h2 id="wla-sheet-t" className="wla-h2">{title}</h2><button type="button" className="wla-close" aria-label={closeLabel} data-sheet-close onClick={onClose}><X size={20}/></button></div>
   {children}
  </div>
 </div>;
}
