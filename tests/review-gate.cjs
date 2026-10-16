// Launch check: meaningless answers ("abcd"), pasted Wrangler logs and filler are refused before saving or AI review;
// a relevant answer is accepted; an AI failure is never shown as an AI review. All AI calls are faked. Run: node --test tests/review-gate.cjs
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),{DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync(':memory:');for(const f of fs.readdirSync(path.resolve(__dirname,'../drizzle')).filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync(path.resolve(__dirname,'../drizzle',f),'utf8').replaceAll('--> statement-breakpoint',''));
const d1={prepare(sql){const stmt=db.prepare(sql);const api=(...args)=>({async first(){return stmt.get(...args)||null},async all(){return {results:stmt.all(...args)}},async run(){const r=stmt.run(...args);return {meta:{changes:r.changes}}}});return {bind:api,...api()}},async batch(list){const out=[];for(const s of list)out.push(await s.run());return out}};
const env={DB:d1,OPENAI_API_KEY:'fake-openai'};const user={userId:'learner',email:'l@example.test',displayName:'L'};
const original=Module._load;Module._load=function(name,parent,isMain){if(name==='@/app/chatgpt-auth')return {getChatGPTUser:async()=>user};if(name==='cloudflare:workers')return {env};if(name.startsWith('@/'))name=path.resolve(__dirname,'..',name.slice(2));return original.call(this,name,parent,isMain)};
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,f);
let aiReply={status:200,content:JSON.stringify({summary:'Clear offer for a named customer.',strengths:['Specific time'],checks:Array.from({length:5},()=>({met:true,note:'Named and clear.'})),practicalTest:{created:true,performed:true,reported:true,note:'A specific trial, result and improvement were reported.'},nextStep:'Add one reason to act today.'})};let aiCalls=0;
global.fetch=async url=>{if(String(url)!=='https://api.openai.com/v1/chat/completions')throw new Error('Unexpected network call: '+url);aiCalls++;return aiReply.status===200?Response.json({choices:[{message:{content:aiReply.content}}]}):new Response('{}',{status:aiReply.status})};
const {checkStarter}=require('../lib/starter-check.ts'),{checkWriting}=require('../lib/writing-check.ts'),{missions}=require('../lib/missions.ts');
const work=require('../app/api/work/route.ts'),feedback=require('../app/api/feedback/route.ts');const m1=missions.find(m=>m.id==='m1');
const post=(route,body)=>route.POST(new Request('https://whatslearn.in/api/x',{method:'POST',headers:{origin:'https://whatslearn.in','Content-Type':'application/json'},body:JSON.stringify(body)}));
const log=fs.readFileSync(path.resolve(__dirname,'fixtures/wrangler-log.txt'),'utf8');
const relevant=require('./fixtures/course-samples.json').m1;
const meaningless=['abcd','abcd abcd abcd abcd','abcd efgh ijkl mnop','abcd '.repeat(12).trim()];
const used=()=>db.prepare('SELECT COALESCE(SUM(count),0) n FROM ai_feedback_usage').get().n;
const saved=()=>db.prepare('SELECT COUNT(*) n FROM work').get().n;
(async()=>{
 // 1. "abcd" and friends: refused on the home starter and in a mission, with advice on what to write.
 for(const s of meaningless){const r=checkStarter('marketing',s);assert.equal(r.ok,false,s);assert.match(r.message,/Write|answer/);const w=checkWriting(m1,s);assert.equal(w.blocked,true,s);assert.ok(w.tip.length>20)}
 // 2. The Wrangler log text is refused everywhere and named as a log.
 assert.equal(checkStarter('marketing',log).reason,'machine');assert.equal(checkWriting(m1,log).blocked,true);
 // 3. The server refuses to save either, and nothing is stored.
 for(const body of [meaningless.at(-1),log.slice(0,4000)]){const res=await post(work,{missionId:'m1',body,checks:[true,true,true,true,true],quiz:m1.answer});assert.equal(res.status,400);assert.match((await res.json()).error,/not been saved/)}
 assert.equal(saved(),0);
 // 4. AI review is never requested for them, so no review, no rating and no allowance used.
 for(const body of [meaningless.at(-1),log.slice(0,4000),'hello hello hello hello hello hello hello hello hello']){const res=await post(feedback,{action:'review',missionId:'m1',body,language:'en'});assert.equal(res.status,422,body.slice(0,30));const d=await res.json();assert.equal(d.review,undefined);assert.match(d.error,/not sent for AI review/)}
 assert.equal(aiCalls,0,'No AI call for meaningless text');assert.equal(used(),0);
 // 5. A relevant answer passes the quick check, saves, and gets a real AI review.
 assert.equal(checkStarter('marketing','Office workers near MG Road: order a hot lunch before 11 today.').ok,true);
 assert.equal((await post(work,{missionId:'m1',body:relevant,checks:[true,true,true,true,true],quiz:m1.answer})).status,200);assert.equal(saved(),1);
 let res=await post(feedback,{action:'review',missionId:'m1',body:relevant,language:'en'});assert.equal(res.status,200);let d=await res.json();assert.equal(d.review.summary,'Clear offer for a named customer.');assert.equal(d.review.checks.length,5);assert.equal(aiCalls,1);assert.equal(used(),1);
 // 6. AI failures: provider error, empty reply and a reply that is not a review are reported as failures, never as a review, and don't use the allowance.
 for(const reply of [{status:500},{status:429},{status:200,content:''},{status:200,content:'Sorry, I cannot help with that.'},{status:200,content:'{"strengths":["x"]}'}]){aiReply=reply;db.prepare("UPDATE submission_reviews SET created_at='2000-01-01T00:00:00Z'").run();res=await post(feedback,{action:'review',missionId:'m1',body:relevant,language:'en'});assert.equal(res.status,502,JSON.stringify(reply));d=await res.json();assert.equal(d.review,undefined);assert.match(d.error,/try again/)}
 assert.equal(used(),1,'Failed reviews are not counted');
 aiReply={status:200,content:''};res=await post(feedback,{action:'ask',missionId:'m1',question:'How do I start?',body:'',language:'en'});assert.equal(res.status,502,'An empty coach answer is a failure');
 // 7. Labels: the device check never claims to be an AI review.
 const coach=fs.readFileSync(path.resolve(__dirname,'../components/whatslearn/practice-coach.tsx'),'utf8');assert.match(coach,/QUICK WRITING CHECK/);assert.match(coach,/AI REVIEW · PRACTICAL WORK/);
 assert.match(checkStarter('marketing','Office workers near MG Road: order a hot lunch before 11 today.').message,/quick check on your device, not an AI review/);
 console.log('PASS: "abcd", filler and the Wrangler log are refused before saving or AI review; a relevant answer saves and gets an AI review; AI failures show no review and use no allowance.');
})().catch(e=>{console.error(e);process.exitCode=1});
