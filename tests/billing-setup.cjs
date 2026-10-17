// Billing setup is owner-only; customers see only checkout state. Setting names go to the owner, values to nobody. Run: node --test tests/billing-setup.cjs
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),{DatabaseSync}=require('node:sqlite');
let db=new DatabaseSync(':memory:');
const d1={prepare(sql){const stmt=db.prepare(sql);const api=(...args)=>({async first(){return stmt.get(...args)||null},async all(){return {results:stmt.all(...args)}},async run(){const r=stmt.run(...args);return {meta:{changes:r.changes}}}});return {bind:api,...api()}}};
const env={DB:d1};let testUser=null;
const original=Module._load;Module._load=function(name,parent,isMain){if(name==='@/app/chatgpt-auth')return {getChatGPTUser:async()=>testUser};if(name==='cloudflare:workers')return {env};if(name.startsWith('@/'))name=path.resolve(__dirname,'..',name.slice(2));return original.call(this,name,parent,isMain)};
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
global.fetch=async url=>{throw new Error('No network in this test: '+url)};
const route=require('../app/api/billing/route.ts'),{ownerPageAccess}=require('../lib/billing/owner-gate.ts');
const get=async()=>(await route.GET()).json();
const post=body=>route.POST(new Request('https://whatslearn.in/api/billing',{method:'POST',headers:{origin:'https://whatslearn.in','Content-Type':'application/json'},body:JSON.stringify(body)}));
const OWNER={userId:'local_seedy',email:'seedy@sites.test'},CUSTOMER={userId:'c1',email:'learner@example.test'};
const customerSafe=(d,label)=>{const t=JSON.stringify(d);for(const k of ['webhook','setup','config','plans','admin','ownerMissing','ownerSetupRequired','RAZORPAY','BILLING_','FAKE','.env'])assert.ok(!t.includes(k),`${label}: customer response must not include ${k}`)};
const migrate=()=>{for(const f of fs.readdirSync(path.resolve(__dirname,'../drizzle')).filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync(path.resolve(__dirname,'../drizzle',f),'utf8').replaceAll('--> statement-breakpoint',''))};
(async()=>{
 // Nothing configured: guests and customers just see "not open".
 let d=await get();assert.deepEqual(d,{enabled:false,checkoutOpen:false,sprintCreditAvailable:false});
 testUser=CUSTOMER;d=await get();customerSafe(d,'customer, nothing configured');assert.equal(d.enabled,false);
 // Owner configured with TEST keys, even with BILLING_PUBLIC_CHECKOUT=true: customers still cannot pay or see setup.
 Object.assign(env,{RAZORPAY_KEY_ID:'rzp_test_FAKEKEY123',RAZORPAY_KEY_SECRET:'FAKE-secret-value',RAZORPAY_WEBHOOK_SECRET:'FAKE-webhook-value',BILLING_ADMIN_EMAIL:'seedy@sites.test',BILLING_PUBLIC_CHECKOUT:'true'});migrate();
 testUser=null;d=await get();assert.deepEqual(d,{enabled:false,checkoutOpen:false,sprintCreditAvailable:false},'Guests get no mode or setup details');
 testUser=CUSTOMER;d=await get();customerSafe(d,'customer, test mode');assert.equal(d.enabled,false,'Test mode is owner-only');
 let r=await post({action:'checkout',sku:'sprint',quantity:1});assert.equal(r.status,403);assert.match((await r.json()).error,/not open yet/);
 r=await post({action:'plans'});assert.equal(r.status,403,'Customers cannot create plans');customerSafe(await r.json(),'customer plans error');
 testUser=null;assert.equal((await post({action:'plans'})).status,401);
 // The owner gets the checklist, by setting name only.
 testUser=OWNER;d=await get();assert.equal(d.admin,true);assert.equal(d.enabled,true);assert.equal(d.mode,'test');
 assert.equal(d.webhook.verifiedDeliverySeen,false);db.prepare('INSERT INTO billing_events(id,event,processed_at) VALUES (?,?,?)').run('signed-fixture','payment.captured','2026-10-17T10:00:00Z');d=await get();assert.equal(d.webhook.verifiedDeliverySeen,true);assert.equal(d.webhook.lastEvent,'payment.captured');assert.deepEqual(d.setup.steps.filter(s=>!s.ok).map(s=>s.id),['plans']);for(const v of ['FAKEKEY123','FAKE-secret','FAKE-webhook'])assert.ok(!JSON.stringify(d).includes(v),'No values, even for the owner');
 // A live key is never treated as a test key, and without BILLING_LIVE_ENABLED checkout stays closed for everyone.
 env.RAZORPAY_KEY_ID='rzp_live_FAKELIVE';d=await get();assert.equal(d.enabled,false);assert.equal(d.config.testKey,false);assert.match(d.setup.steps.find(s=>s.id==='key').fix,/BILLING_LIVE_ENABLED/);
 testUser=CUSTOMER;d=await get();customerSafe(d,'customer, live key without flag');assert.equal(d.enabled,false);
 // Only live mode + BILLING_LIVE_ENABLED + BILLING_PUBLIC_CHECKOUT opens checkout to customers (still without setup details).
 env.BILLING_LIVE_ENABLED='true';d=await get();customerSafe(d,'customer, live open');assert.equal(d.enabled,true);assert.equal(d.mode,'live');
 testUser=null;d=await get();assert.equal(d.signInRequired,true);assert.equal(d.checkoutOpen,true);customerSafe(d,'guest, live open');
 env.RAZORPAY_SPRINT_CREDIT_OFFER_ID='offer_private_credit';d=await get();assert.equal(d.sprintCreditAvailable,true);assert.ok(!JSON.stringify(d).includes('offer_private_credit'));delete env.RAZORPAY_SPRINT_CREDIT_OFFER_ID;
 delete env.BILLING_LIVE_ENABLED;env.RAZORPAY_KEY_ID='rzp_test_FAKEKEY123';
 // /billing/setup page: owner only; a short local note only on this computer before an owner exists; 404 for everyone else.
 assert.equal(ownerPageAccess('seedy@sites.test','whatslearn.in'),'owner');
 assert.equal(ownerPageAccess('learner@example.test','127.0.0.1:8787'),'hidden','Configured owner: other local users get 404');
 assert.equal(ownerPageAccess(null,'whatslearn.in'),'hidden');assert.equal(ownerPageAccess('learner@example.test','whatslearn.in'),'hidden');
 delete env.BILLING_ADMIN_EMAIL;assert.equal(ownerPageAccess(null,'127.0.0.1:8787'),'local-help');assert.equal(ownerPageAccess(null,'localhost:8787'),'local-help');
 assert.equal(ownerPageAccess(null,'whatslearn.in'),'hidden','No owner yet: still 404 on the real site');assert.equal(ownerPageAccess(null,'localhost.evil.example'),'hidden');
 // Customer-facing pages do not link to the owner tool or name settings.
 for(const f of ['components/whatslearn/membership.tsx','components/whatslearn/razorpay-checkout.tsx','app/membership/page.tsx','components/whatslearn/account-shell.tsx']){const t=fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');for(const k of ['/billing/setup','RAZORPAY_','BILLING_ADMIN','BILLING_LIVE','.env'])assert.ok(!t.includes(k),`${f} mentions ${k}`)}
 console.log('PASS: owner-only setup (API and page), customers see checkout state only, test mode owner-only, live key never treated as test, no values exposed.');
})().catch(e=>{console.error(e);process.exitCode=1});
