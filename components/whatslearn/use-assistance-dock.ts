'use client';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';

/** Place help in the learning sidebar when it has a reserved space. */
export function useAssistanceDock(){
 const pathname=usePathname();
 const [host,setHost]=useState<HTMLElement|null>(null);
 useEffect(()=>{
  const update=()=>{const next=document.querySelector<HTMLElement>('[data-assistance-dock]');setHost(current=>current===next?current:next)};
  update();
  const observer=new MutationObserver(update);
  observer.observe(document.body,{childList:true,subtree:true});
  return()=>observer.disconnect();
 },[pathname]);
 return host;
}
