// WhatsApp lessons/reminders and live AI review, with Meta and Claude API calls mocked. Run: node --test tests/whatsapp-ai.cjs
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),{DatabaseSync}=require('node:sqlite'),{createHmac}=require('node:crypto');
const db=new DatabaseSync(':memory:');for(const f of fs.readdirSync(path.resolve(__dirname,'../drizzle')).filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync(path.resolve(__dirname,'../drizzle',f),'utf8').replaceAll('--> statement-breakpoint',''));
const d1={prepare(sql){const stmt=db.prepare(sql);const api=(...args)=>({async first(){return stmt.get(...args)||null},async all(){return {results:stmt.all(...args)}},async run(){const r=stmt.run(...args);return {meta:{changes:r.changes}}}});return {bind:api,...api()}}};
const env={DB:d1,WHATSAPP_TOKEN:'fake-token',WHATSAPP_PHONE_NUMBER_ID:'123',WHATSAPP_VERIFY_TOKEN:'verify-me',WHATSAPP_APP_SECRET:'app-secret',WHATSAPP_PERFORMANCE_TEMPLATE:'learning_performance',WHATSAPP_REMINDER_TEMPLATE:'learning_reminder',REMINDER_CRON_SECRET:'cron-secret',ANTHROPIC_API_KEY:'fake-key'};
let testUser=null;const original=Module._load;Module._load=function(name,parent,isMain){if(name==='@/app/chatgpt-auth')return {getChatGPTUser:async()=>testUser};if(name==='cloudflare:workers')return {env};if(name.startsWith('@/'))name=path.resolve(__dirname,'..',name.slice(2));return original.call(this,name,parent,isMain)};
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,f);
const sent=[];let claudeCalls=0;
global.fetch=async(url,options={})=>{const body=JSON.parse(options.body||'{}');
 if(String(url).startsWith('https://graph.facebook.com/')){sent.push(body);return Response.json({messages:[{id:'wamid.x'}]})}
 if(String(url)==='https://api.anthropic.com/v1/messages'){claudeCalls++;assert.equal(options.headers['x-api-key'],'fake-key');assert.match(body.system,/Checklist/);assert.match(body.messages[0].content,/<learner_work>/);
  return Response.json({content:[{type:'text',text:JSON.stringify({summary:'Clear start.',strengths:['Specific customer'],checks:Array.from({length:5},(_,i)=>({met:i<3,note:i<3?'Office-goers named.':'Say what goes wrong.'})),answerAssessment:{onTopic:true,correct:true,reason:"Correct response to the assigned task."},practicalTest:{created:true,performed:true,reported:true,note:'A specific trial, result and improvement were reported.'},nextStep:'Name the problem.'})}]})}
 throw new Error('Unexpected fetch '+url)};
