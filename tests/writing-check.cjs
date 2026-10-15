// Stars and the basic writing check read the learner's text. Run: node --test tests/writing-check.cjs
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),{DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync(':memory:');for(const f of fs.readdirSync(path.resolve(__dirname,'../drizzle')).filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync(path.resolve(__dirname,'../drizzle',f),'utf8').replaceAll('--> statement-breakpoint',''));
const d1={prepare(sql){const stmt=db.prepare(sql);const api=(...args)=>({async first(){return stmt.get(...args)||null},async all(){return {results:stmt.all(...args)}},async run(){const r=stmt.run(...args);return {meta:{changes:r.changes}}}});return {bind:api,...api()}},async batch(list){for(const s of list)await s.run();return []}};
const env={DB:d1};let testUser={userId:'learner',email:'l@example.test'};
const original=Module._load;Module._load=function(name,parent,isMain){if(name==='@/app/chatgpt-auth')return {getChatGPTUser:async()=>testUser};if(name==='cloudflare:workers')return {env};if(name.startsWith('@/'))name=path.resolve(__dirname,'..',name.slice(2));return original.call(this,name,parent,isMain)};
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {checkWriting,aiStars}=require('../lib/writing-check.ts');const {practiceRewards}=require('../lib/play.ts');const {missions}=require('../lib/missions.ts');
const answers={
 good:'For busy office-goers in Indiranagar who skip lunch because meetings run late: get a fresh home-style lunch delivered to your desk by 1 pm, so you eat well without leaving work. Claim to verify: “delivered by 1 pm” in every area. Reply MENU on WhatsApp to see this week’s menu.',
 weak:'Our food is tasty and fresh. Everyone should buy our lunch because it is good.',
 offTopic:'Yesterday I watched a cricket match with my cousins and we ate popcorn while it rained outside the stadium.',
 empty:'ok ok',
 filler:'asdf asdf asdf asdf asdf asdf asdf asdf asdf asdf asdf asdf',
 copied:'For busy office-goers in Indiranagar: get a home-style lunch delivered to your desk. See this week’s menu.',
 hindi:'इंदिरानगर के ऑफिस में काम करने वाले लोगों के लिए जो मीटिंग की वजह से लंच छोड़ देते हैं: घर जैसा ताज़ा खाना 1 बजे तक आपकी डेस्क पर। जाँचने वाला दावा: हर इलाके में 1 बजे तक डिलीवरी। इस हफ्ते का मेनू देखने के लिए WhatsApp पर MENU लिखें।'
};
(async()=>{
 const r=Object.fromEntries(Object.entries(answers).map(([k,v])=>[k,checkWriting('m1',v)]));
 assert.equal(r.good.band,'strong');assert.equal(r.good.blocked,false);assert.equal(r.good.stars,3);
 assert.ok(r.weak.score<60&&!r.weak.blocked,'A weak but genuine answer can be saved and is rated low');assert.match(r.weak.tip,/more words/);
 for(const k of ['offTopic','empty','filler','copied'])assert.equal(r[k].blocked,true,k+' is blocked');
 assert.equal(r.offTopic.band,'off-topic');assert.equal(r.copied.band,'copied');assert.equal(r.empty.band,'empty');assert.equal(r.filler.band,'filler');
 assert.equal(r.hindi.blocked,false,'Answers written in another lesson language are read too');assert.ok(r.hindi.score>=60);
 assert.equal(checkWriting('m1',answers.good,[false,true,true,true,true]).tip,'Check this before saving: Name one specific customer.','The tip points to an unticked self-review item');
 const scores=new Set(Object.values(r).map(x=>x.score));assert.ok(scores.size>=5,'Ratings vary with the writing');
 // Stars now follow the writing, not only the self-review ticks.
 const m1=missions.find(m=>m.id==='m1');const when='2026-10-10T05:00:00Z';
 const rewards=body=>practiceRewards([{mission_id:'m1',body,checks:JSON.stringify([false,false,false,false,false]),quiz:m1.answer,updated_at:when}],[],'marketing');
 assert.equal(rewards(answers.good).stars('m1'),3,'Strong writing earns three stars without ticking boxes');
 assert.equal(rewards(answers.weak).stars('m1'),1,'Weak writing stays at one star');
 const mid='For office-goers in Indiranagar who skip lunch: home-style lunch at your desk. Reply MENU to see the menu.';assert.equal(rewards(mid).stars('m1'),checkWriting('m1',mid).score>=80?3:checkWriting('m1',mid).score>=60?2:1);
 // The server refuses blocked answers too.
 const {submitWork}=require('../lib/learning-service.ts');
 const off=await submitWork('learner',{missionId:'m1',body:answers.offTopic,checks:[true,true,true,true,true],quiz:m1.answer});assert.equal(off.saved,false);assert.match(off.feedback,/not been saved/);
 const ok=await submitWork('learner',{missionId:'m1',body:require('./fixtures/course-samples.json').m1,checks:[true,true,true,true,true],quiz:m1.answer});assert.equal(ok.saved,true);
 // AI ratings come from the AI review; failures return a message, never a score.
 assert.equal(aiStars({checks:[{met:true},{met:true},{met:true},{met:true},{met:false}]}),3);assert.equal(aiStars({checks:[{met:true},{met:true},{met:false}]}),2);assert.equal(aiStars({checks:[{met:false}]}),1);
 env.OPENAI_API_KEY='fake-openai';global.fetch=async()=>new Response('{}',{status:500});
 const route=require('../app/api/feedback/route.ts');const res=await route.POST(new Request('https://whatslearn.in/api/feedback',{method:'POST',headers:{origin:'https://whatslearn.in'},body:JSON.stringify({action:'review',missionId:'m1',body:answers.good,language:'en'})}));
 assert.equal(res.status,502);const j=await res.json();assert.ok(j.error);assert.equal(j.review,undefined,'No default low score on failure');
 console.log('PASS: good, weak, empty, filler, copied, off-topic and Hindi answers; varied ratings; writing-based stars; server-side blocking; AI rating and failure message.');
})().catch(e=>{console.error(e);process.exitCode=1});
