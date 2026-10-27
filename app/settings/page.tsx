'use client';
import './settings.css';
import MentorMemory from '@/components/whatslearn/mentor-memory';
import PersonalContext from '@/components/whatslearn/personal-context';
import {learningStyles,learningStyle} from '@/lib/learning-styles';
import {DeleteAccountIfEmail} from '@/components/whatslearn/auth-forms';
import {useEffect,useState,useRef} from 'react';
import {Save,ArrowRight,BookOpen,UserRound,MessageCircle,ChevronDown,ShieldCheck} from 'lucide-react';
import {Switch} from '@/components/ui/switch';
import {Input} from '@/components/ui/input';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import WhatsAppOptIn from '@/components/whatslearn/whatsapp-optin';
import AccountShell from '@/components/whatslearn/account-shell';
import {readPreferredLanguage,resolveLearningLanguage,rememberLanguage,languageOptions} from '@/lib/languages';
import {defaultProfile,goals,languages,type Profile} from '@/lib/personalization';
import {programmeNames} from '@/lib/programmes';
import {readPreferences,savePreferences,defaultPreferences,type LearningPreferences} from '@/lib/learning-preferences';
function Choice({label,value,items,onChange}:{label:string;value:string;items:Record<string,string>;onChange:(v:string)=>void}){return <div className="setting-field"><label>{label}</label><Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label}><SelectValue/></SelectTrigger><SelectContent>{Object.entries(items).map(([v,l])=><SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div>}
const simpleLearningStyles:Record<keyof typeof learningStyles,string>={casual:'Talk it through',game:'Small challenges',story:'Learn with stories',facts:'Get to the point'};
export default function Settings(){
 const currentAccount=useRef(''),loadSequence=useRef(0),saving=useRef(false);
 const[busy,setBusy]=useState(false),[accountState,setAccountState]=useState<'loading'|'ready'|'guest'|'error'>('loading');
 const[p,setP]=useState<Profile>(defaultProfile),[prefs,setPrefs]=useState<LearningPreferences>(defaultPreferences),[status,setStatus]=useState('');
 async function loadAccount(){
  const sequence=++loadSequence.current;currentAccount.current='';setAccountState('loading');setStatus('');setPrefs(old=>({...old,name:''}));
  try{
   const r=await fetch('/api/profile',{cache:'no-store'});if(sequence!==loadSequence.current)return;
   if(r.status===401){setAccountState('guest');setStatus('Sign in to keep your choices across devices.');return;}
   if(!r.ok)throw new Error();
   const d=await r.json() as {profile?:Profile|null;name?:string;accountKey?:string};if(sequence!==loadSequence.current)return;
   if(!d.accountKey)throw new Error();currentAccount.current=d.accountKey;
   if(d.profile){const language=resolveLearningLanguage(d.profile.language);setP({...d.profile,language});try{rememberLanguage(language)}catch{}}else setP(defaultProfile);
   if(typeof d.name==='string')setPrefs(old=>({...old,name:d.name!}));setAccountState('ready');
  }catch{if(sequence===loadSequence.current){setAccountState('error');setStatus('Settings could not load. Retry to continue.');}}
 }
 useEffect(()=>{
  setPrefs({...readPreferences(),name:''});
  try{const stored=JSON.parse(localStorage.getItem('whatslearn-profile')||'null');if(stored&&programmeNames[stored.track]&&languages[stored.language])setP({...stored,language:readPreferredLanguage(stored.language)})}catch{}
  void loadAccount();const refresh=()=>{void loadAccount()};
  const checkIdentity=async()=>{try{const r=await fetch('/api/session',{cache:'no-store'});if(!r.ok)return;const d=await r.json() as {signedIn?:boolean;accountKey?:string};if(!d.signedIn||d.accountKey!==currentAccount.current)void loadAccount()}catch{}};
  window.addEventListener('pageshow',refresh);window.addEventListener('focus',checkIdentity);
  return()=>{loadSequence.current++;window.removeEventListener('pageshow',refresh);window.removeEventListener('focus',checkIdentity)};
 },[]);
 async function save(){
  if(saving.current||(accountState!=='ready'&&accountState!=='guest'))return;
  saving.current=true;setBusy(true);const expected=currentAccount.current,sequence=loadSequence.current;
  try{
   if(accountState==='ready'){
    const r=await fetch('/api/profile',{method:'POST',headers:{'Content-Type':'application/json','x-whatslearn-account':expected},body:JSON.stringify({...p,name:prefs.name})});
    if(sequence!==loadSequence.current||expected!==currentAccount.current)return;
    if(r.status===401||r.status===409){setAccountState('error');setPrefs(old=>({...old,name:''}));setStatus('Your sign-in changed. Retry the account check.');return;}
    if(!r.ok){setStatus('Could not save. Your choices are still here; try again.');return;}
    const d=await r.json() as {name?:string};if(sequence!==loadSequence.current||expected!==currentAccount.current)return;
    if(typeof d.name==='string')setPrefs(old=>({...old,name:d.name!}));
   }
   localStorage.setItem('whatslearn-profile',JSON.stringify(p));rememberLanguage(p.language);savePreferences({...prefs,name:''});
   setStatus(accountState==='ready'?'Saved. Your mentor will use these choices.':'Saved on this device.');
  }catch{if(sequence===loadSequence.current)setStatus('Could not save. Your choices are still here; try again.');}
  finally{saving.current=false;setBusy(false);}
 }
 const ready=accountState==='ready',editable=ready||accountState==='guest';
 return <AccountShell className="settings-page">
  <div className="account-heading"><p className="kicker">MAKE IT YOURS</p><h1>Your <em>settings.</em></h1><p>A few choices. A better fit.</p></div>
  <div className="settings-layout">
   <fieldset className="settings-sections" style={{border:0,padding:0,minWidth:0}} disabled={!editable||busy}>
    <section className="account-card settings-profile"><h2><UserRound/> Your name</h2><div className="setting-field"><label htmlFor="settings-name">Name or nickname</label><Input id="settings-name" autoComplete="nickname" value={prefs.name} maxLength={60} disabled={accountState==='guest'} onChange={e=>setPrefs({...prefs,name:e.target.value})}/><p className="small muted">{accountState==='guest'?'Sign in to set your name.':'What should your mentor call you?'}</p></div></section>
    <section className="account-card" data-tour="direction"><h2><BookOpen/> Your learning</h2>
     <div className="settings-fields"><Choice label="Course" value={p.track} items={programmeNames} onChange={track=>setP({...p,track})}/><div data-tour="language"><Choice label="Language" value={p.language} items={languageOptions()} onChange={language=>setP({...p,language})}/></div></div>
     <details className="settings-more"><summary>Personalise my lessons <ChevronDown size={17} aria-hidden="true"/></summary><div className="settings-fields">
      <Choice label="My goal" value={p.goal} items={goals} onChange={goal=>setP({...p,goal})}/>
      <Choice label="Experience" value={p.level} items={{beginner:'Starting fresh',practising:'Some practice',experienced:'Using this at work'}} onChange={level=>setP({...p,level})}/>
      <Choice label="Time each day" value={p.minutes} items={{'5':'5 minutes','10':'10 minutes','15':'15 minutes','25':'25 minutes','30':'30 minutes',flexible:'Keep it flexible'}} onChange={minutes=>setP({...p,minutes})}/>
      <Choice label="Learning style" value={learningStyle(p.style)} items={simpleLearningStyles} onChange={style=>setP({...p,style:learningStyle(style)})}/>
      <Choice label="Help with challenges" value={prefs.mode} items={{adaptive:'Adjust as I learn',guided:'Give me more guidance',stretch:'Give me a bigger challenge'}} onChange={mode=>setPrefs({...prefs,mode})}/>
     </div><div className="switch-row"><div><label htmlFor="celebrations">Celebrate my progress</label></div><Switch id="celebrations" checked={prefs.celebrations} onCheckedChange={celebrations=>setPrefs({...prefs,celebrations})}/></div></details>
    </section>
    <section className="account-card settings-whatsapp" id="whatsapp"><h2><MessageCircle/> WhatsApp <span className="settings-optional">Optional</span></h2>{editable?<WhatsAppOptIn key={currentAccount.current||'guest'} wanted={true} language={p.language} accountKey={currentAccount.current} compact/>:<p className="small muted">Your connection appears after settings load.</p>}</section>
    {ready&&<details className="account-card settings-extra"><summary><span><ShieldCheck size={20}/> Privacy &amp; saved setup</span><ChevronDown size={17} aria-hidden="true"/></summary><div className="settings-extra-content"><MentorMemory accountKey={currentAccount.current} ready={ready}/><PersonalContext key={currentAccount.current} accountKey={currentAccount.current} summary/></div></details>}
   </fieldset>
   <aside className="settings-summary"><span className="label">YOUR CHOICES</span><h2>{programmeNames[p.track]}</h2><p>{languages[p.language]} · {p.minutes==='flexible'?'Flexible pace':p.minutes+' min a day'}</p>
    <button type="button" className="primary" onClick={save} disabled={busy||!editable}><Save size={17}/> {busy?'Saving…':ready?'Save changes':'Save on this device'}</button>
    {status&&<p className="settings-status" role="status">{status}</p>}{accountState==='error'&&<button className="outline" onClick={()=>void loadAccount()}>Retry account check</button>}
    {accountState==='guest'&&<a className="outline account-full" href="/signin?return_to=%2Fsettings">Sign in to save to my account</a>}
    <a href="/learn" className="text-button">Back to learning <ArrowRight size={17}/></a><div className="settings-help-links"><a href="/membership">Manage my plan</a><a href="/support">Get help</a></div>
   </aside>
  </div>
  {ready&&<div className="settings-account-management"><DeleteAccountIfEmail key={currentAccount.current}/></div>}
 </AccountShell>;
}
