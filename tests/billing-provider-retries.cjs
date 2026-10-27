const test=require('node:test'),assert=require('node:assert/strict');
const h=require('./helpers/harness.cjs');
const api=h.load('lib/billing/service.ts');
function setup(){h.reset({env:{RAZORPAY_KEY_ID:'rzp_test_synthetic',RAZORPAY_KEY_SECRET:'synthetic-secret',RAZORPAY_WEBHOOK_SECRET:'synthetic-webhook',BILLING_ADMIN_EMAIL:'owner@example.test'}});h.db.exec('DELETE FROM billing_sessions; DELETE FROM billing_plans');}
function plan(){h.db.prepare('INSERT INTO billing_plans(sku,provider_id,state,updated_at) VALUES (?,?,?,?)').run('plus_monthly:19900','plan_synthetic','ready',new Date().toISOString());}
const rejection=status=>Response.json({error:{description:'Must not expose provider details'}},{status});

for(const status of [400,401,403,422,429])test(`definitive HTTP ${status} checkout rejection permits a deliberate retry`,async()=>{
 setup();plan();let calls=0;global.fetch=async()=>{calls++;return calls===1?rejection(status):Response.json({id:'sub_synthetic'})};
 await assert.rejects(()=>api.createCheckout('member','plus_monthly',1),/Razorpay could not complete the request/);assert.equal(calls,1,'No automatic retry');
 assert.equal(h.db.prepare('SELECT state FROM billing_sessions').get().state,'rejected');
 const result=await api.createCheckout('member','plus_monthly',1);assert.equal(result.subscription_id,'sub_synthetic');assert.equal(calls,2);
 await api.createCheckout('member','plus_monthly',1);assert.equal(calls,2,'Reuse successful checkout');
});

for(const failure of [408,409,500,502,'timeout','network','invalid-success'])test(`ambiguous ${failure} checkout remains locked`,async()=>{
 setup();plan();let calls=0;global.fetch=async()=>{calls++;if(failure==='timeout')throw new DOMException('Timed out','TimeoutError');if(failure==='network')throw new TypeError('Network failed');return failure==='invalid-success'?Response.json({}):rejection(failure)};
 await assert.rejects(()=>api.createCheckout('member','plus_monthly',1));await assert.rejects(()=>api.createCheckout('member','plus_monthly',1),/already exists/);
 assert.equal(calls,1);assert.equal(h.db.prepare('SELECT state FROM billing_sessions').get().state,'creating');
});

test('rejected plan can be reserved again and concurrent owner retries make one set of provider calls',async()=>{
 setup();let calls=0;global.fetch=async(url,options)=>{calls++;if(calls===1)return rejection(400);await new Promise(resolve=>setImmediate(resolve));return Response.json({id:'plan_'+calls})};
 await assert.rejects(()=>api.provisionPlans(),/Razorpay could not complete the request/);assert.equal(calls,1);assert.equal(h.db.prepare('SELECT state FROM billing_plans').get().state,'rejected');
 const results=await Promise.allSettled([api.provisionPlans(),api.provisionPlans()]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(calls,6,'One rejected call and five successful plan creations');
 assert.equal(h.db.prepare("SELECT count(*) n FROM billing_plans WHERE state='ready'").get().n,5);await api.provisionPlans();assert.equal(calls,6);
});

test('rejected one-time order permits a deliberate retry without duplicate concurrent orders',async()=>{
 setup();let calls=0;global.fetch=async()=>{calls++;if(calls===1)return rejection(429);await new Promise(resolve=>setImmediate(resolve));return Response.json({id:'order_synthetic'})};
 await assert.rejects(()=>api.createCheckout('member','sprint',1),/Razorpay could not complete the request/);assert.equal(calls,1);
 const results=await Promise.allSettled([api.createCheckout('member','sprint',1),api.createCheckout('member','sprint',1)]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(calls,2);assert.equal(h.db.prepare("SELECT count(*) n FROM billing_sessions WHERE state='created'").get().n,1);
});

for(const status of [401,403,422,429])test(`HTTP ${status} plan rejection releases only the rejected reservation`,async()=>{
 setup();let calls=0;global.fetch=async()=>{calls++;return rejection(status)};
 await assert.rejects(()=>api.provisionPlans(),/Razorpay could not complete the request/);assert.equal(calls,1);assert.equal(h.db.prepare('SELECT state FROM billing_plans').get().state,'rejected');
 await assert.rejects(()=>api.provisionPlans(),/Razorpay could not complete the request/);assert.equal(calls,2);assert.equal(h.db.prepare('SELECT count(*) n FROM billing_plans').get().n,1);
});

for(const failure of [408,409,500,502,'timeout','network','invalid-success'])test(`ambiguous ${failure} plan creation remains locked`,async()=>{
 setup();let calls=0;global.fetch=async()=>{calls++;if(failure==='timeout')throw new DOMException('Timed out','TimeoutError');if(failure==='network')throw new TypeError('Network failed');return failure==='invalid-success'?Response.json({}):rejection(failure)};
 await assert.rejects(()=>api.provisionPlans());await assert.rejects(()=>api.provisionPlans(),/needs reconciliation/);assert.equal(calls,1);assert.equal(h.db.prepare('SELECT state FROM billing_plans').get().state,'creating');
});

test('membership checkout creates its missing Razorpay plan once, without an owner setup step',async()=>{
 setup();const routes=[];global.fetch=async(url,options)=>{const route=String(url).split('/v1/')[1];routes.push(route);if(route==='plans')return Response.json({id:'plan_auto'});return Response.json({id:'sub_auto'+routes.length,plan_id:JSON.parse(options.body).plan_id})};
 const result=await api.createCheckout('member','plus_monthly',1);assert.equal(result.subscription_id,'sub_auto2');assert.deepEqual(routes,['plans','subscriptions']);
 assert.equal(h.db.prepare("SELECT provider_id FROM billing_plans WHERE sku='plus_monthly:19900'").get().provider_id,'plan_auto');
 await api.createCheckout('other-member','plus_monthly',1);assert.deepEqual(routes,['plans','subscriptions','subscriptions'],'Plan is reused');
});
