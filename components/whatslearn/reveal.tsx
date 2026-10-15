'use client';
import {useEffect} from 'react';
/**
 * Gentle scroll reveals. Only blocks that start below the visible screen get a short fade and 14px rise as they come into view, one after another (staggered by 70 ms, at most 5 steps).
 * Nothing on the first screen is ever hidden, and nothing is hidden when scripting is off or when motion is reduced. A block stays hidden only until it scrolls into view.
 * No scroll handling, no parallax, nothing blocks scrolling.
 */
const CARDS='.public-path,.path-card,.price-card,.membership-card,.rhythm-card,.strategy-card,.portfolio-card,.mission-card,.pulse-card,.sprint-stop';
const TARGETS=`main section,main .section-pad,${CARDS}`;
export default function Reveal(){
 useEffect(()=>{
  if(typeof IntersectionObserver==='undefined'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const seen=new WeakSet<Element>(),waiting=new Set<HTMLElement>();let frame=0;
  const show=(e:HTMLElement,i:number)=>{e.style.transitionDelay=`${Math.min(i,5)*70}ms`;e.classList.add('wl-in');
   setTimeout(()=>{e.classList.remove('wl-reveal','wl-in');e.style.transitionDelay=''},900+Math.min(i,5)*70);waiting.delete(e);io.unobserve(e)};
  const io=new IntersectionObserver(es=>{es.filter(x=>x.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top||a.boundingClientRect.left-b.boundingClientRect.left).forEach((x,i)=>show(x.target as HTMLElement,i))},{threshold:0.04,rootMargin:'0px 0px -6% 0px'});
  const scan=()=>{frame=0;document.querySelectorAll<HTMLElement>(TARGETS).forEach(e=>{
   if(seen.has(e)||e.closest('[role="dialog"],.will-arrive,.wl-reveal')||e.querySelector('.wl-reveal')||(!e.matches(CARDS)&&e.querySelector(CARDS)))return;seen.add(e);
   const r=e.getBoundingClientRect();if(r.height===0||r.top<innerHeight*1.0)return;
   e.classList.add('wl-reveal');waiting.add(e);io.observe(e)})};
  const later=()=>{if(!frame)frame=requestAnimationFrame(scan)};
  scan();const mo=new MutationObserver(later);mo.observe(document.body,{childList:true,subtree:true});
  return()=>{mo.disconnect();io.disconnect();if(frame)cancelAnimationFrame(frame);waiting.forEach(e=>{e.classList.remove('wl-reveal','wl-in');e.style.transitionDelay=''})};
 },[]);
 return null;
}
