'use client';
import {useEffect,useRef,useState} from 'react';
import {paidOnboardingUrl} from '@/lib/billing/allowances';
import type {SKU} from '@/lib/billing/catalogue';
import {fetchWithTimeout} from '@/lib/fetch-timeout';
export type CheckoutAvailability={enabled?:boolean;mode?:string;signInRequired?:boolean;checkoutOpen?:boolean};
let script:Promise<void>|undefined;
function loadRazorpay(){
 if((window as any).Razorpay)return Promise.resolve();
 if(!script)script=new Promise<void>((resolve,reject)=>{
  const s=document.createElement('script');
  const timer=setTimeout(()=>fail(),15000);
  function fail(){clearTimeout(timer);script=undefined;s.remove();reject(new Error('Razorpay could not load. Check your connection and try again.'))}
  s.src='https://checkout.razorpay.com/v1/checkout.js';s.onload=()=>{clearTimeout(timer);if((window as any).Razorpay)resolve();else fail()};s.onerror=fail;document.head.appendChild(s);
 });
 return script;
}
export async function billingRequest(body:unknown){const r=await fetchWithTimeout('/api/billing',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)},40000);const d:any=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Payment request could not finish. Refresh its status before retrying.');return d}
export default function RazorpayCheckout({sku,quantity=1,onComplete,availability,availabilityError=false,onRetry}:{sku:SKU;quantity?:number;onComplete?:()=>void;availability?:CheckoutAvailability|null;availabilityError?:boolean;onRetry?:()=>void}){
 const [local,setLocal]=useState<CheckoutAvailability|null>(null),[statusError,setStatusError]=useState(false),[attempt,setAttempt]=useState(0),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const pending=useRef(false);
 useEffect(()=>{
  if(availability!==undefined)return;
  let active=true;setStatusError(false);setLocal(null);
  fetchWithTimeout('/api/billing',{cache:'no-store',credentials:'same-origin'}).then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<CheckoutAvailability>}).then(d=>{if(active)setLocal(d)}).catch(()=>{if(active)setStatusError(true)});
  return()=>{active=false};
 },[availability,attempt]);
 const status=availability===undefined?local:availability,failed=availabilityError||statusError;
 const enabled=status?.enabled===true,live=status?.mode==='live',needsSignIn=status?.signInRequired===true&&status.checkoutOpen===true;
 async function start(){
  if(!enabled||pending.current)return;pending.current=true;setBusy(true);setMessage('');
  try{
   await loadRazorpay();
   const checkout=await billingRequest({action:'checkout',sku,quantity});
   const finish=()=>{pending.current=false;setBusy(false)};
   const options={key:checkout.key,name:checkout.name,description:checkout.description,currency:'INR',...(checkout.order_id?{order_id:checkout.order_id,amount:checkout.amount}:{subscription_id:checkout.subscription_id}),theme:{color:'#087f55'},modal:{ondismiss:()=>{finish();setMessage(live?'Checkout closed. Check your plan status before retrying if you authorised a payment.':'Test checkout closed. No success assumed.')}},handler:async(payment:any)=>{
    try{const result=await billingRequest({action:'verify',sessionId:checkout.sessionId,paymentId:payment.razorpay_payment_id,signature:payment.razorpay_signature});setMessage(result.message||'Payment status: '+result.state);const next=paidOnboardingUrl(result);if(next)window.location.assign(next);else onComplete?.()}
    catch(e){setMessage(e instanceof Error?e.message:'Verification could not finish. Refresh your plan status before retrying.')}
    finally{finish()}
   }};
   const modal=new (window as any).Razorpay(options);
   modal.on('payment.failed',()=>{finish();setMessage(live?'Payment was not confirmed. Check your plan status before retrying if your account was debited.':'The test payment failed. No paid access was activated.')});modal.open();
  }catch(e){setMessage(e instanceof Error&&e.name!=='AbortError'?e.message:'Checkout timed out. Refresh your plan status before retrying to avoid a duplicate.');pending.current=false;setBusy(false)}
 }
 if(needsSignIn)return <p className="small">Sign in to pay securely with Razorpay.</p>;
 return <div style={{marginTop:16}}>
  <p className="small" role="status">{failed?'Payment status could not load. Retry the status check.':!status?'Checking payment availability…':!enabled?'Paid checkout is temporarily unavailable. No payment was taken.':live?'Secure checkout by Razorpay · UPI, cards and net banking.':'TEST MODE · Use Razorpay test details only; no real money moves.'}</p>
  {failed?<button className="outline" onClick={()=>{if(onRetry)onRetry();else setAttempt(n=>n+1)}}>Retry payment status</button>:<button className="primary" disabled={!enabled||busy} onClick={start}>{busy?'Opening checkout…':enabled&&!live?'Open Razorpay test checkout':'Pay securely with Razorpay'}</button>}
  {message&&<p role="status" style={{marginTop:12}}>{message}</p>}
 </div>;
}
