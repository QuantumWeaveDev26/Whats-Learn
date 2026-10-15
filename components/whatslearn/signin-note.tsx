'use client';
import {useEffect,useState} from 'react';
/**
 * Explains guest mode and what signing in adds. The wording follows the sign-in method this site really offers (asked from /api/auth/config):
 * email and password through the managed provider, or ChatGPT through the OpenAI Sites host. Until that is known it names neither. WhatsLearn never asks for a ChatGPT password.
 */
export default function SignInNote({returnTo='/learn',context='practice',initialMode=''}:{returnTo?:string;context?:'practice'|'membership';initialMode?:'email'|'host'|'unavailable'|''}){
 const [mode,setMode]=useState<'email'|'host'|'unavailable'|''>(initialMode);
 useEffect(()=>{let live=true;fetch('/api/auth/config').then(r=>r.json() as Promise<{mode?:string}>).then(d=>{if(live)setMode(d.mode==='email'?'email':d.mode==='host'?'host':'')}).catch(()=>{});return()=>{live=false}},[]);
 const keep=mode==='host'?' Sign in with ChatGPT to keep your saved work on any device. AI help, WhatsApp lessons and checkout depend on availability.':mode==='email'?' Sign in or sign up to keep your saved work on any device. AI help, WhatsApp lessons and checkout depend on availability.':' Sign in to keep your saved work on any device. AI help, WhatsApp lessons and checkout depend on availability.';
 const fine=mode==='host'?'No new password. We get your email (and name, if your profile has one), never your ChatGPT password. Guest work is not moved into your account. ':mode==='email'?'We keep your name and email. Your password goes to our sign-in provider and we never see it. Guest work is not moved into your account. ':'Guest work is not moved into your account. ';
 return <aside className="signin-note" aria-label="Sign in"><div><strong>{context==='membership'?'Sign in to buy a plan.':'You’re practising as a guest.'}</strong><p>{context==='membership'?'Plans belong to your account. You can still practise free as a guest.':'Your work is saved in this browser only.'}{keep}</p><small>{fine}<a href="/privacy">How we use your data</a></small></div><a className="primary" href={`/signin?return_to=${encodeURIComponent(returnTo)}`} target="_top">{mode==='host'?'Sign in with ChatGPT':mode==='email'?'Sign in or sign up':'Sign in'}</a></aside>;
}
