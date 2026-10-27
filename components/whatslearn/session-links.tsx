 'use client';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {safeReturnTo,signInHref,signOutHref} from '@/lib/return-to';
import {fetchWithTimeout} from '@/lib/fetch-timeout';
export default function SessionLinks({className='preview-pill',initialSignedIn}:{className?:string;initialSignedIn?:boolean}){
 const pathname=usePathname();
 const [state,setState]=useState<'loading'|'signed-in'|'guest'|'error'>(initialSignedIn===undefined?'loading':initialSignedIn?'signed-in':'guest');const [here,setHere]=useState('/learn');
 useEffect(()=>{let alive=true;Promise.resolve().then(()=>{if(alive)setHere(safeReturnTo(window.location.pathname+window.location.search,'/learn'))});return()=>{alive=false}},[pathname]);
 useEffect(()=>{let alive=true;async function check(){try{const r=await fetchWithTimeout('/api/session',{cache:'no-store',credentials:'same-origin'});if(!r.ok)throw Error();const data=await r.json() as {signedIn:boolean};if(alive)setState(data.signedIn?'signed-in':'guest')}catch{if(alive)setState(old=>old==='signed-in'?old:'error')}}
 void check();const refresh=()=>{void check()};window.addEventListener('pageshow',refresh);window.addEventListener('focus',refresh);return()=>{alive=false;window.removeEventListener('pageshow',refresh);window.removeEventListener('focus',refresh)}},[pathname]);
 if(state==='loading')return <span className={className} role="status">Checking account…</span>;
 if(state==='error')return <a className={className} href="/settings">Account status unavailable</a>;
 if(state==='signed-in')return <span className="session-links" style={{display:'inline-flex',alignItems:'center',gap:'12px'}}><a className={className} href="/settings">My account</a><a href={signOutHref('/')} target="_top">Sign out</a></span>;
 return <a className={className} href={signInHref(here)} target="_top">Sign up / Sign in</a>;
}
