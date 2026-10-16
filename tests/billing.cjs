const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),{DatabaseSync}=require('node:sqlite'),{createHmac}=require('node:crypto');
const db=new DatabaseSync(':memory:');for(const f of ['0004_curious_human_cannonball.sql','0006_paid_access_ai_whatsapp.sql'])db.exec(fs.readFileSync(path.resolve(__dirname,'../drizzle/'+f),'utf8').replaceAll('--> statement-breakpoint',''));
const d1={prepare(sql){const stmt=db.prepare(sql);return {bind(...args){return {async first(){return stmt.get(...args)||null},async all(){return {results:stmt.all(...args)}},async run(){const r=stmt.run(...args);return {meta:{changes:r.changes}}}}},async all(){return {results:stmt.all()}}}}};
const env={DB:d1,RAZORPAY_KEY_ID:'rzp_test_example',RAZORPAY_KEY_SECRET:'test-only-fake-secret',RAZORPAY_WEBHOOK_SECRET:'test-only-fake-webhook',BILLING_ADMIN_EMAIL:'owner@example.test'};
let testUser=null;const original=Module._load;Module._load=function(name,parent,isMain){if(name==='@/app/chatgpt-auth')return {getChatGPTUser:async()=>testUser};if(name==='cloudflare:workers')return {env};if(name.startsWith('@/'))name=path.resolve(__dirname,'..',name.slice(2));return original.call(this,name,parent,isMain)};
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const remote=new Map();let calls=0;
global.fetch=async(url,options={})=>{calls++;const route=String(url).split('/v1/')[1];const body=options.body?JSON.parse(options.body):null;let result;
if(body&&route==='plans'){result={id:'plan_'+calls,...body};remote.set('plans/'+result.id,result)}
else if(body&&route==='orders'){result={id:'order_'+calls,status:'created',...body};remote.set('orders/'+result.id,result)}
else if(body&&route==='subscriptions'){result={id:'sub_'+calls,status:'created',...body};remote.set('subscriptions/'+result.id,result)}
else if(body&&route.endsWith('/cancel')){assert.equal(body.cancel_at_cycle_end,false,'Test cancellation must be immediate');result=remote.get(route.replace('/cancel',''));result.status='cancelled'}
else result=remote.get(route);
assert.ok(result,'Unexpected API call '+route);return Response.json(result)};
const {quote}=require('../lib/billing/catalogue.ts');const api=require('../lib/billing/service.ts');const rzp=require('../lib/billing/razorpay.ts');
const sign=(s,m)=>createHmac('sha256',s).update(m).digest('hex');
(async()=>{
assert.equal(quote('teams_monthly',5).total,199500);assert.equal(quote('plus_annual',1).total,499900);assert.throws(()=>quote('teams_monthly',4));assert.throws(()=>quote('plus_monthly',2));assert.throws(()=>rzp.assertTestAdmin('other@example.test'));
assert.equal(await rzp.verifyHmac('key','message',sign('key','message')),true);assert.equal(await rzp.verifyHmac('key','changed',sign('key','message')),false);
const plans=await api.provisionPlans();assert.equal(plans.length,5);const n=calls;await api.provisionPlans();assert.equal(calls,n);
const sprint=await api.createCheckout('user-a','sprint',1);const again=await api.createCheckout('user-a','sprint',1);assert.equal(sprint.order_id,again.order_id);
await assert.rejects(()=>api.ownedSession('user-b',sprint.sessionId));await assert.rejects(()=>api.verifyCheckout('user-a',sprint.sessionId,'pay_fake','0'.repeat(64)));
remote.get('orders/'+sprint.order_id).status='paid';remote.set('payments/pay_test',{order_id:sprint.order_id,amount:14900,currency:'INR',status:'captured'});
const paid=await api.verifyCheckout('user-a',sprint.sessionId,'pay_test',sign(env.RAZORPAY_KEY_SECRET,sprint.order_id+'|pay_test'));assert.equal(paid.state,'paid');assert.equal(paid.paidAccessActivated,true);assert.equal((await api.activeEntitlement('user-a')).sku,'sprint');assert.equal(await api.hasPaidAccess('user-b'),false);
const raw=JSON.stringify({event:'order.paid',payload:{order:{entity:{id:sprint.order_id}}}});await assert.rejects(()=>api.processWebhook(raw,'0'.repeat(64),'event1'));await api.processWebhook(raw,sign(env.RAZORPAY_WEBHOOK_SECRET,raw),'event1');assert.equal((await api.processWebhook(raw,sign(env.RAZORPAY_WEBHOOK_SECRET,raw),'event1')).duplicate,true);
const sub=await api.createCheckout('user-a','plus_monthly',1);remote.get('subscriptions/'+sub.subscription_id).status='active';remote.set('payments/pay_sub',{status:'captured'});const active=await api.verifyCheckout('user-a',sub.sessionId,'pay_sub',sign(env.RAZORPAY_KEY_SECRET,'pay_sub|'+sub.subscription_id));assert.equal(active.state,'active');assert.equal(active.paidAccessActivated,true);assert.equal((await api.cancelSubscription('user-a',sub.sessionId)).state,'cancelled');assert.equal((await api.activeEntitlement('user-a')).sku,'sprint','Cancelling the subscription leaves the separate sprint access');
const beforeCancel=calls;await api.cancelSubscription('user-a',sub.sessionId);assert.equal(calls,beforeCancel+1,'Repeated cancellation should only fetch status');await assert.rejects(()=>api.cancelSubscription('user-b',sub.sessionId));
const settled=await Promise.allSettled([api.createCheckout('user-b','pro_monthly',1),api.createCheckout('user-b','pro_monthly',1)]);assert.equal(settled.filter(x=>x.status==='fulfilled').length,1);

const route=require('../app/api/billing/route.ts'),hook=require('../app/api/billing/webhook/route.ts');
const req=(body,origin='https://whatslearn.in')=>new Request('https://whatslearn.in/api/billing',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
assert.equal((await route.POST(req({action:'plans'}))).status,401);
testUser={userId:'other',email:'other@example.test'};assert.equal((await route.POST(req({action:'plans'}))).status,403);
testUser={userId:'owner',email:'owner@example.test'};assert.equal((await route.POST(req({action:'plans'},'https://evil.example'))).status,403);
assert.equal((await route.POST(req({action:'checkout',sku:'plus_monthly',quantity:1,amount:1}))).status,400);
const invalidTeam=await route.POST(req({action:'checkout',sku:'teams_monthly',quantity:4}));assert.equal(invalidTeam.status,400);assert.match((await invalidTeam.json()).error,/5 and 100/);
const beforeTeamCalls=calls;const pausedTeam=await route.POST(req({action:'checkout',sku:'teams_monthly',quantity:5}));assert.equal(pausedTeam.status,409);assert.match((await pausedTeam.json()).error,/individual learner seats/);assert.equal(calls,beforeTeamCalls,'Teams must not contact Razorpay before seat assignment exists');assert.equal(db.prepare("SELECT COUNT(*) n FROM billing_sessions WHERE sku='teams_monthly'").get().n,0);
assert.equal((await route.POST(req({action:'plans',junk:'a'.repeat(5100)}))).status,413);
assert.equal((await hook.POST(new Request('https://whatslearn.in/api/billing/webhook',{method:'POST',body:'{}'}))).status,400);
assert.equal((await hook.POST(new Request('https://whatslearn.in/api/billing/webhook',{method:'POST',headers:{'x-razorpay-event-id':'forged'},body:'{}'}))).status,400);
console.log('PASS: route authentication, owner restriction, origin validation, price tampering, team-size validation message, payload limits and unsigned webhooks.');

const refund=JSON.stringify({event:'refund.processed',payload:{refund:{entity:{payment_id:'pay_test',amount:14900}}}});await api.processWebhook(refund,sign(env.RAZORPAY_WEBHOOK_SECRET,refund),'event-refund');assert.equal(await api.hasPaidAccess('user-a'),false,'A full sprint refund ends its access');
env.RAZORPAY_KEY_ID='rzp_live_forbidden';assert.equal(rzp.testReady(),false);await assert.rejects(()=>rzp.razorpay('plans'));
env.BILLING_LIVE_ENABLED='true';assert.equal(rzp.billingMode(),'live','Live keys need the explicit live switch');assert.equal(await api.hasPaidAccess('user-a'),false,'Test access never counts in live mode');delete env.BILLING_LIVE_ENABLED;
env.RAZORPAY_KEY_ID='rzp_test_example';env.BILLING_PUBLIC_CHECKOUT='true';testUser={userId:'learner',email:'learner@example.test'};assert.equal((await route.POST(req({action:'plans'}))).status,403,'Plan setup stays owner-only');assert.equal((await route.POST(req({action:'checkout',sku:'sprint',quantity:1}))).status,403,'Test mode stays owner-only even with public checkout on');env.RAZORPAY_KEY_ID='rzp_live_example';env.BILLING_LIVE_ENABLED='true';assert.equal((await route.POST(req({action:'checkout',sku:'sprint',quantity:1}))).status,200,'Public checkout opens for signed-in learners in live mode');delete env.BILLING_LIVE_ENABLED;env.RAZORPAY_KEY_ID='rzp_test_example';
console.log('PASS: pricing, quantity checks, owner restriction, signatures, plan reuse, duplicate checkout protection, cross-user ownership, callback verification, webhook replay, cancellation, live-key rejection, paid access, refunds, public checkout.');
})().catch(e=>{console.error(e);process.exitCode=1});
