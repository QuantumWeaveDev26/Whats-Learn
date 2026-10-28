'use client';
import {useEffect,useState} from 'react';
import {ArrowLeft,Clock,PenLine,MessageCircle,Eye,EyeOff} from 'lucide-react';
import {lessonLanguages,languages} from '@/lib/languages';
import {api} from './api';

export function Splash({onDone}:{onDone:()=>void}){
 useEffect(()=>{const t=setTimeout(onDone,1600);return()=>clearTimeout(t)},[onDone]);
 return <div className="wla-splash" onClick={onDone}>
  <img src="/images/whatslearn-logo-green.png" alt="WhatsLearn — From Chat to Change" width={168} height={168}/>
  <p>From chat to change.</p>
 </div>;
}

const slides=[
 {t:'Learn AI skills.',e:'Fifteen minutes a day.',b:'Short daily tasks in marketing, full-stack apps, film and visual stories.',Icon:Clock},
 {t:'Make real things.',e:'Get AI feedback.',b:'Each task ends with something you made. The AI reviews your own words, not a template.',Icon:PenLine},
 {t:'Learn here',e:'or on WhatsApp.',b:'Same course, synced progress. Your mentor is one message away.',Icon:MessageCircle}
];
export function Welcome({onDone}:{onDone:()=>void}){
 const [i,setI]=useState(0);const s=slides[i];const Icon=s.Icon;
 return <div className="wla-page wla-welcome">
  <div className="wla-row-end"><button type="button" className="wla-link" onClick={onDone}>Skip</button></div>
  <div className="wla-welcome-body">
   {i===0?<div className="wla-hero-art wla-hero-img" aria-hidden="true"><img src="/images/app-welcome.webp" alt="" width={720} height={540}/></div>
   :<div className="wla-hero-art" aria-hidden="true"><span/><div><Icon size={44}/></div></div>}
   <h1>{s.t}<br/><em>{s.e}</em></h1>
   <p className="wla-muted">{s.b}</p>
  </div>
  <div className="wla-welcome-foot">
   <div className="wla-dots" role="img" aria-label={`Slide ${i+1} of 3`}>{slides.map((_,n)=><span key={n} className={n===i?'on':''}/>)}</div>
   <button type="button" className="wla-primary" onClick={()=>i<2?setI(i+1):onDone()}>{i<2?'Next':'Get started'}</button>
  </div>
 </div>;
}

export function LanguageStep({value,onChange,onNext,onBack,step}:{value:string;onChange:(l:string)=>void;onNext:()=>void;onBack?:()=>void;step?:string}){
 return <div className="wla-page">
  {onBack&&<button type="button" className="wla-back" onClick={onBack}><ArrowLeft size={18}/>Back</button>}
  {step&&<div className="wla-split"><p className="wla-kicker">{step}</p><button type="button" className="wla-link" onClick={()=>{onChange('en');onNext()}}>Skip · keep English</button></div>}
  <h1 className="wla-h1">Pick your <em>language.</em></h1>
  <p className="wla-muted">Lessons and feedback come in this language. Change it any time.</p>
  <div className="wla-grid2">{lessonLanguages.map(code=><button key={code} type="button" className={'wla-chip'+(value===code?' on':'')} aria-pressed={value===code} onClick={()=>onChange(code)}>{languages[code]}</button>)}</div>
  <button type="button" className="wla-primary wla-stick" onClick={onNext}>Continue</button>
 </div>;
}

/** Real sign-in and sign-up through the website's own account endpoints. */
export function AuthScreen({onSignedIn,onGuest}:{onSignedIn:()=>void;onGuest:()=>void}){
 const [mode,setMode]=useState<'in'|'up'>('in');
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[show,setShow]=useState(false);
 const [busy,setBusy]=useState(false),[err,setErr]=useState(''),[info,setInfo]=useState(''),[google,setGoogle]=useState(false);
 useEffect(()=>{api<{google?:boolean}>('/api/auth/providers').then(r=>setGoogle(r.ok&&r.data.google===true))},[]);
 async function submit(e:React.FormEvent){
  e.preventDefault();setErr('');setInfo('');setBusy(true);
  const r=mode==='in'?await api<{ok?:boolean;message?:string}>('/api/auth/signin',{method:'POST',body:{email,password,returnTo:'/app'}})
   :await api<{ok?:boolean;message?:string}>('/api/auth/signup',{method:'POST',body:{name,email,password,returnTo:'/app'}});
  setBusy(false);
  if(!r.ok){setErr(r.data.error||'That did not work. Please try again.');return}
  if(mode==='up'){setInfo(r.data.message||'Check your email to confirm your address, then sign in.');setMode('in');return}
  onSignedIn();
 }
 return <div className="wla-page">
  <div className="wla-brand"><img src="/images/app-icon-192.png" alt=""/><div><strong>WhatsLearn</strong><small>From chat to change</small></div></div>
  <p className="wla-kicker">{mode==='in'?'WELCOME BACK':'CREATE YOUR ACCOUNT'}</p>
  <h1 className="wla-h1">{mode==='in'?<>Save your <em>progress.</em></>:<>Start your <em>journey.</em></>}</h1>
  <p className="wla-muted">{mode==='in'?'Sign in to keep your work on every device and connect your WhatsApp mentor.':'Free to start. No phone number needed.'}</p>
  {google&&<form action="/api/auth/google" method="post"><input type="hidden" name="return_to" value="/app"/><button className="wla-outline wla-full wla-google" type="submit"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.32 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.41 13.92A6 6 0 0 1 6.1 12c0-.67.11-1.31.31-1.92V7.49H3.07A10 10 0 0 0 2 12c0 1.61.39 3.14 1.07 4.51l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.6 9.6 0 0 0 12 2 10 10 0 0 0 3.07 7.49l3.34 2.59C7.2 7.72 9.4 5.96 12 5.96Z"/></svg>Continue with Google</button></form>}
  {google&&<p className="wla-or">or use email</p>}
  <form className="wla-form" onSubmit={submit} noValidate>
   {mode==='up'&&<><label htmlFor="wla-name">Your name</label><input id="wla-name" value={name} onChange={e=>setName(e.target.value)} autoComplete="name" maxLength={80}/></>}
   <label htmlFor="wla-email">Email</label><input id="wla-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" maxLength={254}/>
   <label htmlFor="wla-password">Password</label>
   <div className="wla-pass"><input id="wla-password" type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==='in'?'current-password':'new-password'} maxLength={200}/><button type="button" onClick={()=>setShow(!show)} aria-label={show?'Hide password':'Show password'} aria-pressed={show}>{show?<EyeOff size={20}/>:<Eye size={20}/>}</button></div>
   {err&&<p className="wla-error" role="alert">{err}</p>}{info&&<p className="wla-ok" role="status">{info}</p>}
   <button className="wla-primary wla-full" type="submit" disabled={busy||!email||!password||(mode==='up'&&!name)}>{busy?'Please wait…':mode==='in'?'Sign in':'Create account'}</button>
  </form>
  {mode==='in'&&<a className="wla-link wla-center" href="/forgot-password?return_to=%2Fapp">Forgot your password?</a>}
  <div className="wla-auth-foot"><p className="wla-or">{mode==='in'?'New to WhatsLearn?':'Already learning with us?'}</p>
  <button type="button" className="wla-outline wla-full" onClick={()=>{setMode(mode==='in'?'up':'in');setErr('')}}>{mode==='in'?'Create an account':'I already have an account'}</button>
  <button type="button" className="wla-link wla-center" onClick={onGuest}>Try as guest first</button></div>
 </div>;
}
