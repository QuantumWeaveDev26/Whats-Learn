import {database} from '@/lib/storage';
import {billingCatalogue,quote,type SKU} from './catalogue';
import {razorpay,BillingError,billingConfig,billingMode,verifyHmac,assertPaymentLaunchReady,type BillingMode} from './razorpay';
export type BillingSession={id:string;user_id:string;sku:SKU;kind:string;quantity:string;amount:string;provider_id:string|null;state:string;created_at:string;updated_at:string;mode?:string;payment_id?:string|null};
const OPEN="('creating','created','authenticated','active','pending','halted')";
function currentMode():BillingMode{const m=billingMode();if(!m)throw new BillingError('Checkout is not configured yet. No payment was taken.',503);return m}
/** Test and live plans live side by side, so switching keys never reuses a plan from the other mode. */
const planKey=(sku:string,mode:BillingMode)=>mode==='live'?'live:'+sku:sku;
const label=(mode:BillingMode)=>mode==='live'?'WhatsLearn':'WhatsLearn — TEST';
export async function provisionPlans(){
 const db=database();const mode=currentMode();const output=[];
 for(const [sku,p] of Object.entries(billingCatalogue)){
  if(!p.period)continue;const key=planKey(sku,mode);
  const row=await db.prepare('SELECT * FROM billing_plans WHERE sku=?').bind(key).first();
  if(row?.provider_id){output.push({sku,id:row.provider_id});continue;}
  if(row)throw new BillingError('A previous plan creation needs reconciliation in Razorpay before retrying. No duplicate plan was created.',409);
  await db.prepare('INSERT INTO billing_plans(sku,state,updated_at) VALUES (?,?,?)').bind(key,'creating',new Date().toISOString()).run();
  const plan=await razorpay('plans',{period:p.period,interval:1,item:{name:(mode==='live'?'WhatsLearn — ':'WhatsLearn TEST — ')+p.name,amount:p.amount,currency:'INR'},notes:{whatslearn_sku:sku,mode}});
  if(typeof plan.id!=='string'||!plan.id.startsWith('plan_'))throw new BillingError('Unexpected plan response.',502);
  await db.prepare('UPDATE billing_plans SET provider_id=?,state=?,updated_at=? WHERE sku=?').bind(plan.id,'ready',new Date().toISOString(),key).run();output.push({sku,id:plan.id});
 }
 return output;
}
/** First-sprint credit: a paid sprint in the last seven days, and no earlier Plus or Pro subscription. Needs RAZORPAY_SPRINT_CREDIT_OFFER_ID. */
async function sprintCreditOffer(userId:string,sku:SKU,mode:BillingMode){
 const offer=billingConfig().sprintOfferId;if(!offer||!['plus_monthly','pro_monthly'].includes(sku))return null;
 const db=database();const since=new Date(Date.now()-7*864e5).toISOString();
 const sprint=await db.prepare("SELECT id FROM billing_sessions WHERE user_id=? AND mode=? AND sku='sprint' AND state='paid' AND updated_at>=? LIMIT 1").bind(userId,mode,since).first();
 if(!sprint)return null;
 const earlier=await db.prepare("SELECT id FROM billing_sessions WHERE user_id=? AND mode=? AND sku IN ('plus_monthly','pro_monthly') AND state IN ('authenticated','active','pending','halted','cancelled','completed') LIMIT 1").bind(userId,mode).first();
 return earlier?null:offer;
}
export async function createCheckout(userId:string,sku:SKU,quantity:number){
 assertPaymentLaunchReady();
 let p:ReturnType<typeof quote>;
 try{p=quote(sku,quantity)}catch{throw new BillingError(sku==='teams_monthly'?'Choose between 5 and 100 learners for Teams.':'Choose one learner for an individual plan.',400)}
 if(sku==='teams_monthly')throw new BillingError('Teams enrolment is assisted by the WhatsLearn team until individual learner seats are available. No checkout was created.',409);
 const db=database();const mode=currentMode();
 const prior=await db.prepare(`SELECT * FROM billing_sessions WHERE user_id=? AND sku=? AND quantity=? AND state IN ${OPEN} ORDER BY created_at DESC LIMIT 1`).bind(userId,sku,String(quantity)).first<BillingSession>();
 if(prior&&(prior.mode||'test')!==mode){await db.prepare('UPDATE billing_sessions SET state=?,updated_at=? WHERE id=?').bind('superseded',new Date().toISOString(),prior.id).run()}
 else if(prior){if(prior.state==='created'&&prior.provider_id)return checkoutResult(prior);throw new BillingError(prior.state==='active'?'You already have this plan. Manage it from the membership page.':'A checkout or subscription already exists for this plan. Refresh its status or cancel it before starting another.',409)}
 // One immutable row per open user/plan/quantity prevents concurrent duplicate creation.
 const id=crypto.randomUUID();const now=new Date().toISOString();
 const lock=await db.prepare('INSERT OR IGNORE INTO billing_sessions(id,user_id,sku,kind,quantity,amount,state,created_at,updated_at,mode) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(id,userId,sku,p.period?'subscription':'order',String(quantity),String(p.total),'creating',now,now,mode).run();
 if(!lock.meta.changes)throw new BillingError('Checkout is already being created.',409);
 let entity;
 if(p.period){
  const plan=await db.prepare('SELECT provider_id FROM billing_plans WHERE sku=? AND state=?').bind(planKey(sku,mode),'ready').first();
  if(!plan){await db.prepare('UPDATE billing_sessions SET state=? WHERE id=?').bind('not_configured',id).run();throw new BillingError(mode==='live'?'Paid plans are not set up yet. No payment was taken.':'Create the test plans on the payment setup page first.',503)}
  const offer=await sprintCreditOffer(userId,sku,mode);
  entity=await razorpay('subscriptions',{plan_id:plan.provider_id,total_count:p.cycles,quantity,customer_notify:0,...(offer?{offer_id:offer}:{}),notes:{whatslearn_checkout:id,mode}});
 }
 else entity=await razorpay('orders',{amount:p.total,currency:'INR',receipt:id,notes:{whatslearn_checkout:id,mode}});
 const prefix=p.period?'sub_':'order_';if(typeof entity.id!=='string'||!entity.id.startsWith(prefix))throw new BillingError('Unexpected checkout response.',502);
 await db.prepare('UPDATE billing_sessions SET provider_id=?,state=?,updated_at=? WHERE id=?').bind(entity.id,'created',new Date().toISOString(),id).run();
 return checkoutResult({id,sku,kind:p.period?'subscription':'order',amount:String(p.total),provider_id:entity.id,mode} as BillingSession);
}
function checkoutResult(s:BillingSession){const mode=(s.mode||'test') as BillingMode;return {sessionId:s.id,key:billingConfig().keyId,amount:Number(s.amount),currency:'INR',name:label(mode),description:billingCatalogue[s.sku].name,mode,...(s.kind==='order'?{order_id:s.provider_id}:{subscription_id:s.provider_id})}}
export async function ownedSession(userId:string,id:string){const row=await database().prepare('SELECT * FROM billing_sessions WHERE id=? AND user_id=?').bind(id,userId).first<BillingSession>();if(!row)throw new BillingError('Checkout not found.',404);return row}
/** Paid access follows Razorpay's verified status: a paid order gives seven days (one sprint); an active subscription runs to its current period end. */
async function applyEntitlement(row:BillingSession,state:string,currentEnd:number|null){
 const db=database();const now=new Date();const mode=row.mode||'test';
 const existing=await db.prepare('SELECT * FROM entitlements WHERE session_id=?').bind(row.id).first<{status:string;ends_at:string}>();
 let status:string|null=null,ends:string|null=null;
 if(row.kind==='order'&&state==='paid'){status=existing?.status==='refunded'?'refunded':'active';ends=existing?.ends_at||new Date(now.getTime()+7*864e5).toISOString()}
 else if(row.kind==='subscription'&&state==='active'){status='active';const p=billingCatalogue[row.sku].period;ends=currentEnd?new Date(currentEnd*1000).toISOString():new Date(now.getTime()+(p==='yearly'?366:31)*864e5).toISOString()}
 else if(existing&&['halted','cancelled','completed','expired'].includes(state)){status='ended';ends=now.toISOString()<existing.ends_at?now.toISOString():existing.ends_at}
 if(!status||!ends)return existing?.status==='active'&&existing.ends_at>now.toISOString();
 await db.prepare('INSERT INTO entitlements(session_id,user_id,mode,sku,status,ends_at,updated_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(session_id) DO UPDATE SET status=excluded.status,ends_at=excluded.ends_at,updated_at=excluded.updated_at').bind(row.id,row.user_id,mode,row.sku,status,ends,now.toISOString()).run();
 return status==='active'&&ends>now.toISOString();
}
export async function activeEntitlement(userId:string){
 // Paid access follows the billing mode; an owner-approved reward (mode 'reward') is a separate, account-bound grant and works whatever the billing mode is.
 const mode=billingMode();
 const row=await database().prepare("SELECT sku,ends_at,mode FROM entitlements WHERE user_id=? AND (mode='reward' OR mode=?) AND status='active' AND ends_at>? ORDER BY CASE WHEN sku LIKE 'pro_%' THEN 3 WHEN sku LIKE 'plus_%' OR sku='teams_monthly' THEN 2 ELSE 1 END DESC,ends_at DESC LIMIT 1").bind(userId,mode||'reward',new Date().toISOString()).first<{sku:SKU;ends_at:string;mode:string}>();
 return row?{sku:row.sku,plan:billingCatalogue[row.sku]?.name||row.sku,endsAt:row.ends_at,mode:row.mode}:null;
}
export async function hasPaidAccess(userId:string){return !!await activeEntitlement(userId)}
function assertSessionMode(row:BillingSession){if((row.mode||'test')!==currentMode())throw new BillingError('This checkout belongs to a different billing mode. Use the matching Razorpay configuration.',409)}
export async function syncSession(row:BillingSession){
 assertSessionMode(row);
 if(!row.provider_id)throw new BillingError('Checkout needs reconciliation before it can be retried.',409);
 const entity=await razorpay((row.kind==='order'?'orders/':'subscriptions/')+encodeURIComponent(row.provider_id));
 if(row.kind==='order'&&(entity.currency!=='INR'||entity.amount!==Number(row.amount)))throw new BillingError('Order amount verification failed.',409);
 if(row.kind==='subscription'){
  const plan=await database().prepare('SELECT provider_id FROM billing_plans WHERE sku=?').bind(planKey(row.sku,(row.mode||'test') as BillingMode)).first();
  if(entity.plan_id!==plan?.provider_id||entity.quantity!==Number(row.quantity))throw new BillingError('Subscription verification failed.',409);
 }
 const state=String(entity.status||'unknown');
 await database().prepare('UPDATE billing_sessions SET state=?,updated_at=? WHERE id=?').bind(state,new Date().toISOString(),row.id).run();
 const activated=await applyEntitlement(row,state,typeof entity.current_end==='number'?entity.current_end:null);
 const test=(row.mode||'test')==='test';
 return {id:row.id,sku:row.sku,state,mode:row.mode||'test',paidAccessActivated:activated,currentEnd:entity.current_end||null,message:activated?(test?'Test payment verified. Test access is active; no real money moved.':'Payment verified. Your access is active.'):test?'Test billing status updated. No real payment was made.':'Billing status updated.'};
}
export async function verifyCheckout(userId:string,sessionId:string,paymentId:string,signature:string){
 const row=await ownedSession(userId,sessionId);assertSessionMode(row);if(!row.provider_id)throw new BillingError('Checkout not ready.',409);
 const message=row.kind==='order'?row.provider_id+'|'+paymentId:paymentId+'|'+row.provider_id;
 if(!await verifyHmac(billingConfig().keySecret,message,signature))throw new BillingError('Payment signature verification failed.',400);
 const payment=await razorpay('payments/'+encodeURIComponent(paymentId));
 if(row.kind==='order'&&(payment.order_id!==row.provider_id||payment.amount!==Number(row.amount)||payment.currency!=='INR'))throw new BillingError('Payment does not match this order.',400);
 await database().prepare('UPDATE billing_sessions SET payment_id=? WHERE id=?').bind(paymentId,row.id).run();
 return syncSession(row);
}
export async function cancelSubscription(userId:string,id:string){
 const row=await ownedSession(userId,id);
 if(row.kind!=='subscription'||!row.provider_id)throw new BillingError('This attempt did not create a subscription. There is nothing to cancel.',400);
 const fresh=await syncSession(row);
 if(['cancelled','completed','expired'].includes(fresh.state))return {...fresh,message:'This subscription has already ended.'};
 const live=(row.mode||'test')==='live';
 // Live: stop future renewals and keep access to the end of the paid period (matches the refund policy).
 // Test: cancel now so the integration can be verified immediately.
 await razorpay('subscriptions/'+encodeURIComponent(row.provider_id)+'/cancel',{cancel_at_cycle_end:live});
 const verified=await syncSession(row);
 if(live)return {...verified,message:'Renewal cancelled. You keep access until the end of the period you paid for.'};
 if(verified.state!=='cancelled')return {...verified,message:'Razorpay accepted the cancellation request, but has not yet confirmed cancelled status. Refresh status before retrying.'};
 return {...verified,message:'Razorpay confirmed: test subscription cancelled immediately. No real payment was made.'};
}
export async function processWebhook(raw:string,signature:string,eventId:string){
 if(!billingMode()||!billingConfig().webhookSecret)throw new BillingError('Webhooks are not configured.',503);
 if(!await verifyHmac(billingConfig().webhookSecret,raw,signature))throw new BillingError('Invalid webhook signature.',400);
 const db=database();if(await db.prepare('SELECT id FROM billing_events WHERE id=?').bind(eventId).first())return {duplicate:true};
 const event=JSON.parse(raw);const allowed=['order.paid','payment.captured','payment.failed','subscription.authenticated','subscription.activated','subscription.charged','subscription.pending','subscription.halted','subscription.cancelled','subscription.completed','subscription.paused','subscription.resumed','refund.processed'];
 if(!allowed.includes(event.event))return {ignored:true};
 if(event.event==='refund.processed'){
  // A full refund of a sprint order ends its access. Partial refunds leave access as it is.
  const refund=event.payload?.refund?.entity;const paymentId=refund?.payment_id;
  if(typeof paymentId==='string'&&/^pay_[a-zA-Z0-9]+$/.test(paymentId)){
   const payment=await razorpay('payments/'+encodeURIComponent(paymentId));
   const row=await db.prepare('SELECT * FROM billing_sessions WHERE payment_id=? OR provider_id=?').bind(paymentId,String(payment.order_id||'')).first<BillingSession>();
   if(row&&row.kind==='order'){
    assertSessionMode(row);
    if(payment.order_id!==row.provider_id||payment.currency!=='INR'||payment.amount!==Number(row.amount))throw new BillingError('Refund payment does not match this order.',409);
    await db.prepare('UPDATE billing_sessions SET payment_id=? WHERE id=?').bind(paymentId,row.id).run();
    // Multiple partial refunds can together exhaust a sprint payment.
    if(Number(refund.amount)>=Number(row.amount)||Number(payment.amount_refunded)>=Number(row.amount))await db.prepare("UPDATE entitlements SET status='refunded',updated_at=? WHERE session_id=?").bind(new Date().toISOString(),row.id).run();
   }
  }
 }else{
  const sub=event.payload?.subscription?.entity?.id;const order=event.payload?.order?.entity?.id||event.payload?.payment?.entity?.order_id;
  const providerId=sub||order;
  if(providerId){const row=await db.prepare('SELECT * FROM billing_sessions WHERE provider_id=?').bind(providerId).first<BillingSession>();if(row){await syncSession(row);
    const payment=event.payload?.payment?.entity;
    if(row.kind==='order'&&typeof payment?.id==='string'&&/^pay_[a-zA-Z0-9]+$/.test(payment.id)&&payment.order_id===row.provider_id&&payment.currency==='INR'&&payment.amount===Number(row.amount))await db.prepare('UPDATE billing_sessions SET payment_id=? WHERE id=?').bind(payment.id,row.id).run();
   }}
 }
 await db.prepare('INSERT OR IGNORE INTO billing_events(id,event,processed_at) VALUES (?,?,?)').bind(eventId,event.event,new Date().toISOString()).run();return {received:true};
}
