const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const h=require('./helpers/harness.cjs');
const policy=h.load('lib/policy-readiness.ts'),billing=h.load('lib/billing/razorpay.ts');
const live={RAZORPAY_KEY_ID:'rzp_live_synthetic',RAZORPAY_KEY_SECRET:'fake-secret',RAZORPAY_WEBHOOK_SECRET:'fake-webhook',BILLING_ADMIN_EMAIL:'owner@example.test',BILLING_LIVE_ENABLED:'true',BILLING_PUBLIC_CHECKOUT:'true'};
const approved={POLICY_APPROVED_REVISION:policy.POLICY_REVISION,GRIEVANCE_OFFICER_NAME:'Designated Test Officer',GRIEVANCE_OFFICER_EMAIL:'officer@example.test'};

test('existing live and public switches cannot open checkout before policy approval',async()=>{
 h.reset({env:live});assert.equal(policy.policyReadiness().ready,false);assert.equal(billing.publicCheckoutOpen(),false);
 assert.throws(()=>billing.assertCanCheckout('owner@example.test'),e=>e.status===503);assert.throws(()=>billing.assertCanCheckout('learner@example.test'),e=>e.status===503);
 let calls=0;global.fetch=async()=>{calls++;throw Error('No provider request expected')};
 await assert.rejects(()=>h.load('lib/billing/service.ts').createCheckout('learner','sprint',1),e=>e.status===503);
 assert.equal(calls,0);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM billing_sessions').get().n,0);
});

test('approval must match the policy revision and a real contact-shaped value',()=>{
 for(const env of [{...approved,POLICY_APPROVED_REVISION:'old-revision'},{...approved,GRIEVANCE_OFFICER_NAME:'[to be confirmed]'},{...approved,GRIEVANCE_OFFICER_EMAIL:'not-an-email'},{...approved,GRIEVANCE_OFFICER_NAME:'Name\nInjected'}]){h.reset({env:{...live,...env}});assert.equal(policy.policyReadiness().ready,false);assert.equal(billing.publicCheckoutOpen(),false)}
 h.reset({env:{...live,...approved}});assert.equal(policy.policyReadiness().ready,true);assert.equal(billing.publicCheckoutOpen(),true);
});

test('owner test payments remain test-only while policies are pending',()=>{
 h.reset({env:{...live,RAZORPAY_KEY_ID:'rzp_test_synthetic'}});assert.equal(billing.publicCheckoutOpen(),false);assert.doesNotThrow(()=>billing.assertCanCheckout('owner@example.test'));assert.throws(()=>billing.assertCanCheckout('learner@example.test'),e=>e.status===403);
});

test('privacy discloses name/nickname and renders only configured contact data; all policies share the same review gate',()=>{
 const privacy=fs.readFileSync('app/privacy/page.tsx','utf8'),legal=fs.readFileSync('components/whatslearn/legal-page.tsx','utf8');
 assert.match(privacy,/your name and an optional nickname/);assert.match(privacy,/grievance\.name\|\|'Pending confirmation/);assert.doesNotMatch(privacy,/\[name to be confirmed/);
 assert.match(legal,/!policyReadiness\(\)\.ready/);for(const page of ['privacy','terms','refunds'])assert.match(fs.readFileSync(`app/${page}/page.tsx`,'utf8'),/LegalPage/);
});

test('security headers cover pages and APIs without overriding private upload CSP',async()=>{
 const config=h.load('next.config.ts').default,rows=await config.headers();
 const all=rows.find(r=>r.source==='/:path(.*)');const headers=Object.fromEntries(all.headers.map(h=>[h.key.toLowerCase(),h.value]));
 assert.equal(headers['x-content-type-options'],'nosniff');assert.equal(headers['strict-transport-security'],'max-age=31536000');assert.equal(headers['referrer-policy'],'strict-origin-when-cross-origin');assert.match(headers['permissions-policy'],/geolocation=\(\)/);assert.equal(headers['content-security-policy'],undefined);
 const home=rows.find(r=>r.source==='/');assert.match(home.headers[0].value,/frame-ancestors 'self'/);assert.match(home.headers[0].value,/https:\/\/chatgpt\.com/);assert.equal(rows.some(r=>r.source.startsWith('/api')),false);
});

test('owner-confirmed public grievance contact is available without pretending policies were approved',()=>{
 h.reset({env:live});const r=policy.policyReadiness();
 assert.equal(r.name,'Vishak B Kashyap');assert.equal(r.email,'connect@brandmintai.io');
 assert.equal(r.contactReady,true);assert.equal(r.approvedRevision,false);assert.equal(r.ready,false);
 assert.equal(billing.publicCheckoutOpen(),false);
});
