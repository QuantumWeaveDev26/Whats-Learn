'use client';
import {useEffect,useState} from 'react';
import {ArrowLeft,Clock,PenLine,MessageCircle,Eye,EyeOff,Trophy,Check} from 'lucide-react';
import {lessonLanguages,languages} from '@/lib/languages';
/** Languages the app offers. The website keeps its full list; these ten are hidden in the app only. */
const hiddenInApp=['brx','doi','ks','mai','sat','sd','ur','as','kok','ne'];
const appLanguages=lessonLanguages.filter(code=>!hiddenInApp.includes(code));
import {api,readLocal,writeLocal} from './api';

export function Splash({onDone}:{onDone:()=>void}){
 useEffect(()=>{const t=setTimeout(onDone,1600);return()=>clearTimeout(t)},[onDone]);
 return <div className="wla-splash" onClick={onDone}>
  <svg className="wla-splash-mark" viewBox="58 22 76 76" role="img" aria-label="WhatsLearn"><image href="/images/app-icon-192.png" width="192" height="192"/></svg>
  <p>From chat to change.</p>
 </div>;
}

const slides=[
 {t:'Learn AI skills.',e:'Fifteen minutes a day.',b:'Short daily tasks in marketing, full-stack apps, film and visual stories.',Icon:Clock,img:'/images/app-welcome.webp'},
 {t:'Make real things.',e:'Get AI feedback.',b:'Each task ends with something you made. The AI reviews your own words, not a template.',Icon:PenLine,img:'/images/app-welcome-2.webp'},
 {t:'Learn here',e:'or on WhatsApp.',b:'Same course, synced progress. Your mentor is one message away.',Icon:MessageCircle,img:'/images/app-welcome-3.webp'}
];
export function Welcome({onDone}:{onDone:()=>void}){
 const [i,setI]=useState(0);const s=slides[i];const Icon=s.Icon;
 // Each slide shows its own illustration; if an image is missing the icon art is shown instead.
 const [missing,setMissing]=useState<Record<string,boolean>>({});
 // Fetch the later slides' images as soon as the intro opens, so they never appear blank.
 useEffect(()=>{slides.slice(1).forEach(x=>{const im=new Image();im.decoding='async';im.src=x.img})},[]);
 return <div className="wla-page wla-welcome">
  <div className="wla-row-end"><button type="button" className="wla-link" onClick={onDone}>Skip</button></div>
  <div className="wla-welcome-body">
   {!missing[s.img]?<div className="wla-hero-art wla-hero-img" aria-hidden="true"><img key={s.img} src={s.img} alt="" width={720} height={540} onError={()=>setMissing(m=>({...m,[s.img]:true}))}/></div>
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
  <p className="wla-muted">Lessons, AI feedback and your mentor use this language. App menus stay in English for now. Change it any time.</p>
  <div className="wla-grid2">{appLanguages.map(code=><button key={code} type="button" className={'wla-chip'+(value===code?' on':'')} aria-pressed={value===code} onClick={()=>onChange(code)}>{languages[code]}</button>)}</div>
  <button type="button" className="wla-primary wla-stick" onClick={onNext}>Continue</button>
 </div>;
}

/** Real sign-in and sign-up through the website's own account endpoints. */
export function AuthScreen({onSignedIn,onGuest,firstRun,notice,allowGuest=true}:{onSignedIn:()=>void;onGuest:()=>void;firstRun?:boolean;notice?:string;allowGuest?:boolean}){
 const [sent,setSent]=useState(''),[resent,setResent]=useState('');
 const [mode,setMode]=useState<'in'|'up'>('in');
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[show,setShow]=useState(false);
 const [busy,setBusy]=useState(false),[err,setErr]=useState(''),[info,setInfo]=useState('');
 // The last known answer shows the Google button at once, so the form does not jump when the check returns.
 const [google,setGoogle]=useState(()=>readLocal('wla-google')==='1');
 useEffect(()=>{api<{google?:boolean}>('/api/auth/providers').then(r=>{if(!r.ok)return;const on=r.data.google===true;setGoogle(on);writeLocal('wla-google',on?'1':'0')})},[]);
 async function submit(e:React.FormEvent){
  e.preventDefault();setErr('');setInfo('');setBusy(true);
  const r=mode==='in'?await api<{ok?:boolean;message?:string}>('/api/auth/signin',{method:'POST',body:{email,password,returnTo:'/app'}})
   :await api<{ok?:boolean;message?:string}>('/api/auth/signup',{method:'POST',body:{name,email,password,returnTo:'/app'}});
  setBusy(false);
  if(!r.ok){setErr(r.data.error||'That did not work. Please try again.');return}
  if(mode==='up'){setSent(email);return}
  onSignedIn();
 }
 if(sent)return <div className="wla-page wla-sent">
  <div className="wla-brand"><img src="/images/app-icon-192.png" alt=""/><div><strong>WhatsLearn</strong><small>From chat to change</small></div></div>
  <p className="wla-kicker">ONE LAST STEP</p><h1 className="wla-h1">Check your <em>email.</em></h1>
  <p className="wla-muted">We sent a confirmation link to <strong>{sent}</strong>. Open it on this phone and you’ll come straight back to the app.</p>
  {resent&&<p className="wla-ok" role="status">{resent}</p>}
  <button type="button" className="wla-outline wla-full" disabled={busy} onClick={async()=>{setBusy(true);const r=await api<{message?:string}>('/api/auth/resend',{method:'POST',body:{email:sent,returnTo:'/app'}});setBusy(false);setResent(r.ok?(r.data.message||'Sent again. Check your inbox and spam folder.'):(r.data.error||'Could not resend just now. Try again in a minute.'))}}>{busy?'Sending…':'Resend the email'}</button>
  <button type="button" className="wla-primary wla-full" onClick={()=>{setSent('');setResent('');setMode('in')}}>I’ve confirmed. Sign in</button>
  <button type="button" className="wla-link wla-center" onClick={()=>{setSent('');setMode('up')}}>Use a different email</button>
 </div>;
 // A green welcome panel above the form on phones; on wider screens it becomes the left half of a split layout.
 return <div className="wla-page wla-auth">
  <aside className="wla-auth-hero">
   <div className="wla-brand"><img src="/images/app-icon-192.png" alt=""/><div><strong>WhatsLearn</strong><small>From chat to change</small></div></div>
   <p className="wla-auth-pitch">Learn AI skills.<br/>15 minutes a day.</p>
   <ul className="wla-auth-perks"><li><Check size={16}/>Real tasks, reviewed by AI</li><li><Check size={16}/>Your mentor, here or on WhatsApp</li><li><Check size={16}/>In English and 12 Indian languages</li></ul>
   <img className="wla-auth-art" src="/images/app-welcome.webp" alt="" width={720} height={540}/>
  </aside>
  <div className="wla-auth-panel">
  {notice&&<p className="wla-challenge-note" role="status"><Trophy size={18}/>{notice}</p>}
  <p className="wla-kicker">{mode==='up'?'CREATE YOUR ACCOUNT':notice?'FRIEND CHALLENGE':firstRun?'STEP 2 OF 2':'WELCOME BACK'}</p>
  <h1 className="wla-h1">{notice&&mode==='in'?<>Take the <em>challenge.</em></>:mode==='in'?<>Save your <em>progress.</em></>:<>Start your <em>journey.</em></>}</h1>
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
  {allowGuest&&<button type="button" className="wla-link wla-center" onClick={onGuest}>Try as guest first</button>}</div>
  </div>
 </div>;
}