const wa=require('../lib/whatsapp.ts'),ai=require('../lib/ai-feedback.ts');
const sign=raw=>'sha256='+createHmac('sha256','app-secret').update(raw).digest('hex');
const inbound=(id,from,text)=>JSON.stringify({entry:[{changes:[{value:{messages:[{id,from,type:'text',text:{body:text}}]}}]}]});
(async()=>{
 assert.equal(wa.normalisePhone('98765 43210'),'919876543210');assert.equal(wa.normalisePhone('+91 98765-43210'),'919876543210');assert.throws(()=>wa.normalisePhone('12345'));
 await wa.optIn('user-a','9876543210','en');await assert.rejects(()=>wa.optIn('user-b','+919876543210','en'),/another/);
 let raw0=inbound('m00','919876543210','LESSON');await wa.processWebhook(raw0,sign(raw0));assert.match(sent.pop().text.body,/link this number/,'v50: an unverified number is never matched to an account');db.prepare("UPDATE whatsapp_contacts SET verified_at='2026-10-13T00:00:00Z' WHERE user_id='user-a'").run();
 await assert.rejects(()=>wa.processWebhook(inbound('m0','919876543210','LESSON'),'sha256='+'0'.repeat(64)),/Invalid signature/);
 let raw=inbound('m1','919876543210','LESSON');await wa.processWebhook(raw,sign(raw));assert.equal(sent.length,1);assert.match(sent[0].text.body,/learn\?mission=m1/);
 await wa.processWebhook(raw,sign(raw));assert.equal(sent.length,1,'Duplicate deliveries are ignored');
 raw=inbound('m2','919876543210','For office-goers in Indiranagar who skip lunch: home food at your desk.');await wa.processWebhook(raw,sign(raw));assert.equal(claudeCalls,1);assert.match(sent[1].text.body,/Clear start/);assert.match(sent[1].text.body,/Name the problem/);
 raw=inbound('m3','919876543210','STOP');await wa.processWebhook(raw,sign(raw));assert.equal((await wa.getContact('user-a')).state,'opted_out');
 raw=inbound('m4','910000000000','hi');await wa.processWebhook(raw,sign(raw));assert.match(sent.at(-1).text.body,/settings/,'Unknown numbers are told how to opt in');
 const hook=require('../app/api/whatsapp/webhook/route.ts'),rem=require('../app/api/whatsapp/reminders/route.ts');
 assert.equal(await (await hook.GET(new Request('https://whatslearn.in/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=42'))).text(),'42');
 assert.equal((await hook.GET(new Request('https://whatslearn.in/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=42'))).status,403);
 assert.equal((await rem.POST(new Request('https://whatslearn.in/api/whatsapp/reminders',{method:'POST'}))).status,401);
 await wa.optIn('user-c','9123456780','hi');const istHour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',hourCycle:'h23'}).format(new Date()));db.prepare("UPDATE whatsapp_contacts SET verified_at='2026-10-13T00:00:00Z',remind_state='on',remind_hour=?,quiet_start=0,quiet_end=0 WHERE user_id='user-c'").run(istHour);const before=sent.length;
 const run=await (await rem.POST(new Request('https://whatslearn.in/api/whatsapp/reminders',{method:'POST',headers:{authorization:'Bearer cron-secret'}}))).json();
 assert.equal(run.sent,1,'Only opted-in learners get reminders');assert.equal(sent[before].type,'template');assert.equal(sent[before].template.name,'learning_performance');
 assert.equal((await (await rem.POST(new Request('https://whatslearn.in/api/whatsapp/reminders',{method:'POST',headers:{authorization:'Bearer cron-secret'}}))).json()).sent,0,'At most one reminder a day');
 console.log('PASS: WhatsApp phone checks, opt-in ownership, signed webhooks, lesson replies, AI review replies, STOP, duplicate delivery, verification, reminder auth and daily limit.');
 const route=require('../app/api/feedback/route.ts');const req=b=>new Request('https://whatslearn.in/api/feedback',{method:'POST',headers:{origin:'https://whatslearn.in'},body:JSON.stringify(b)});
 const body={action:'review',quiz:1,missionId:'m1',body:require('./fixtures/course-samples.json').m1,language:'en'};
 assert.equal((await route.POST(req(body))).status,401);testUser={userId:'learner',email:'l@example.test'};
 const ok=await (await route.POST(req(body))).json();assert.equal(ok.review.checks.length,5);assert.equal(ok.review.checks[0].met,true);assert.equal(ok.review.checks[3].met,false);
 assert.equal((await route.POST(req({...body,missionId:'nope'}))).status,404);
 await route.POST(req({...body,body:body.body.replace('### Your reasoning\n','### Your reasoning\n Another detail. ')}));await route.POST(req({...body,body:body.body.replace('### Your reasoning\n','### Your reasoning\n A third detail. ')}));assert.equal((await route.POST(req({...body,body:body.body.replace('### Your reasoning\n','### Your reasoning\n A fourth detail. ')}))).status,429,'Free daily allowance is enforced');
 delete env.ANTHROPIC_API_KEY;assert.equal((await (await route.GET()).json()).enabled,false);assert.equal((await route.POST(req(body))).status,503);
 assert.equal(ai.aiReady(),false);
 console.log('PASS: AI review sign-in, checklist mapping, daily allowance, unknown missions and the no-key fallback.');
})().catch(e=>{console.error(e);process.exitCode=1});
