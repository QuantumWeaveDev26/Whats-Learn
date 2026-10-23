const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),Module=require('node:module');
const h=require('./helpers/harness.cjs');
let user=null;const original=Module._load;Module._load=function(name,parent,isMain){if(name==='@/app/chatgpt-auth')return {getChatGPTUser:async()=>user};return original.call(this,name,parent,isMain)};
const route=h.load('app/api/billing/route.ts'),{accountKey}=h.load('lib/auth/account-key.ts');
const settings={RAZORPAY_KEY_ID:'rzp_live_synthetic',RAZORPAY_KEY_SECRET:'fake-secret',BILLING_LIVE_ENABLED:'true',BILLING_PUBLIC_CHECKOUT:'false'};
function setup(){h.reset({env:settings});h.db.exec('DELETE FROM billing_sessions; DELETE FROM billing_plans');user={userId:'member-a',email:'member-a@example.test'};const id='11111111-1111-4111-8111-111111111111';h.db.prepare('INSERT INTO billing_sessions(id,user_id,sku,kind,quantity,amount,state,created_at,updated_at,mode,provider_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(id,user.userId,'plus_monthly','subscription','1','49900','active','2026-10-23','2026-10-23','live','sub_synthetic');return id}
const post=(id,key=accountKey('member-a'),origin='https://whatslearn.example.test')=>h.call(route,'/api/billing',{origin,headers:{'x-whatslearn-account':key},body:{action:'cancel',sessionId:id}});

test('closed sales still expose only the customer-owned subscriptions and opaque management identity',async()=>{
 const id=setup();for(let i=0;i<22;i++)h.db.prepare('INSERT INTO billing_sessions(id,user_id,sku,kind,quantity,amount,state,created_at,updated_at,mode) VALUES (?,?,?,?,?,?,?,?,?,?)').run('failed-'+i,user.userId,'sprint','order','1','14900','failed','2026-11-01','2026-11-01','live');const r=await route.GET(),d=await r.json();assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/private.*no-store/);assert.equal(r.headers.get('vary'),'Cookie');assert.equal(d.checkoutOpen,false);assert.equal(d.accountKey,accountKey('member-a'));assert.equal(d.sessions[0].id,id);assert.equal(d.sessions[0].mode,'live');assert.equal(d.sessions[0].canManage,true);assert.equal(JSON.stringify(d).includes('sub_synthetic'),false);
 user={userId:'member-b',email:'member-b@example.test'};assert.deepEqual((await route.GET().then(r=>r.json())).sessions,[]);
});
test('cancellation rejects stale accounts, other owners and foreign origins before provider calls',async()=>{
 const id=setup();let calls=0;global.fetch=async()=>{calls++;throw Error('No provider request expected')};
 assert.equal((await post(id,'old-account')).status,409);assert.equal((await post(id,accountKey('member-a'),'https://other.example')).status,403);user={userId:'member-b',email:'member-b@example.test'};assert.equal((await post(id,accountKey('member-b'))).status,404);assert.equal(calls,0);
});
test('a live end-of-period cancellation keeps provider-active access and does not claim immediate termination',async()=>{
 const id=setup(),end=Math.floor(Date.now()/1000)+86400;h.db.prepare('INSERT INTO billing_plans(sku,provider_id,state,updated_at) VALUES (?,?,?,?)').run('live:plus_monthly','plan_synthetic','ready','2026-10-23');let cancelCalls=0;
 global.fetch=async(url,options={})=>{if(String(url).endsWith('/cancel')){assert.equal(JSON.parse(options.body).cancel_at_cycle_end,true);cancelCalls++}return Response.json({id:'sub_synthetic',plan_id:'plan_synthetic',quantity:1,status:'active',current_end:end})};
 const r=await post(id);assert.equal(r.status,200);assert.equal(r.json.state,'active');assert.match(r.json.message,/accepted your request/);assert.doesNotMatch(r.json.message,/confirmed.*ended|Renewal cancelled/);assert.equal(cancelCalls,1);assert.equal((await h.load('lib/billing/service.ts').activeEntitlement('member-a')).endsAt,new Date(end*1000).toISOString());
});
test('provider failure returns an error, not a cancellation confirmation',async()=>{
 const id=setup();global.fetch=async()=>Response.json({error:'synthetic failure'},{status:502});const r=await post(id);assert.equal(r.status,502);assert.match(r.json.error,/could not complete/);assert.equal(h.db.prepare('SELECT state FROM billing_sessions WHERE id=?').get(id).state,'active');
});
test('missing storage reports unavailability instead of displaying an empty plan',async()=>{
 setup();const db=h.env.DB;h.env.DB={prepare(){throw Error('unavailable')}};try{const r=await route.GET();assert.equal(r.status,503);assert.match((await r.json()).error,/could not load/)}finally{h.env.DB=db}
});
test('starter and first development task use everyday wording without changing saved-answer fields',()=>{
 const s=fs.readFileSync('components/whatslearn/visual-start.tsx','utf8');assert.match(s,/Try a different idea without changing your course/);assert.match(s,/Back to my course/);assert.match(s,/setExtraStarter\(false\)/);
 const {missions}=h.load('lib/missions.ts'),d=missions.find(m=>m.id==='d1');assert.equal(d.title,'Build a trial-class booking page');assert.equal(d.practical.fields.find(f=>f.id==='accept').label,'Three acceptance checks','Existing saved text must still parse');assert.match(h.load('lib/course-roadmap.ts').deliverables.development[0],/working booking page/);
});
