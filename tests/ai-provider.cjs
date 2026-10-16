// AI provider choice (Claude or OpenAI) with both APIs faked. Run: node --test tests/ai-provider.cjs
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),{DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync(':memory:');for(const f of fs.readdirSync(path.resolve(__dirname,'../drizzle')).filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync(path.resolve(__dirname,'../drizzle',f),'utf8').replaceAll('--> statement-breakpoint',''));
const d1={prepare(sql){const stmt=db.prepare(sql);const api=(...args)=>({async first(){return stmt.get(...args)||null},async all(){return {results:stmt.all(...args)}},async run(){const r=stmt.run(...args);return {meta:{changes:r.changes}}}});return {bind:api,...api()}}};
const env={DB:d1};let testUser={userId:'learner',email:'l@example.test'};
const original=Module._load;Module._load=function(name,parent,isMain){if(name==='@/app/chatgpt-auth')return {getChatGPTUser:async()=>testUser};if(name==='cloudflare:workers')return {env};if(name.startsWith('@/'))name=path.resolve(__dirname,'..',name.slice(2));return original.call(this,name,parent,isMain)};
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,f);
const review={summary:'Clear start.',strengths:['Specific customer'],checks:Array.from({length:5},()=>({met:true,note:'Named.'})),practicalTest:{reported:true,note:'A specific trial, result and improvement were reported.'},nextStep:'Name the problem.'};
const calls=[];
global.fetch=async(url,options={})=>{const body=JSON.parse(options.body||'{}');const u=String(url);
 if(u==='https://api.anthropic.com/v1/messages'){calls.push({provider:'anthropic',model:body.model});assert.equal(options.headers['x-api-key'],'fake-anthropic');return Response.json({content:[{type:'text',text:JSON.stringify(review)}]})}
 if(u==='https://api.openai.com/v1/chat/completions'){calls.push({provider:'openai',model:body.model});assert.equal(options.headers.Authorization,'Bearer fake-openai');assert.equal(body.messages[0].role,'system');assert.match(body.messages[0].content,/Checklist/);assert.match(body.messages[1].content,/<learner_(work|question)>/);assert.ok(body.max_completion_tokens>0);
  if(env.FAIL_OPENAI)return new Response('{}',{status:429});
  return Response.json({choices:[{message:{content:'```json\n'+JSON.stringify(review)+'\n```'}}]})}
 throw new Error('Unexpected fetch '+u)};
const ai=require('../lib/ai-feedback.ts');const route=require('../app/api/feedback/route.ts');
const req=b=>new Request('https://whatslearn.in/api/feedback',{method:'POST',headers:{origin:'https://whatslearn.in'},body:JSON.stringify(b)});
const body={action:'review',missionId:'m1',body:'For office-goers in Indiranagar who skip lunch: home food at your desk.',language:'en'};
(async()=>{
 assert.equal(ai.aiProvider(),null);assert.equal((await route.POST(req(body))).status,503,'No key keeps the prepared help');
 env.OPENAI_API_KEY='fake-openai';assert.equal(ai.aiProvider(),'openai','OpenAI alone is used without AI_PROVIDER');
 let r=await (await route.POST(req(body))).json();assert.equal(r.review.checks.length,5);assert.equal(r.review.checks[0].met,true);assert.equal(r.review.nextStep,'Name the problem.');assert.deepEqual(calls.at(-1),{provider:'openai',model:'gpt-4o-mini'});
 env.OPENAI_MODEL='my-openai-model';const ask=await (await route.POST(req({action:'ask',missionId:'m1',question:'How do I start?',body:'',language:'hi'}))).json();assert.ok(ask.answer);assert.equal(calls.at(-1).model,'my-openai-model');
 env.ANTHROPIC_API_KEY='fake-anthropic';assert.equal(ai.aiProvider(),'anthropic','With both keys and no choice, Claude stays the default');
 env.AI_PROVIDER='openai';assert.equal(ai.aiProvider(),'openai');env.AI_PROVIDER='anthropic';assert.equal(ai.aiProvider(),'anthropic');env.AI_PROVIDER='claude';assert.equal(ai.aiProvider(),'anthropic','AI_PROVIDER=claude selects Claude');env.AI_PROVIDER='Claude ';assert.equal(ai.aiProvider(),'anthropic','Case and spaces are ignored');env.AI_PROVIDER='claude';
 testUser={userId:'learner-2',email:'2@example.test'};await route.POST(req(body));assert.equal(calls.at(-1).provider,'anthropic');
 delete env.ANTHROPIC_API_KEY;env.AI_PROVIDER='anthropic';assert.equal(ai.aiProvider(),'openai','A chosen provider without its key falls back to the key that exists');
 env.FAIL_OPENAI='1';const busy=await route.POST(req({...body,body:body.body+' An added detail.'}));assert.equal(busy.status,502);assert.match((await busy.json()).error,/busy/);delete env.FAIL_OPENAI;
 testUser={userId:'learner-3',email:'3@example.test'};for(let i=0;i<3;i++)assert.equal((await route.POST(req({...body,body:body.body+' Version '+i}))).status,200);assert.equal((await route.POST(req({...body,body:body.body+' Fourth version'}))).status,429,'Daily allowance applies to OpenAI too');
 assert.equal((await (await route.GET()).json()).enabled,true);
 console.log('PASS: provider auto-detection, AI_PROVIDER choice and fallback, OpenAI review and ask with default and custom model, Claude path, errors, daily allowance and the no-key fallback.');
})().catch(e=>{console.error(e);process.exitCode=1});
