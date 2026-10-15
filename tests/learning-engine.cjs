// Integration checks: deterministic adaptation, private ownership, protocol and idempotent saves.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
const ts=require('typescript');
const {DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync(':memory:');
for(const f of fs.readdirSync(path.resolve(__dirname,'../drizzle')).filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync(path.resolve(__dirname,'../drizzle',f),'utf8').replaceAll('--> statement-breakpoint',''));
const d1={
  prepare(sql){
    return {bind(...args){
      return {
        async first(){return db.prepare(sql).get(...args)||null},
        async all(){return {results:db.prepare(sql).all(...args)}},
        async run(){return db.prepare(sql).run(...args)},
        _run(){return db.prepare(sql).run(...args)}
      };
    }};
  },
  async batch(list){db.exec('BEGIN');try{const out=list.map(s=>({meta:{changes:s._run().changes}}));db.exec('COMMIT');return out}catch(e){db.exec('ROLLBACK');throw e}}
};
let identity=null;
const original=Module._load;
Module._load=function(name,parent,isMain){if(name==='cloudflare:workers')return {env:{DB:d1}};if(name==='next/headers')return {headers:async()=>new Headers(identity?{'oai-authenticated-user-id':identity,'oai-authenticated-user-email':identity+'@example.test'}:{})};if(name.startsWith('@/'))name=path.resolve(__dirname,'..',name.slice(2));return original.call(this,name,parent,isMain)};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {learningPath}=require('../lib/learning-engine.ts');
const {defaultProfile}=require('../lib/personalization.ts');
const {missions}=require('../lib/missions.ts');
const {loadLearning,saveProfile,submitWork}=require('../lib/learning-service.ts');
const {POST}=require('../app/mcp/route.ts');
const rpc=(method,params={})=>POST(new Request('https://whatslearn.in/mcp',{method:'POST',body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})}));
(async()=>{
for(const track of ['marketing','development','filmmaking','storytelling'])for(const language of ['en','kn','hi']){const p=learningPath({...defaultProfile,track,language,minutes:'5'});assert.equal(p.challenge.track,track);assert.equal(p.sessionMinutes,5);assert.ok(!('answer' in p.challenge));assert.ok(p.steps.length>=2)}
const first=missions.find(m=>m.id==='m1');
assert.equal(learningPath(defaultProfile,[{mission_id:'m1',checks:'[true,false,false,false,false]',quiz:first.answer}]).revisit,true);
assert.equal(learningPath(defaultProfile,[],'stretch').level,'stretch');
assert.equal(learningPath(defaultProfile,[],'stretch',true).level,'guided');
const submission={missionId:'m1',body:require('./fixtures/course-samples.json').m1,checks:[true,true,true,true,true],quiz:first.answer};
await saveProfile('learner-a',{...defaultProfile,language:'kn'});
assert.equal((await submitWork('learner-a',{...submission,quiz:0})).saved,false);
await submitWork('learner-a',submission);await submitWork('learner-a',submission);
const a=await loadLearning('learner-a'),b=await loadLearning('learner-b');assert.equal(a.path.progress.xp,50);assert.equal(a.work.length,1);assert.equal(b.work.length,0);assert.equal(b.hasProfile,false);assert.equal(a.profile.language,'kn');
assert.equal((await rpc('initialize',{protocolVersion:'2025-06-18'})).status,200);
assert.equal((await (await rpc('tools/list')).json()).result.tools.length,6);
assert.equal((await rpc('tools/call',{name:'whatslearn_my_portfolio'})).status,401);
identity='learner-b';const own=await (await rpc('tools/call',{name:'whatslearn_my_portfolio',arguments:{userId:'learner-a'}})).json();assert.equal(own.result.structuredContent.work.length,0);
const bad=await (await rpc('tools/call',{name:'whatslearn_set_preferences',arguments:{track:'invalid'}})).json();assert.equal(bad.result.isError,true);
const blocked=await POST(new Request('https://whatslearn.in/mcp',{method:'POST',headers:{Origin:'https://evil.example'},body:'{}'}));assert.equal(blocked.status,403);
console.log('PASS: 12 language/programme paths, adaptation, safe saves, no duplicate XP, account isolation, MCP discovery/auth/input/origin checks.');
})().catch(e=>{console.error(e);process.exitCode=1});
