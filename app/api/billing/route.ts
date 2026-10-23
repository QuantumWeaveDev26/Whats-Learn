import {z} from 'zod';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {database,sameOrigin} from '@/lib/storage';
import {accountKey,matchesAccount} from '@/lib/auth/account-key';
import {assertTestAdmin,assertCanCheckout,billingConfig,billingMode,checkoutReady,paymentLaunchReady,isBillingAdmin,publicCheckoutOpen,BillingError} from '@/lib/billing/razorpay';
import {billingSetup} from '@/lib/billing/setup';
import {provisionPlans,createCheckout,ownedSession,syncSession,verifyCheckout,cancelSubscription,activeEntitlement} from '@/lib/billing/service';
const input=z.discriminatedUnion('action',[
 z.object({action:z.literal('plans')}).strict(),
 z.object({action:z.literal('checkout'),sku:z.enum(['sprint','plus_monthly','plus_annual','pro_monthly','pro_annual','teams_monthly']),quantity:z.number().int().min(1).max(100)}).strict(),
 z.object({action:z.literal('verify'),sessionId:z.string().uuid(),paymentId:z.string().regex(/^pay_[a-zA-Z0-9]+$/),signature:z.string().regex(/^[a-f0-9]{64}$/i)}).strict(),
 z.object({action:z.literal('refresh'),sessionId:z.string().uuid()}).strict(),
 z.object({action:z.literal('cancel'),sessionId:z.string().uuid()}).strict()
]);
const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});
/** Customers see only checkout state and their own plan. Setup status, configuration and plans go to the billing owner only. */
export async function GET(){const c=billingConfig();const open=publicCheckoutOpen();const sprintCreditAvailable=!!c.sprintOfferId;const user=await getChatGPTUser();
 if(!user)return response(open?{mode:'live',enabled:false,signInRequired:true,checkoutOpen:true,sprintCreditAvailable}:{enabled:false,checkoutOpen:false,sprintCreditAvailable});
 const admin=isBillingAdmin(user.email);
 if(!admin){try{
  const entitlement=await activeEntitlement(user.userId);
  const rows=(await database().prepare("SELECT id,sku,kind,quantity,amount,state,created_at,provider_id,mode FROM billing_sessions WHERE user_id=? AND mode=? ORDER BY CASE WHEN kind='subscription' AND state IN ('created','authenticated','active','pending','halted','paused') THEN 0 ELSE 1 END, created_at DESC LIMIT 20").bind(user.userId,'live').all()).results as {provider_id:string|null;mode:string;[key:string]:unknown}[];
  const sessions=rows.map(({provider_id,...row})=>({...row,canManage:!!provider_id&&billingMode()==='live'&&!!c.keySecret}));
  return response({accountKey:accountKey(user.userId),...(open?{mode:'live',enabled:true,checkoutOpen:true}:{enabled:false,checkoutOpen:false}),sessions,entitlement,sprintCreditAvailable});
 }catch{return response({error:'Your plan status could not load. Retry before making changes.'},503)}}
 const mode=billingMode()||'test';const setup=await billingSetup(user.email);
 if(!setup.steps.find(x=>x.id==='database')!.ok)return response({mode,enabled:false,admin,setup,error:'Billing tables are missing from the database. Run “pnpm db:local”, then restart “pnpm start”.'});
 try{const db=database();const [sessions,entitlement,plans,webhook]=await Promise.all([db.prepare('SELECT id,sku,kind,quantity,amount,state,created_at,provider_id,mode FROM billing_sessions WHERE user_id=? ORDER BY created_at DESC LIMIT 20').bind(user.userId).all(),activeEntitlement(user.userId),db.prepare('SELECT sku,provider_id,state FROM billing_plans').all(),db.prepare('SELECT event,processed_at FROM billing_events ORDER BY processed_at DESC LIMIT 1').first()]);return response({accountKey:accountKey(user.userId),webhook:{verifiedDeliverySeen:!!webhook,lastEvent:webhook?.event||null,lastReceivedAt:webhook?.processed_at||null},mode,sprintCreditAvailable,enabled:checkoutReady()&&paymentLaunchReady(),admin:true,checkoutOpen:open,setup,config:{testKey:c.keyId.startsWith('rzp_test_'),liveKey:c.keyId.startsWith('rzp_live_'),liveEnabled:c.liveEnabled,secret:!!c.keySecret,webhook:!!c.webhookSecret,publicCheckout:c.publicCheckout,sprintOffer:!!c.sprintOfferId},plans:plans.results,sessions:sessions.results.map((row:any)=>({...row,canManage:!!row.provider_id&&(row.mode||'test')===billingMode()&&!!c.keySecret})),entitlement})}catch{return response({error:'Billing storage is unavailable. Locally, run “pnpm db:local” and restart “pnpm start”; otherwise retry.'},503)}}
export async function POST(request:Request){if(!sameOrigin(request))return response({error:'Invalid origin.'},403);const user=await getChatGPTUser();if(!user)return response({error:'Sign in before checkout.'},401);if(!matchesAccount(request,user.userId))return response({error:'Your account changed. Reload this page before managing a plan.'},409);try{const text=await request.text();if(text.length>5000)return response({error:'Request too large.'},413);const p=input.parse(JSON.parse(text));if(p.action==='plans'){assertTestAdmin(user.email);return response({plans:await provisionPlans()})}if(p.action==='checkout'){assertCanCheckout(user.email);return response(await createCheckout(user.userId,p.sku,p.quantity))}if(p.action==='verify')return response(await verifyCheckout(user.userId,p.sessionId,p.paymentId,p.signature));if(p.action==='cancel')return response(await cancelSubscription(user.userId,p.sessionId));return response(await syncSession(await ownedSession(user.userId,p.sessionId)));}catch(e){if(e instanceof BillingError)return response({error:e.message},e.status);if(e instanceof z.ZodError||e instanceof SyntaxError)return response({error:'Invalid billing request.'},400);return response({error:'The billing request could not finish. Refresh its status before retrying to avoid a duplicate.'},503)}}
