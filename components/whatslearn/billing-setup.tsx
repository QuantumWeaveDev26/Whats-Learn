'use client';
import {useEffect,useState} from 'react';
import AccountShell from '@/components/whatslearn/account-shell';
import RazorpayCheckout,{billingRequest} from '@/components/whatslearn/razorpay-checkout';
import {billingCatalogue,type SKU} from '@/lib/billing/catalogue';
import {billingPlanName} from '@/lib/billing/display';

export default function BillingSetup(){
 const [state,setState]=useState<any>(null),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[sku,setSku]=useState<SKU>('plus_monthly'),[quantity,setQuantity]=useState(5),[confirm,setConfirm]=useState('');
 const live=state?.mode==='live';
 const modeLabel=live?'Live':'Test';
 async function load(){try{const r=await fetch('/api/billing');setState(await r.json())}catch{setNotice('Setup status could not load. Please retry.')}}
 useEffect(()=>{void load()},[]);
 async function act(action:string,sessionId?:string){
  setBusy(true);setNotice('');
  try{const d=await billingRequest({action,...(sessionId?{sessionId}:{})});setNotice(action==='plans'?`${modeLabel} plans created or reused.`:d.message||'Billing status refreshed.');setConfirm('');await load()}
  catch(e){setNotice(e instanceof Error?e.message:'Please retry.')}
  finally{setBusy(false)}
 }
 return <AccountShell>
  <div className="account-heading">
   <p className="kicker">PAYMENT SETUP · {live?'LIVE BILLING':'OWNER TEST SPACE'}</p>
   <h1>{live?'Your live payment setup.':<>Test the flow.<br/><em>Then open for business.</em></>}</h1>
   <p>{live?'Live mode is enabled. Completing checkout charges real money. Public checkout opens only when the public checkout setting is also enabled.':'Real charges stay off until a live key and BILLING_LIVE_ENABLED=true are both set. Test payments unlock test access only, which never counts once live billing is on.'}</p>
  </div>
  <section className="account-card">
   <h2>1. Connect your Razorpay {live?'live':'test'} account</h2>
   <p>Use the matching {live?'live':'test'} Key ID, Key Secret and webhook secret in the hosted site’s protected environment settings. Never paste secrets into a chat, a public page or source code.</p>
   {state?.setup&&<ul className="checkout-setup">{state.setup.steps.map((x:{id:string;ok:boolean;label:string;fix:string})=><li key={x.id}>{x.ok?'✓':'✗'} {x.label}{x.ok?'':<> · {x.fix}</>}</li>)}</ul>}
   {!state?<p>Checking setup…</p>:state.signInRequired?<a href="/signin?return_to=/billing/setup" target="_top" className="primary">Sign in to check setup</a>:state.ownerSetupRequired?<p>{state.ownerMissing?'Add BILLING_ADMIN_EMAIL in your protected environment settings.':'Sign in with the billing owner account configured in BILLING_ADMIN_EMAIL.'}</p>:state.error?<p role="alert">{state.error}</p>:<ul>
    <li>{modeLabel} API key: {(live?state.config?.liveKey:state.config?.testKey)?'Ready':'Missing'}</li>
    <li>API secret: {state.config?.secret?'Configured':'Missing'}</li>
    <li>Webhook secret: {state.config?.webhook?'Configured':'Missing'}</li>
    <li>Mode: {live?'LIVE · real payments':'Test'}{state.config?.liveKey&&!state.config?.liveEnabled?' (a live key is set but BILLING_LIVE_ENABLED is not true, so checkout stays closed)':''}</li>
    <li>Checkout for all signed-in learners: {state.checkoutOpen?'Open':'Owner only'}</li>
    <li>First-sprint credit offer: {state.config?.sprintOffer?'Configured':'Not set'}</li>
   </ul>}
  </section>
  <section className="account-card" style={{marginTop:24}}>
   <h2>2. Create your {live?'live':'test'} membership plans</h2>
   <p>Creates Plus monthly/yearly, Pro monthly/yearly and Teams monthly in {live?'Live':'Test'} mode. Existing plans in this mode are reused. Creating plans does not charge anyone. The ₹149 sprint uses a one-time order.</p>
   <button className="primary" disabled={!state?.enabled||busy} onClick={()=>act('plans')}>{live?'Create live plans':'Create test plans'}</button>
   {state?.plans?.filter((p:any)=>live?p.sku.startsWith('live:'):!p.sku.startsWith('live:')).map((p:any)=><p key={p.sku}>{billingPlanName(p.sku)}: {p.state}</p>)}
  </section>
  <section className="account-card" style={{marginTop:24}}>
   <h2>3. {live?'Open live checkout':'Try checkout'}</h2>
   <label htmlFor="test-plan">Plan</label>
   <select id="test-plan" value={sku} onChange={e=>setSku(e.target.value as SKU)} style={{display:'block',padding:12,margin:'12px 0',maxWidth:'100%'}}>{Object.entries(billingCatalogue).map(([id,p])=><option key={id} value={id}>{p.name} · ₹{p.amount/100}</option>)}</select>
   {sku==='teams_monthly'&&<label>Learners (5–100)<input type="number" min={5} max={100} value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/></label>}
   <p>Total per {sku==='sprint'?'purchase':sku.endsWith('annual')?'year':'month'}: ₹{billingCatalogue[sku].amount/100*(sku==='teams_monthly'?quantity:1)}</p>
   <p className="small">{sku==='sprint'?'One-time payment; no recurring mandate.':`${modeLabel} mandates run for up to ${billingCatalogue[sku].cycles} ${sku.endsWith('annual')?'annual':'monthly'} payments.`} {live?'Completing payment here moves real money.':'Use Razorpay test details only. No real money moves.'}</p>
   <RazorpayCheckout sku={sku} quantity={sku==='teams_monthly'?quantity:1} onComplete={load}/>
  </section>
  <section className="account-card" style={{marginTop:24}}>
   <h2>4. Check status and cancellation</h2>
   <p>Refresh asks Razorpay for the latest status. Test and live sessions are labelled separately. Live cancellations stop future renewals at the end of the paid period; test cancellations take effect immediately.</p>
   {state?.sessions?.length?state.sessions.map((s:any)=>{
    const sessionLive=s.mode==='live';
    const sameMode=(s.mode||'test')===(state.mode||'test');
    return <article key={s.id} style={{borderTop:'1px solid #ddd',padding:'16px 0'}}>
     <strong>{billingPlanName(s.sku)} · {s.state==='not_configured'?'Setup incomplete — no subscription created':s.state} ({sessionLive?'live':'test'})</strong>
     <p>₹{Number(s.amount)/100} · {s.quantity} learner(s)</p>
     {s.provider_id&&<p className="small">Razorpay reference: {s.provider_id}</p>}
     {s.provider_id&&<button className="outline" disabled={busy||!sameMode} onClick={()=>act('refresh',s.id)}>Refresh status</button>}
     {s.provider_id&&s.kind==='subscription'&&!['cancelled','completed','expired'].includes(s.state)&&<button className="outline" disabled={busy||!sameMode} onClick={()=>setConfirm(s.id)}>{sessionLive?'Stop live renewal':'Cancel test subscription now'}</button>}
     {!sameMode&&<p className="small">This {sessionLive?'live':'test'} session belongs to a different billing mode. Manage it with the matching Razorpay credentials.</p>}
     {confirm===s.id&&<div><p>{sessionLive?'Stop future renewals for this live subscription? Access lasts until the end of the paid period.':'Cancel this TEST subscription immediately? This ends the simulated subscription now. No real money is involved.'}</p><button className="primary" disabled={busy} onClick={()=>act('cancel',s.id)}>{sessionLive?'Confirm stop renewal':'Confirm immediate test cancellation'}</button><button onClick={()=>setConfirm('')}>Keep it</button></div>}
    </article>;
   }):<p>No checkouts yet.</p>}
  </section>
  {notice&&<p role="status" className="notice">{notice}</p>}
  <p className="small muted" style={{marginTop:24}}>Verify webhook delivery, failure and cancellation flows, refund policy, paid benefits, allowance enforcement, sprint-to-membership credit and tax/invoice settings before accepting customer payments.</p>
 </AccountShell>;
}
