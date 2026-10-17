// Shared test harness: an in-memory database with every migration applied (batches are all-or-nothing, like D1), a browser-like cookie jar standing in for next/headers,
// and a stand-in for the managed auth provider. No network, no real keys. Used by email-auth.cjs, rewards.cjs and uploads.cjs.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),{DatabaseSync}=require('node:sqlite');
const {FakeGoTrue}=require('../../scripts/fake-auth-core.cjs');
const ROOT=path.resolve(__dirname,'../..');
const db=new DatabaseSync(':memory:');for(const f of fs.readdirSync(path.join(ROOT,'drizzle')).filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync(path.join(ROOT,'drizzle',f),'utf8').replaceAll('--> statement-breakpoint',''));
const d1={prepare(sql){const stmt=db.prepare(sql);const api=(...args)=>({async first(){return stmt.get(...args)||null},async all(){return {results:stmt.all(...args)}},async run(){const r=stmt.run(...args);return {meta:{changes:r.changes}}},_run:()=>stmt.run(...args)});return {bind:api,...api()}},async batch(list){db.exec('BEGIN');try{const out=list.map(s=>({meta:{changes:s._run().changes}}));db.exec('COMMIT');return out}catch(e){db.exec('ROLLBACK');throw e}}};
// A fake private bucket with the parts of R2's API the app uses.
class FakeBucket{constructor(){this.map=new Map()}async put(k,v,o){this.map.set(k,{body:v instanceof ArrayBuffer?new Uint8Array(v):v,meta:o})}async get(k){const x=this.map.get(k);return x?{body:x.body,httpMetadata:x.meta?.httpMetadata,arrayBuffer:async()=>x.body.buffer?x.body.buffer.slice(x.body.byteOffset,x.body.byteOffset+x.body.byteLength):x.body}:null}async delete(k){this.map.delete(k)}}
const env={DB:d1};
const BASE='https://auth.example.test';
const defaults={SUPABASE_URL:BASE,SUPABASE_PUBLISHABLE_KEY:'pub-test-key',SUPABASE_SERVICE_ROLE_KEY:'svc-test-key',SITE_URL:'https://whatslearn.example.test'};
const jar=new Map();let requestHeaders=new Headers();
const cookieApi={get:n=>jar.has(n)?{name:n,value:jar.get(n).value}:undefined,getAll:()=>[...jar].map(([name,v])=>({name,value:v.value})),set:(n,v,o={})=>{if(o.maxAge===0||v==='')jar.delete(n);else jar.set(n,{value:v,...o})}};
const original=Module._load;
Module._load=function(name,parent,isMain){
 if(name==='cloudflare:workers')return {env};
 if(name==='next/headers')return {cookies:async()=>cookieApi,headers:async()=>requestHeaders};
 if(name==='next/navigation')return {redirect:p=>{throw Object.assign(new Error('redirect'),{redirectTo:p})}};
 if(name.startsWith('@/'))name=path.join(ROOT,name.slice(2));
 return original.call(this,name,parent,isMain)};
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,f);
const realFetch=global.fetch;let fake=null;
function reset(opts={}){
 for(const k of Object.keys(env))delete env[k];env.DB=d1;Object.assign(env,opts.noProvider?{}:defaults,opts.env||{});
 jar.clear();requestHeaders=new Headers();
 fake=new FakeGoTrue(opts.fake||{});global.fetch=fake.fetch(BASE,realFetch);
 for(const t of ['learning_sessions','concept_drafts','skill_practice','whatsapp_saved_drafts','auth_attempts','point_ledger','work','mission_scores','mission_clues','practice_events','proofs','learner_profiles','ai_feedback_usage','submission_reviews','whatsapp_contacts','reward_claims','uploads','entitlements'])db.exec('DELETE FROM '+t);
 return fake;
}
const load=rel=>require(path.join(ROOT,rel));
function req(url,{method='POST',body,origin='https://whatslearn.example.test',ip='203.0.113.5',headers={}}={}){
 const h={'content-type':'application/json','cf-connecting-ip':ip,...headers};if(origin)h.origin=origin;
 return new Request('https://whatslearn.example.test'+url,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body)});
}
async function call(route,url,opts){const res=await route[opts?.method||'POST'](req(url,opts));let json={};try{json=await res.json()}catch{}return {status:res.status,json}}
module.exports={ROOT,db,env,jar,cookieApi,reset,load,req,call,FakeBucket,BASE,defaults,setHeaders:h=>{requestHeaders=h},get fake(){return fake}};
