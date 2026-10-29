'use client';
/** Buy a plan inside the app with the website's own Razorpay billing API. Unlike the website button,
 * a successful payment keeps the learner in the app and refreshes their plan here. */
import {useEffect,useState} from 'react';
import {Lock} from 'lucide-react';
import {billingRequest} from '@/components/whatslearn/razorpay-checkout';

type Status={enabled:boolean;mode:string;checked:boolean};
let script:Promise<void>|undefined;
function loadRazorpay(){
 if((window as {Razorpay?:unknown}).Razorpay)return Promise.resolve();
 if(!script)script=new Promise<void>((resolve,reject)=>{const s=document.createElement('script');s.src='https://checkout.razorpay.com/v1/checkout.js';s.onload=()=>resolve();s.onerror=()=>{script=undefined;s.remove();reject(new Error('Secure checkout could not load. Check your connection and try again.'))};document.head.appendChild(s)});
 return script;
}

export function useBillingStatus(){
 const [s,setS]=useState<Status>({enabled:false,mode:'live',checked:false});
 useEffect(()=>{let live=true;fetch('/api/billing',{cache:'no-store',credentials:'same-origin'}).then(r=>r.ok?r.json() as Promise<{enabled?:boolean;mode?:string}>:null).then(d=>{if(live)setS({enabled:d?.enabled===true,mode:d?.mode||'live',checked:true})}).catch(()=>{if(live)setS(x=>({...x,checked:true}))});return()=>{live=false}},[]);
 return s;
}

export function BuyButton({sku,label,status,onPaid,onMessage}:{sku:'plus_monthly'|'pro_monthly';label:string;status:Status;onPaid:()=>void;onMessage:(m:string)=>void}){
 const [busy,setBusy]=useState(false);const live=status.mode==='live';
 async function start(){
  if(!status.enabled||busy)return;setBusy(true);onMessage('');
  try{
   await loadRazorpay();
   const c=await billingRequest({action:'checkout',sku,quantity:1});
   const Rzp=(window as unknown as {Razorpay:new(o:unknown)=>{open:()=>void;on:(e:string,f:()=>void)=>void}}).Razorpay;
   const modal=new Rzp({key:c.key,name:c.name,description:c.description,currency:'INR',...(c.order_id?{order_id:c.order_id,amount:c.amount}:{subscription_id:c.subscription_id}),theme:{color:'#087A4B'},
    modal:{ondismiss:()=>{setBusy(false);onMessage('Checkout closed. If money left your account, your plan will appear here once Razorpay confirms it.')}},
    handler:async(p:{razorpay_payment_id:string;razorpay_signature:string})=>{
     try{const r=await billingRequest({action:'verify',sessionId:c.sessionId,paymentId:p.razorpay_payment_id,signature:p.razorpay_signature});
      if(r.paidAccessActivated===true){onMessage('');onPaid()}else onMessage(r.message||'Payment received. Your plan will switch on as soon as Razorpay confirms it.')}
     catch(e){onMessage(e instanceof Error?e.message:'We could not confirm the payment yet. Please check again in a minute.')}
     finally{setBusy(false)}}});
   modal.on('payment.failed',()=>{setBusy(false);onMessage('The payment did not go through. No plan was activated. If you see a debit, contact us from Help before retrying.')});
   modal.open();
  }catch(e){onMessage(e instanceof Error?e.message:'Checkout failed. Please try again.');setBusy(false)}
 }
 return <button type="button" className="wla-primary wla-full" disabled={!status.enabled||busy} onClick={start}>{busy?'Opening secure checkout…':!status.checked?'Checking…':status.enabled?<>{!live&&'TEST · '}{label}</>:<><Lock size={16}/>Checkout is not open yet</>}</button>;
}
