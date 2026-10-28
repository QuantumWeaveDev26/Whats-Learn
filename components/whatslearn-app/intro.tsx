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
   <div className="wla-hero-art" aria-hidden="true"><span/><div><Icon size={44}/></div></div>
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
  {step&&<p className="wla-kicker">{step}</p>}
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
  <p className="wla-kicker">{mode==='in'?'WELCOME BACK':'CREATE YOUR ACCOUNT'}</p>
  <h1 className="wla-h1">{mode==='in'?<>Save your <em>progress.</em></>:<>Start your <em>journey.</em></>}</h1>
  <p className="wla-muted">{mode==='in'?'Sign in to keep your work on every device and connect your WhatsApp mentor.':'Free to start. No phone number needed.'}</p>
  {google&&<form action="/api/auth/google" method="post"><input type="hidden" name="return_to" value="/app"/><button className="wla-outline wla-full" type="submit">Continue with Google</button></form>}
  <form className="wla-form" onSubmit={submit} noValidate>
   {mode==='up'&&<><label htmlFor="wla-name">Your name</label><input id="wla-name" value={name} onChange={e=>setName(e.target.value)} autoComplete="name" maxLength={80}/></>}
   <label htmlFor="wla-email">Email</label><input id="wla-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" maxLength={254}/>
   <label htmlFor="wla-password">Password</label>
   <div className="wla-pass"><input id="wla-password" type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==='in'?'current-password':'new-password'} maxLength={200}/><button type="button" onClick={()=>setShow(!show)} aria-label={show?'Hide password':'Show password'} aria-pressed={show}>{show?<EyeOff size={20}/>:<Eye size={20}/>}</button></div>
   {err&&<p className="wla-error" role="alert">{err}</p>}{info&&<p className="wla-ok" role="status">{info}</p>}
   <button className="wla-primary wla-full" type="submit" disabled={busy||!email||!password||(mode==='up'&&!name)}>{busy?'Please wait…':mode==='in'?'Sign in':'Create account'}</button>
  </form>
  {mode==='in'&&<a className="wla-link wla-center" href="/forgot-password?return_to=%2Fapp">Forgot your password?</a>}
  <button type="button" className="wla-outline wla-full" onClick={()=>{setMode(mode==='in'?'up':'in');setErr('')}}>{mode==='in'?'Create an account':'I already have an account'}</button>
  <button type="button" className="wla-link wla-center" onClick={onGuest}>Try as guest first</button>
 </div>;
}
