// Account data belongs to the signed-in ChatGPT user only: guests get 401, and one learner never sees another's data. Run: node --test tests/account-isolation.cjs
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),{DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync(':memory:');for(const f of fs.readdirSync(path.resolve(__dirname,'../drizzle')).filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync(path.resolve(__dirname,'../drizzle',f),'utf8').replaceAll('--> statement-breakpoint',''));
const d1={prepare(sql){const stmt=db.prepare(sql);const api=(...args)=>({async first(){return stmt.get(...args)||null},async all(){return {results:stmt.all(...args)}},async run(){const r=stmt.run(...args);return {meta:{changes:r.changes}}}});return {bind:api,...api()}},async batch(list){const out=[];for(const s of list)out.push(await s.run());return out}};
const env={DB:d1,WHATSAPP_TOKEN:'fake',WHATSAPP_PHONE_NUMBER_ID:'1',WHATSAPP_VERIFY_TOKEN:'v',WHATSAPP_APP_SECRET:'s',RAZORPAY_KEY_ID:'rzp_test_FAKE',RAZORPAY_KEY_SECRET:'fake',RAZORPAY_WEBHOOK_SECRET:'fake',BILLING_ADMIN_EMAIL:'owner@example.test',OPENAI_API_KEY:'fake-not-used'};
let user=null;const original=Module._load;Module._load=function(name,parent,isMain){if(name==='@/app/chatgpt-auth')return {getChatGPTUser:async()=>user};if(name==='cloudflare:workers')return {env};if(name.startsWith('@/'))name=path.resolve(__dirname,'..',name.slice(2));return original.call(this,name,parent,isMain)};
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,f);
global.fetch=async u=>{if(String(u)==='https://api.openai.com/v1/chat/completions')return Response.json({choices:[{message:{content:JSON.stringify({summary:'Reviewed sample.',strengths:[],checks:Array.from({length:5},()=>({met:true,note:'Present.'})),nextStep:'Test the offer.'})}}]});throw new Error('No network in this test: '+u)};
const r=n=>require('../app/api/'+n+'/route.ts');const work=r('work'),profile=r('profile'),play=r('play'),progress=r('progress'),wa=r('whatsapp'),billing=r('billing'),session=r('session'),feedback=r('feedback'),path_=r('learning-path');
const {missions}=require('../lib/missions.ts');const m1=missions.find(m=>m.id==='m1');
const post=(route,body,origin='https://whatslearn.in')=>route.POST(new Request('https://whatslearn.in/api/x',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)}));
const A={userId:'user-a',email:'a@example.test',displayName:'A'},B={userId:'user-b',email:'b@example.test',displayName:'B'};
const answer=require('./fixtures/course-samples.json').m1;
(async()=>{
 // Guests: every account API refuses, nothing is saved.
 for(const [name,res] of [['work',await work.GET()],['profile',await profile.GET()],['play',await play.GET()],['progress',await progress.GET()],['learning-path',await path_.GET(new Request('https://whatslearn.in/api/learning-path'))]])assert.equal(res.status,401,name+' GET needs sign-in');
 assert.equal((await post(work,{missionId:'m1',body:answer,checks:[true,true,true,true,true],quiz:m1.answer})).status,401);
 assert.equal((await post(profile,{goal:'job',track:'marketing',level:'beginner',language:'en',minutes:'15'})).status,401);
 assert.equal((await post(play,{missionId:'m1',choice:1})).status,401);
 assert.equal((await post(wa,{action:'optin',phone:'9876543210',language:'en',consent:true})).status,401);
 assert.equal((await post(billing,{action:'checkout',sku:'sprint',quantity:1})).status,401);
 assert.equal((await post(feedback,{action:'review',missionId:'m1',body:answer,language:'en'})).status,401);
 assert.deepEqual(await (await session.GET()).json(),{signedIn:false});
 assert.deepEqual(await billing.GET().then(x=>x.json()),{enabled:false,checkoutOpen:false,sprintCreditAvailable:false},'Guests get checkout state only');
 assert.equal(db.prepare('SELECT COUNT(*) n FROM work').get().n,0);
 // A saves; B sees nothing of A's.
 user=A;assert.equal((await post(work,{missionId:'m1',body:answer,checks:[true,true,true,true,true],quiz:m1.answer})).status,200);
 assert.equal((await post(work,{missionId:'m1',body:'[wrangler:info] GET /api/work 401 Unauthorized (6ms)\n[wrangler:info] GET /api/play 401 Unauthorized (4ms)\n[wrangler:info] GET /terms 200 OK (37ms)',checks:[true,true,true,true,true],quiz:m1.answer})).status,400,'The server also rejects pasted logs');
 await post(profile,{goal:'job',track:'marketing',level:'beginner',language:'en',minutes:'15'});
 assert.equal((await post(play,{missionId:'m1',choice:1})).status,200);
 db.prepare("INSERT INTO billing_sessions (id,user_id,sku,kind,quantity,amount,state,created_at,updated_at,mode) VALUES ('s-a','user-a','sprint','order',1,14900,'paid',datetime('now'),datetime('now'),'test')").run();
 assert.equal((await work.GET().then(x=>x.json())).work.length,1);
 user=B;
 assert.deepEqual((await work.GET().then(x=>x.json())).work,[],'B cannot see A’s work');
 assert.equal((await profile.GET().then(x=>x.json())).profile,null,'B cannot see A’s profile');
 assert.deepEqual((await play.GET().then(x=>x.json())).events,[],'B cannot see A’s rewards');
 assert.deepEqual((await progress.GET().then(x=>x.json())).proofs,[],'B cannot see A’s proofs');
 const bb=await billing.GET().then(x=>x.json());assert.equal(JSON.stringify(bb).includes('s-a'),false,'B cannot see A’s billing sessions');
 const {ownedSession}=require('../lib/billing/service.ts');await assert.rejects(()=>ownedSession('user-b','s-a'),/not found/,'B cannot act on A’s checkout');
 // Cross-site writes are refused even when signed in.
 assert.equal((await post(work,{missionId:'m1',body:answer,checks:[true,true,true,true,true],quiz:m1.answer},'https://evil.example')).status,403);
 // Request bodies cannot pick another user.
 user=A;await post(work,{missionId:'m1',body:answer,checks:[true,true,true,true,true],quiz:m1.answer,userId:'user-b',user_id:'user-b'});assert.equal(db.prepare("SELECT COUNT(*) n FROM work WHERE user_id='user-b'").get().n,0,'A userId in the request body is ignored; work is saved for the signed-in user');
 console.log('PASS: guests get 401 on every account API; learners only see their own work, profile, rewards, proofs and billing; cross-site and spoofed-user writes are refused.');
})().catch(e=>{console.error(e);process.exitCode=1});
