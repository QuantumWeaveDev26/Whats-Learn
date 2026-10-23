'use client';
import {useEffect,useState} from 'react';
import {Check,Mail,ShieldCheck,Eye,EyeOff} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {safeReturnTo} from '@/lib/return-to';
import GoogleSignIn from './google-signin';
/**
 * Email and password screens. They only talk to this site's own /api/auth routes, which pass the password straight to the managed provider.
 * They are shown only when the site is in email mode (the pages check first), so a form never appears on a host where it could not work.
 */
type Reply={ok:boolean;error?:string;code?:string;message?:string;redirect?:string;type?:string;loginRemoved?:boolean};
const NETWORK='We could not reach the site. Check your connection and try again.';
async function send(path:string,body:unknown):Promise<Reply>{
 try{const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(body)});
  const d=await r.json().catch(()=>({})) as Reply;return r.ok?{...d,ok:true}:{ok:false,code:d.code,error:d.error||'Something went wrong. Please try again.'}}
 catch{return {ok:false,code:'network',error:NETWORK}}
}
function useReturnTarget(fallback='/learn'){
 const [t,setT]=useState(fallback);
 useEffect(()=>{let on=true;Promise.resolve().then(()=>{if(on)setT(safeReturnTo(new URLSearchParams(window.location.search).get('return_to'),fallback))});return()=>{on=false}},[fallback]);
 return t;
}
function Frame({kicker,title,lead,children}:{kicker:string;title:string;lead:string;children:React.ReactNode}){
 return <div className="join-grid"><section><p className="kicker">{kicker}</p><h1>{title}</h1><p className="account-lead">{lead}</p></section><section className="account-card">{children}<details className="small muted"><summary>How sign-in works</summary><p>Your password is handled by our sign-in provider. Google sign-in opens Google; never enter your Google password on WhatsLearn.</p></details></section></div>;
}
function Msg({text,kind}:{text:string;kind:'error'|'ok'}){return text?<p role={kind==='error'?'alert':'status'} className={kind==='error'?'form-error':'form-ok'}>{text}</p>:null}
export function SignInForm(){
 const [showPassword,setShowPassword]=useState(false);
 const back=useReturnTarget();const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[err,setErr]=useState(''),[code,setCode]=useState(''),[info,setInfo]=useState('');
 useEffect(()=>{let on=true;fetch('/api/session',{cache:'no-store',credentials:'same-origin'}).then(r=>r.json() as Promise<{signedIn:boolean}>).then(d=>{if(on&&d.signedIn)window.location.replace('/welcome?next='+encodeURIComponent(back))}).catch(()=>{});return()=>{on=false}},[back]);
 async function submit(e:React.FormEvent){e.preventDefault();setErr('');setInfo('');setBusy(true);const r=await send('/api/auth/signin',{email,password,returnTo:back});setBusy(false);
  if(r.ok&&r.redirect)window.location.assign(r.redirect);else{setErr(r.error||'');setCode(r.code||'')}}
 async function again(){setBusy(true);const r=await send('/api/auth/resend',{email,returnTo:back});setBusy(false);if(r.ok)setInfo(r.message||'');else setErr(r.error||'')}
 return <Frame kicker="WELCOME BACK" title="Sign in" lead="Pick up where you left off."><GoogleSignIn returnTo={back}/><form onSubmit={submit} noValidate>
  <span className="label">SIGN IN WITH EMAIL</span><label htmlFor="si-email">Email</label><Input id="si-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required maxLength={254}/>
  <label htmlFor="si-password">Password</label><div className="signin-password-field"><Input id="si-password" type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required maxLength={200}/><button className="signin-password-toggle" type="button" onClick={()=>setShowPassword(value=>!value)} aria-label={showPassword?'Hide password':'Show password'} aria-controls="si-password" aria-pressed={showPassword} title={showPassword?'Hide password':'Show password'}>{showPassword?<EyeOff size={20} aria-hidden="true"/>:<Eye size={20} aria-hidden="true"/>}</button></div>
  <button className="primary" type="submit" disabled={busy||!email||!password}>{busy?'Signing in…':'Sign in'}</button>
  <Msg text={err} kind="error"/>{code==='email_not_confirmed'&&email&&<p><button type="button" className="text-button" onClick={again} disabled={busy}>Send me a new confirmation link</button></p>}<Msg text={info} kind="ok"/>
  <p className="small"><a href={`/forgot-password?return_to=${encodeURIComponent(back)}`}>Forgot your password?</a></p></form>
  <div className="account-divider">New here?</div><a className="outline account-full" href={`/signup?return_to=${encodeURIComponent(back)}`}>Create an account</a>
  <p className="small muted">Prefer to look around first? <a href="/learn">Explore as a guest</a>. Guest progress stays in this browser only.</p></Frame>;
}
export function SignUpForm(){
 const back=useReturnTarget();const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[err,setErr]=useState(''),[done,setDone]=useState(''),[info,setInfo]=useState('');
 async function submit(e:React.FormEvent){e.preventDefault();setErr('');setBusy(true);const r=await send('/api/auth/signup',{name,email,password,returnTo:back});setBusy(false);if(r.ok)setDone(r.message||'Check your email.');else setErr(r.error||'')}
 async function again(){setBusy(true);setInfo('');const r=await send('/api/auth/resend',{email,returnTo:back});setBusy(false);if(r.ok)setInfo(r.message||'');else setErr(r.error||'')}
 if(done)return <Frame kicker="ONE MORE STEP" title="Check your email" lead="Confirm your address to finish creating your account."><p role="status"><Check size={18}/> {done}</p><p className="small muted">The link works once and expires in an hour. Look in spam if you do not see it.</p><button type="button" className="outline account-full" onClick={again} disabled={busy}>Send the link again</button><Msg text={err} kind="error"/><Msg text={info} kind="ok"/><p className="small"><a href={`/signin?return_to=${encodeURIComponent(back)}`}>Already confirmed? Sign in</a></p></Frame>;
 return <Frame kicker="YOUR AMBITION. YOUR WAY." title="Create your account" lead="Save your progress across devices."><GoogleSignIn returnTo={back}/><form onSubmit={submit} noValidate>
  <span className="label">CREATE AN ACCOUNT</span><label htmlFor="su-name">Name</label><Input id="su-name" value={name} onChange={e=>setName(e.target.value)} autoComplete="name" required maxLength={80}/>
  <label htmlFor="su-email">Email</label><Input id="su-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required maxLength={254}/>
  <label htmlFor="su-password">Password</label><Input id="su-password" type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" required minLength={10} maxLength={72} aria-describedby="su-hint"/><p id="su-hint" className="small muted">At least 10 characters. A passphrase works well.</p>
  <button className="primary" type="submit" disabled={busy||!name.trim()||!email||password.length<10}>{busy?'Creating…':'Create my account'}</button><Msg text={err} kind="error"/>
  <p className="small muted">New accounts receive a one-time starting balance of points. By signing up you agree to the <a href="/terms">Terms</a> and <a href="/privacy">Privacy policy</a>.</p></form>
  <div className="account-divider">Already have an account?</div><a className="outline account-full" href={`/signin?return_to=${encodeURIComponent(back)}`}>Sign in</a></Frame>;
}
export function ForgotForm(){
 const [email,setEmail]=useState(''),[busy,setBusy]=useState(false),[err,setErr]=useState(''),[done,setDone]=useState('');
 async function submit(e:React.FormEvent){e.preventDefault();setErr('');setBusy(true);const r=await send('/api/auth/forgot',{email});setBusy(false);if(r.ok)setDone(r.message||'');else setErr(r.error||'')}
 return <Frame kicker="NO WORRIES" title="Reset your password" lead="Enter your email and we will send a link to choose a new password."><form onSubmit={submit} noValidate>
  <label htmlFor="fp-email">Email</label><Input id="fp-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required maxLength={254}/>
  <button className="primary" type="submit" disabled={busy||!email}>{busy?'Sending…':'Send me a link'}</button><Msg text={err} kind="error"/><Msg text={done} kind="ok"/></form>
  <p className="small"><a href="/signin">Back to sign in</a></p></Frame>;
}
export function ResetForm(){
 const [pw,setPw]=useState(''),[pw2,setPw2]=useState(''),[busy,setBusy]=useState(false),[err,setErr]=useState(''),[expired,setExpired]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setErr('');if(pw!==pw2){setErr('The two passwords do not match.');return}setBusy(true);const r=await send('/api/auth/reset',{password:pw});setBusy(false);
  if(r.ok&&r.redirect)window.location.assign(r.redirect);else{setErr(r.error||'');setExpired(r.code==='link_expired')}}
 return <Frame kicker="ALMOST DONE" title="Choose a new password" lead="Use at least 10 characters that you do not use anywhere else."><form onSubmit={submit} noValidate>
  <label htmlFor="rp-1">New password</label><Input id="rp-1" type="password" value={pw} onChange={e=>setPw(e.target.value)} autoComplete="new-password" required minLength={10} maxLength={72}/>
  <label htmlFor="rp-2">Repeat the new password</label><Input id="rp-2" type="password" value={pw2} onChange={e=>setPw2(e.target.value)} autoComplete="new-password" required minLength={10} maxLength={72}/>
  <button className="primary" type="submit" disabled={busy||pw.length<10}>{busy?'Saving…':'Save new password'}</button><Msg text={err} kind="error"/></form>
  {expired&&<p><a className="outline account-full" href="/forgot-password">Ask for a new reset link</a></p>}</Frame>;
}
/** The page an emailed link opens. A button press (not the link itself) uses the one-time token, so mail scanners cannot use it up. */
export function ConfirmPanel(){
 const [params,setParams]=useState<{token:string;type:string;next:string}|null>(null),[busy,setBusy]=useState(false),[err,setErr]=useState(''),[code,setCode]=useState('');
 useEffect(()=>{let on=true;Promise.resolve().then(()=>{if(!on)return;const q=new URLSearchParams(window.location.search);setParams({token:q.get('token_hash')||'',type:q.get('type')||'',next:safeReturnTo(q.get('next'),'/learn')})});return()=>{on=false}},[]);
 const valid=!!params&&params.token.length>=8&&['signup','recovery','email'].includes(params.type);
 async function go(){if(!params)return;setBusy(true);setErr('');const r=await send('/api/auth/confirm',{tokenHash:params.token,type:params.type,next:params.next});setBusy(false);if(r.ok&&r.redirect)window.location.assign(r.redirect);else{setErr(r.error||'');setCode(r.code||'')}}
 const recovery=params?.type==='recovery';
 if(!params)return <Frame kicker="ONE MOMENT" title="Checking your link…" lead="This only takes a second."><p aria-live="polite">Loading…</p></Frame>;
 if(!valid)return <Frame kicker="LINK PROBLEM" title="This link is not complete" lead="The address may have been cut off when it was copied."><p role="alert" className="form-error">Open the link again from your email, or ask for a new one.</p><p><a className="outline account-full" href="/forgot-password">Ask for a new reset link</a></p><p><a className="outline account-full" href="/verify-email">Resend my confirmation email</a></p></Frame>;
 return <Frame kicker={recovery?'RESET YOUR PASSWORD':'CONFIRM YOUR EMAIL'} title={recovery?'Continue to choose a new password':'Confirm your email address'} lead={recovery?'Press the button to continue.':'Press the button to finish creating your account.'}>
  <button className="primary" onClick={go} disabled={busy}>{busy?'Please wait…':recovery?'Continue':'Confirm my email'}</button><Msg text={err} kind="error"/>
  {code==='link_expired'&&<p>{recovery?<a className="outline account-full" href="/forgot-password">Ask for a new reset link</a>:<a className="outline account-full" href="/verify-email">Send me a new confirmation link</a>}</p>}</Frame>;
}
export function VerifyEmailPanel(){
 const [email,setEmail]=useState(''),[busy,setBusy]=useState(false),[err,setErr]=useState(''),[done,setDone]=useState('');
 async function submit(e:React.FormEvent){e.preventDefault();setErr('');setBusy(true);const r=await send('/api/auth/resend',{email,returnTo:'/learn'});setBusy(false);if(r.ok)setDone(r.message||'');else setErr(r.error||'')}
 return <Frame kicker="CONFIRM YOUR EMAIL" title="Get a new confirmation link" lead="Accounts work once the email address is confirmed."><form onSubmit={submit} noValidate>
  <label htmlFor="ve-email">Email</label><Input id="ve-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required maxLength={254}/>
  <button className="primary" type="submit" disabled={busy||!email}>{busy?'Sending…':'Send the link'}</button><Msg text={err} kind="error"/><Msg text={done} kind="ok"/></form>
  <p className="small"><a href="/signin">Back to sign in</a></p></Frame>;
}
export function SignOutPanel(){
 const [state,setState]=useState<'working'|'failed'>('working'),[back,setBack]=useState('/');
 useEffect(()=>{let on=true;const target=safeReturnTo(new URLSearchParams(window.location.search).get('return_to'),'/');
  (async()=>{await Promise.resolve();if(on)setBack(target);const r=await send('/api/auth/signout',{returnTo:target});if(!on)return;if(r.ok)window.location.replace(r.redirect||target);else setState('failed')})();return()=>{on=false}},[]);
 return <div className="join-grid"><section aria-live="polite"><h1>{state==='working'?'Signing you out…':'We could not sign you out'}</h1>{state==='failed'?<><p role="alert" className="form-error">{NETWORK}</p><p><button className="primary" onClick={()=>window.location.reload()}>Try again</button> <a className="outline" href={back}>Back to where I was</a></p></>:<p className="account-lead">You will return to the page you came from.</p>}</section></div>;
}
/** Account deletion, shown on the settings page for email accounts. */
export function DeleteAccount(){
 const [open,setOpen]=useState(false),[password,setPassword]=useState(''),[sure,setSure]=useState(false),[busy,setBusy]=useState(false),[err,setErr]=useState(''),[done,setDone]=useState('');
 async function go(e:React.FormEvent){e.preventDefault();setErr('');setBusy(true);const r=await send('/api/auth/delete',{password,confirm:sure});setBusy(false);if(r.ok)setDone(r.message||'Done.');else setErr(r.error||'')}
 if(done)return <section className="account-card" role="status"><h2>Account deleted</h2><p>{done}</p><a className="outline" href="/">Back to the home page</a></section>;
 return <section className="account-card"><h2>Delete my account</h2><p className="small muted">This erases your saved work, points, practice records and WhatsApp details from WhatsLearn. Payment records we must keep by law stay (see the Privacy policy). It cannot be undone.</p>
  {!open?<button className="outline" onClick={()=>setOpen(true)}>I want to delete my account</button>:<form onSubmit={go} noValidate><label htmlFor="da-pw">Your password</label><Input id="da-pw" type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" maxLength={200}/>
  <label className="check-row"><input type="checkbox" checked={sure} onChange={e=>setSure(e.target.checked)}/> I understand this cannot be undone</label><button className="outline account-deletion-cancel" type="button" disabled={busy} onClick={()=>{setOpen(false);setPassword('');setSure(false);setErr('')}}>Cancel</button><button className="primary account-deletion-submit" type="submit" disabled={busy||!password||!sure}>{busy?'Deleting…':'Delete my account'}</button><Msg text={err} kind="error"/></form>}</section>;
}

/** Shows the delete-account card only when email accounts are in use and the learner is signed in. */
export function DeleteAccountIfEmail(){
 const [show,setShow]=useState(false),[google,setGoogle]=useState(false),[expanded,setExpanded]=useState(false);
 useEffect(()=>{let live=true;fetch('/api/auth/config').then(r=>r.json() as Promise<{emailPassword?:boolean;signedIn?:boolean;googleAccount?:boolean}>).then(d=>{if(live){setShow(!!d.emailPassword&&!!d.signedIn);setGoogle(d.googleAccount===true)}}).catch(()=>{});return()=>{live=false}},[]);
 return show?<details className="account-management" onToggle={e=>setExpanded(e.currentTarget.open)}><summary>Account management<span>Close or delete your account</span></summary>{expanded&&(google?<section className="account-card"><h2>Delete my account</h2><p className="small muted">You signed in with Google. Contact us from your account email to request deletion; do not send your Google password.</p><a className="outline" href="mailto:connect@brandmintai.io?subject=WhatsLearn%20account%20deletion">Request account deletion</a></section>:<DeleteAccount/>)}</details>:null;
}
