import {env} from 'cloudflare:workers';
import {policyReadiness} from '@/lib/policy-readiness';
export class BillingError extends Error {constructor(message:string,public status=400){super(message)}}
export type BillingMode='test'|'live';
export function billingConfig(){const e=env as unknown as Record<string,string|undefined>;return {keyId:e.RAZORPAY_KEY_ID||'',keySecret:e.RAZORPAY_KEY_SECRET||'',webhookSecret:e.RAZORPAY_WEBHOOK_SECRET||'',adminEmail:(e.BILLING_ADMIN_EMAIL||'').trim().toLowerCase(),liveEnabled:e.BILLING_LIVE_ENABLED==='true',publicCheckout:e.BILLING_PUBLIC_CHECKOUT==='true',sprintOfferId:e.RAZORPAY_SPRINT_CREDIT_OFFER_ID||''}}
/** Test keys always work. Live keys work only when BILLING_LIVE_ENABLED=true is also set, so a pasted live key alone never takes real money. */
export function billingMode():BillingMode|null{const c=billingConfig();if(c.keyId.startsWith('rzp_test_'))return 'test';if(c.keyId.startsWith('rzp_live_')&&c.liveEnabled)return 'live';return null}
export function checkoutReady(){const c=billingConfig();return !!billingMode()&&!!c.keySecret&&!!c.webhookSecret&&!!c.adminEmail}
/** Kept for the owner test page and existing tests. */
export function testReady(){return checkoutReady()}
export function isBillingAdmin(email:string){const a=billingConfig().adminEmail;return !!a&&email.toLowerCase()===a}
/** Owner-only actions such as creating plans. */
export function assertTestAdmin(email:string){if(!isBillingAdmin(email))throw new BillingError('This action is restricted to the account owner.',403);if(!checkoutReady())throw new BillingError('Payment setup is incomplete. Checkout stays closed.',503)}
/** Checkout opens to customers only in LIVE mode with BILLING_PUBLIC_CHECKOUT=true. Test mode is always owner-only, so test payments can never give customers paid access. */
export function paymentLaunchReady(){return billingMode()!=='live'||policyReadiness().ready}
export function assertPaymentLaunchReady(){if(!paymentLaunchReady())throw new BillingError('Paid checkout is not open yet. Keep learning free; no payment was taken.',503)}
export function publicCheckoutOpen(){return checkoutReady()&&billingMode()==='live'&&billingConfig().publicCheckout&&paymentLaunchReady()}
export function assertCanCheckout(email:string){const admin=isBillingAdmin(email);if(!checkoutReady())throw new BillingError(admin?'Checkout is not configured yet. No payment was taken.':'Paid checkout is not open yet. No payment was taken.',503);assertPaymentLaunchReady();if(!admin&&!publicCheckoutOpen())throw new BillingError('Paid checkout is not open yet. No payment was taken.',403)}
export async function razorpay(path:string,body?:unknown){
 const c=billingConfig();if(!billingMode()||!c.keySecret)throw new BillingError('Only Razorpay test keys are accepted unless live billing is explicitly enabled.',503);
 const response=await fetch('https://api.razorpay.com/v1/'+path,{method:body===undefined?'GET':'POST',headers:{Authorization:'Basic '+btoa(c.keyId+':'+c.keySecret),'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new BillingError('Razorpay could not complete the request. Check the keys and Subscriptions access in your Razorpay dashboard.',502);
 return await response.json() as Record<string,any>;
}
export async function verifyHmac(secret:string,message:string,signature:string){if(!/^[a-f0-9]{64}$/i.test(signature))return false;const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);const bytes=Uint8Array.from(signature.match(/../g)!,h=>parseInt(h,16));return crypto.subtle.verify('HMAC',key,bytes,new TextEncoder().encode(message))}
