const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),{DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE ai_feedback_usage(user_id TEXT,day TEXT,count INTEGER,PRIMARY KEY(user_id,day))');
const d1={prepare(sql){return {bind(...args){return {
 async first(){return db.prepare(sql).get(...args)},
 async run(){return {meta:{changes:db.prepare(sql).run(...args).changes}}}
}}}}};
let sku=null;const old=Module._load;Module._load=function(name,parent,main){if(name==='cloudflare:workers')return {env:{DB:d1}};if(name==='./billing/service'&&parent.filename.endsWith('ai-usage.ts'))return {activeEntitlement:async()=>sku?{sku,plan:sku}:null};return old.call(this,name,parent,main)};
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const usage=require('../lib/ai-usage.ts');
test('shared daily AI budget is atomic and failed website requests can release a slot',async()=>{
 sku=null;assert.equal((await usage.aiAllowance('learner')).limit,3);
 const claims=await Promise.all(Array.from({length:8},()=>usage.reserveAiUse('learner',3)));
 assert.equal(claims.filter(Boolean).length,3);assert.equal((await usage.aiAllowance('learner')).used,3);
 await usage.releaseAiUse('learner');assert.equal(await usage.reserveAiUse('learner',3),true);
 sku='pro_monthly';assert.equal((await usage.aiAllowance('learner')).limit,25);
 sku='teams_monthly';assert.equal((await usage.aiAllowance('learner')).limit,10);
});
test('paid onboarding query is consumed after the profile loads, and the checkout uses verified activation',()=>{
 const panel=fs.readFileSync(path.resolve(__dirname,'../app/profile-panel.tsx'),'utf8');
 assert.match(panel,/finally\(\(\)=>.*personalise.*setOpen\(true\)/);
 assert.match(fs.readFileSync(path.resolve(__dirname,'../components/whatslearn/razorpay-checkout.tsx'),'utf8'),/paidOnboardingUrl\(result\)/);
});
