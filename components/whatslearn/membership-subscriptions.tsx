'use client';
import {useEffect,useRef,useState} from 'react';
import {billingPlanName} from '@/lib/billing/display';

export type MembershipSession={id:string;sku:string;kind:string;state:string;mode?:string;canManage?:boolean;provider_id?:string|null};
export type MembershipBilling={accountKey?:string;mode?:'test'|'live';enabled?:boolean;admin?:boolean;signInRequired?:boolean;checkoutOpen?:boolean;sprintCreditAvailable?:boolean;sessions?:MembershipSession[];entitlement?:{plan:string;endsAt:string;mode:string}|null};
const ended=new Set(['cancelled','completed','expired','superseded','not_configured']);
const statusLabel=(state:string)=>(({created:'Not activated',authenticated:'Awaiting activation',active:'Active',pending:'Payment pending',halted:'Payment stopped',paused:'Paused',cancelled:'Ended',completed:'Completed',expired:'Expired',creating:'Being created'} as Record<string,string>)[state]||'Needs review');

/** Manage only the requesting account's subscriptions, even while new sales are closed. */
export default function MembershipSubscriptions({billing,onReload}:{billing:MembershipBilling|null;onReload:()=>Promise<void>}){
 const [confirm,setConfirm]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState(false);
 const alive=useRef(true),pending=useRef(false);useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[]);
 const sessions=(billing?.sessions||[]).filter(s=>s.kind==='subscription'&&!['superseded','not_configured'].includes(s.state));
 if(!billing?.accountKey||!sessions.length)return null;
 async function act(action:'refresh'|'cancel',id:string){
  if(pending.current||!billing?.accountKey)return;pending.current=true;setBusy(true);setNotice('');setError(false);
  try{
   const r=await fetch('/api/billing',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','x-whatslearn-account':billing.accountKey},body:JSON.stringify({action,sessionId:id})});
   const d=await r.json() as {error?:string;message?:string};if(!r.ok)throw Error(d.error||'Your plan could not update.');
   if(alive.current){setNotice(d.message||'Plan status updated.');setConfirm('');await onReload()}
  }catch(e){if(alive.current){setError(true);setNotice(e instanceof Error?e.message:'Your plan could not update.')}}
  finally{pending.current=false;if(alive.current)setBusy(false)}
 }
 return <section className="membership-manage" aria-labelledby="membership-manage-title">
  <h2 id="membership-manage-title">Manage my subscription</h2>
  <p className="small muted">Stop future renewals here. This does not request a refund.</p>
  {sessions.map(s=>{const test=s.mode==='test';const manageable=s.canManage===true;const unused=['created','authenticated'].includes(s.state);return <article key={s.id}>
   <div><strong>{billingPlanName(s.sku)}{test?' · test':''}</strong><p className="small">{statusLabel(s.state)}</p></div>
   <div className="membership-manage-actions"><button className="outline" disabled={busy||!manageable} onClick={()=>void act('refresh',s.id)}>Refresh status</button>{!ended.has(s.state)&&<button className="outline" disabled={busy||!manageable} onClick={()=>setConfirm(s.id)}>{test?'Cancel test subscription':unused?'Cancel unused checkout':'Stop future renewals'}</button>}</div>
   {!manageable&&<p className="small muted">Online management is temporarily unavailable. <a href="/support">Ask our team to help</a>.</p>}
   {confirm===s.id&&<div className="membership-cancel-confirm" role="group" aria-label="Confirm subscription cancellation"><p>{test?'Cancel this test subscription immediately? No real payment is involved.':unused?'Cancel this unused checkout? You can then choose a plan at its current price. This does not create a payment.':'Stop future renewals for this subscription? You keep access for the period already paid for. This cannot be undone here.'}</p><button className="primary" disabled={busy} onClick={()=>void act('cancel',s.id)}>{busy?'Updating…':test?'Confirm test cancellation':unused?'Confirm cancel checkout':'Confirm stop renewal'}</button><button className="text-button" disabled={busy} onClick={()=>setConfirm('')}>Keep my subscription</button></div>}
  </article>})}
  {notice&&<p className="notice" role={error?'alert':'status'}>{notice}</p>}
  <p className="small"><a href="/refunds">Refund and cancellation policy</a> · <a href="/support">Get help with my plan</a></p>
 </section>;
}
