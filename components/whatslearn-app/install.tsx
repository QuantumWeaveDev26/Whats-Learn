'use client';
import {useEffect,useState} from 'react';
import {Download,X} from 'lucide-react';
type PromptEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
/** Makes /app installable: manifest and theme tags, a service worker scoped to /app, and an Install button when the browser offers one. */
export default function InstallSupport(){
 const [prompt,setPrompt]=useState<PromptEvent|null>(null),[hidden,setHidden]=useState(false);
 useEffect(()=>{
  const ensure=(sel:string,make:()=>HTMLElement)=>{if(!document.head.querySelector(sel))document.head.appendChild(make())};
  ensure('link[rel="manifest"]',()=>Object.assign(document.createElement('link'),{rel:'manifest',href:'/app.webmanifest'}));
  ensure('meta[name="theme-color"]',()=>Object.assign(document.createElement('meta'),{name:'theme-color',content:'#125C43'}));
  ensure('link[rel="apple-touch-icon"]',()=>Object.assign(document.createElement('link'),{rel:'apple-touch-icon',href:'/images/app-icon-192.png'}));
  if('serviceWorker' in navigator)navigator.serviceWorker.register('/app-sw.js',{scope:'/app'}).catch(()=>{});
  const onPrompt=(e:Event)=>{e.preventDefault();setPrompt(e as PromptEvent)};
  window.addEventListener('beforeinstallprompt',onPrompt);
  return()=>window.removeEventListener('beforeinstallprompt',onPrompt);
 },[]);
 if(!prompt||hidden)return null;
 return <div className="wla-install" role="region" aria-label="Install the app">
  <button type="button" className="wla-install-go" onClick={async()=>{await prompt.prompt();await prompt.userChoice.catch(()=>null);setPrompt(null)}}><Download size={18}/>Install WhatsLearn app</button>
  <button type="button" className="wla-install-x" aria-label="Not now" onClick={()=>setHidden(true)}><X size={18}/></button>
 </div>;
}
