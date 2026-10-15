'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {hostSignInHref,hostSignOutHref,safeReturnTo} from '@/lib/return-to';
/**
 * Sends the learner to the host's ChatGPT sign-in (or sign-out) only after checking that the host answers there.
 * On OpenAI Sites the host owns those addresses. On any other host they do not exist, and a plain link would end at a 404, so the learner sees an explanation instead.
 */
type State='checking'|'going'|'unavailable';
async function hostHasPath(path:string){
 try{const r=await fetch(path,{redirect:'manual',credentials:'same-origin',cache:'no-store'});return r.type==='opaqueredirect'||(r.status>=200&&r.status<400)}catch{return false}
}
export default function HostSignIn({mode}:{mode:'in'|'out'}){
 const [state,setState]=useState<State>('checking'),[back,setBack]=useState('/learn');
 useEffect(()=>{
  let alive=true;const target=safeReturnTo(new URLSearchParams(window.location.search).get('return_to'),mode==='in'?'/learn':'/');
  (async()=>{
   await Promise.resolve();if(alive)setBack(target);
   if(mode==='in'){try{const s=await fetch('/api/session',{cache:'no-store',credentials:'same-origin'});if(s.ok&&(await s.json() as {signedIn:boolean}).signedIn){window.location.replace(target);return}}catch{}}
   const path=mode==='in'?hostSignInHref(target):hostSignOutHref(target);
   if(await hostHasPath(path)){if(alive){setState('going');window.location.replace(path)}}else if(alive)setState('unavailable');
  })();
  return()=>{alive=false};
 },[mode]);
 if(state!=='unavailable')return <section className="join-grid" aria-live="polite"><div><h1>{mode==='in'?'Taking you to sign in…':'Signing you out…'}</h1><p className="account-lead">{state==='checking'?'One moment while we check the sign-in service.':'You will return to the page you came from.'}</p><noscript><p>This step needs JavaScript. You can keep practising as a guest from <a href="/learn">My Journey</a>.</p></noscript></div></section>;
 return <section className="join-grid"><div role="alert"><h1>{mode==='in'?'Sign-in is not available at this address':'Sign-out is not available at this address'}</h1>
  <p className="account-lead">Sign-in uses your ChatGPT account through the hosting service (OpenAI Sites). This address is not served through it, so {mode==='in'?'sign-in':'sign-out'} cannot start here.</p>
  <p>There is no password to create or reset here. {mode==='in'?'You can keep practising as a guest. Your work stays in this browser.':'You are not signed in on this address.'}</p>
  <p><a className="primary" href={back}>{mode==='in'?'Continue as a guest':'Back to where I was'}</a> <Link className="outline" href="/">Home</Link></p>
  <small>Owner note: see docs/sign-in-hosting.md for which sign-in methods work on which host.</small></div></section>;
}
