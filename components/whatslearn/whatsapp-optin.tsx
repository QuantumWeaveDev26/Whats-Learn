'use client';
import {useEffect,useState} from 'react';
type State={recapStatus?:string;message?:string;accepted?:boolean;queued?:boolean;configured:boolean;performanceRemindersReady?:boolean;signInRequired?:boolean;business?:string;contact?:{phone:string;state:string;verified?:boolean;linkCode?:string;linkExpires?:string}|null;error?:string};
/** WhatsApp lessons and reminders. Renders nothing until the site's WhatsApp settings exist. */
export default function WhatsAppOptIn({wanted,language}:{wanted:boolean;language:string}){
 const[s,setS]=useState<State|null>(null),[phone,setPhone]=useState(''),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[msg,setMsg]=useState('');
 useEffect(()=>{fetch('/api/whatsapp').then(r=>r.json() as Promise<State>).then(setS).catch(()=>setS({configured:false}))},[]);
 if(!s)return <p className="small">Checking your WhatsApp connection…</p>;
 if(!s.configured)return <div className="whatsapp-optin"><h3>Connect your WhatsLearn Mentor</h3><p>Personalised WhatsApp lessons and progress sync are being connected. Your learning progress stays safe on the website.</p><a href="https://wa.me/919187951536" target="_blank" rel="noreferrer">Open the mentor chat</a></div>;
 const on=s.contact?.state==='opted_in'&&s.contact.verified!==false;const code=s.contact?.linkCode;
 if(!wanted&&!on)return null;
 async function act(body:unknown){setBusy(true);setMsg('');try{const r=await fetch('/api/whatsapp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json() as State;if(!r.ok)throw new Error(d.error||'Please try again.');setS(old=>({...old!,contact:d.contact,recapStatus:d.recapStatus||old?.recapStatus}));setMsg(d.message||(d.contact?.linkCode?'Almost done. Send the code from WhatsApp to link this number.':d.contact?.state==='opted_in'?'WhatsApp lessons are on.':'WhatsApp messages are off.'))}catch(e){setMsg(e instanceof Error?e.message:'Please try again.')}finally{setBusy(false)}}
 const chat=s.business?`https://wa.me/${s.business}?text=LESSON`:'';
 return <div className="whatsapp-optin">
  {s.signInRequired?<a className="text-button" href="/signin?return_to=/settings" target="_top">Sign in to connect lessons on WhatsApp</a>
  :code?<><p>Send <strong>LINK {code}</strong> on WhatsApp from <strong>{s.contact!.phone}</strong> to finish. The code works for 30 minutes and proves the number is yours.</p>{s.business&&<a className="primary" href={`https://wa.me/${s.business}?text=${encodeURIComponent('LINK '+code)}`} target="_blank" rel="noreferrer">Open WhatsApp</a>}<button className="text-button" disabled={busy} onClick={()=>act({action:'optout'})}>Cancel</button></>
  :on?<><p>Linked: <strong>{s.contact!.phone}</strong>. Lessons and progress match the website. Send TODAY for a mission or PERFORMANCE for your recap. Turn on daily performance reminders with REMIND 7pm daily. Reply STOP anytime.</p>{s.performanceRemindersReady===false&&<p className="small">Automatic recaps after 24 hours of silence need an approved WhatsApp performance template. Until then, message PERFORMANCE to get your recap.</p>}{chat&&<a className="primary" href={chat} target="_blank" rel="noreferrer">Get today’s lesson on WhatsApp</a>}<button className="outline" disabled={busy} onClick={()=>act({action:'recap'})}>Send my learning recap</button>{s.recapStatus&&<p className="small" role="status">Latest recap: {s.recapStatus==='sent'?'WhatsApp accepted the send; receipt is not yet confirmed.':s.recapStatus==='queued'?'Queued for the mentor connection.':s.recapStatus==='claimed'?'The mentor connection is processing it.':s.recapStatus==='failed'?'Sending failed. Try again after a minute.':'Not sent. Send TODAY on WhatsApp, then request a new recap.'}</p>}<button className="text-button" disabled={busy} onClick={()=>act({action:'optout'})}>Turn off WhatsApp messages</button></>
  :<><label htmlFor="wa-phone">Your WhatsApp number</label><input id="wa-phone" inputMode="tel" autoComplete="tel" value={phone} maxLength={25} placeholder="98765 43210" onChange={e=>setPhone(e.target.value)}/><label className="whatsapp-consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> I agree to link my name, course choices and learning progress to this WhatsApp number for lessons and completion updates, and get reminders only if I turn them on there. I can reply STOP anytime. These are not marketing messages.</label><button className="primary" disabled={busy||!consent||phone.trim().length<10} onClick={()=>act({action:'optin',phone,language,consent:true})}>{busy?'Saving…':'Turn on WhatsApp lessons'}</button></>}
  {msg&&<p role="status" className="small">{msg}</p>}
 </div>;
}
/** Shown in the "Learn on WhatsApp" dialog: once WhatsApp is connected it points to the opt-in, otherwise it keeps the original note. */
export function WhatsAppStatusNote({fallback}:{fallback:React.ReactNode}){
 const[s,setS]=useState<State|null>(null);
 useEffect(()=>{fetch('/api/whatsapp').then(r=>r.json() as Promise<State>).then(setS).catch(()=>setS({configured:false}))},[]);
 if(!s?.configured)return <>{fallback}</>;
 return <p>{s.contact?.state==='opted_in'?<>WhatsApp lessons are on for {s.contact.phone}. {s.business&&<a href={`https://wa.me/${s.business}?text=LESSON`} target="_blank" rel="noreferrer">Send LESSON on WhatsApp</a>} to get your next challenge.</>:<>WhatsApp lessons are live. <a href="/settings">Turn them on in Settings</a> with your number, then reply LESSON on WhatsApp for your next challenge.</>}</p>;
}
