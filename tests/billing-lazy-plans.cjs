const test=require('node:test'),assert=require('node:assert/strict');
const h=require('./helpers/harness.cjs'),api=h.load('lib/billing/service.ts');
function setup(){h.reset({env:{RAZORPAY_KEY_ID:'rzp_live_synthetic',RAZORPAY_KEY_SECRET:'synthetic-secret',RAZORPAY_WEBHOOK_SECRET:'synthetic-webhook',BILLING_ADMIN_EMAIL:'owner@example.test',BILLING_LIVE_ENABLED:'true',BILLING_PUBLIC_CHECKOUT:'true',POLICY_APPROVED_REVISION:'2026-10-23',GRIEVANCE_OFFICER_NAME:'Test Officer',GRIEVANCE_OFFICER_EMAIL:'officer@example.test'}});h.db.exec('DELETE FROM billing_sessions; DELETE FROM billing_plans');}
function provider(onPlan){const calls=[];global.fetch=async(url,options)=>{const path=String(url).split('/v1/')[1],body=JSON.parse(options.body);calls.push({path,body});if(path==='plans'){if(onPlan){const r=await onPlan();if(r)return r}return Response.json({id:'plan_current'})}assert.equal(path,'subscriptions');return Response.json({id:'sub_'+calls.filter(c=>c.path==='subscriptions').length})};return calls;}

test('first learner checkout provisions only its immutable current-price plan; repeat reuses checkout',async()=>{
 setup();h.db.prepare('INSERT INTO billing_plans(sku,provider_id,state,updated_at) VALUES (?,?,?,?)').run('live:plus_monthly','plan_original','ready','2026-10-16');
 const calls=provider(),first=await api.createCheckout('signed-in-learner','plus_monthly',1);assert.equal(first.amount,19900);assert.equal(calls.length,2);assert.equal(calls[0].path,'plans');assert.equal(calls[0].body.item.amount,19900);assert.equal(calls[0].body.period,'monthly');assert.equal(calls[1].body.plan_id,'plan_current');assert.equal(calls[1].body.quantity,1);
 assert.equal(h.db.prepare('SELECT provider_id FROM billing_plans WHERE sku=?').get('live:plus_monthly').provider_id,'plan_original');assert.equal(h.db.prepare('SELECT provider_id FROM billing_plans WHERE sku=?').get('live:plus_monthly:19900').provider_id,'plan_current');assert.equal(h.db.prepare('SELECT count(*) n FROM billing_plans').get().n,2);
 const again=await api.createCheckout('signed-in-learner','plus_monthly',1);assert.equal(again.subscription_id,first.subscription_id);assert.equal(calls.length,2);
});

test('definitively rejected plan leaves checkout retryable before any subscription request',async()=>{
 setup();let failed=false;const calls=provider(()=>{if(!failed){failed=true;return Response.json({error:'synthetic'},{status:400})}});
 await assert.rejects(()=>api.createCheckout('member','plus_monthly',1),/Razorpay could not complete/);assert.deepEqual(calls.map(c=>c.path),['plans']);assert.equal(h.db.prepare('SELECT state FROM billing_sessions').get().state,'not_configured');
 const next=await api.createCheckout('member','plus_monthly',1);assert.ok(next.subscription_id);assert.deepEqual(calls.map(c=>c.path),['plans','plans','subscriptions']);
});

for(const failure of [500,'timeout'])test(`ambiguous ${failure} plan stays locked while checkout reservation is released`,async()=>{
 setup();const calls=provider(()=>{if(failure==='timeout')throw new DOMException('Timed out','TimeoutError');return Response.json({error:'synthetic'},{status:500})});
 await assert.rejects(()=>api.createCheckout('member','plus_monthly',1));await assert.rejects(()=>api.createCheckout('member','plus_monthly',1),/needs reconciliation/);assert.deepEqual(calls.map(c=>c.path),['plans']);assert.equal(h.db.prepare('SELECT state FROM billing_plans').get().state,'creating');assert.equal(h.db.prepare("SELECT count(*) n FROM billing_sessions WHERE state='creating'").get().n,0);
});

test('concurrent customers reserve one plan; competing checkout can retry once plan is ready',async()=>{
 setup();const calls=provider(async()=>{await new Promise(resolve=>setImmediate(resolve))});
 const out=await Promise.allSettled([api.createCheckout('member-a','plus_monthly',1),api.createCheckout('member-b','plus_monthly',1)]);assert.equal(out.filter(r=>r.status==='fulfilled').length,1);assert.equal(calls.filter(c=>c.path==='plans').length,1);assert.equal(calls.filter(c=>c.path==='subscriptions').length,1);
 const loser=out[0].status==='rejected'?'member-a':'member-b';await api.createCheckout(loser,'plus_monthly',1);assert.equal(calls.filter(c=>c.path==='plans').length,1);assert.equal(calls.filter(c=>c.path==='subscriptions').length,2);
});

test('assisted Teams checkout stops before plan provisioning or any session creation',async()=>{
 setup();const calls=provider();await assert.rejects(()=>api.createCheckout('member','teams_monthly',5),/assisted/);assert.equal(calls.length,0);assert.equal(h.db.prepare('SELECT count(*) n FROM billing_sessions').get().n,0);
});

test('ambiguous subscription creation remains locked after successful lazy plan provisioning',async()=>{
 setup();let calls=0;global.fetch=async(url)=>{calls++;if(String(url).endsWith('/plans'))return Response.json({id:'plan_current'});throw new DOMException('Timed out','TimeoutError')};
 await assert.rejects(()=>api.createCheckout('member','plus_monthly',1));await assert.rejects(()=>api.createCheckout('member','plus_monthly',1),/already exists/);assert.equal(calls,2);assert.equal(h.db.prepare('SELECT state FROM billing_sessions').get().state,'creating');assert.equal(h.db.prepare('SELECT state FROM billing_plans').get().state,'ready');
});

test('authenticated non-owner API checkout provisions its plan without the owner setup action',async()=>{
 setup();const calls=provider(),Module=require('node:module'),original=Module._load;
 Module._load=function(name,parent,isMain){if(name==='@/app/chatgpt-auth')return {getChatGPTUser:async()=>({userId:'signed-in-customer',email:'customer@example.test'})};return original.call(this,name,parent,isMain)};
 let route;try{route=h.load('app/api/billing/route.ts')}finally{Module._load=original}
 const result=await h.call(route,'/api/billing',{body:{action:'checkout',sku:'plus_monthly',quantity:1}});assert.equal(result.status,200);assert.equal(result.json.amount,19900);assert.ok(result.json.subscription_id);assert.deepEqual(calls.map(c=>c.path),['plans','subscriptions']);
});
