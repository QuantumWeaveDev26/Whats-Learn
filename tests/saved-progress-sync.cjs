const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {startSavedProgressSync}=require('../lib/saved-progress-sync.ts');
test('saved progress polls serially, pauses hidden tabs, backs off and cleans up',async()=>{
 const original={fetch:global.fetch,document:global.document,window:global.window,setTimeout:global.setTimeout,clearTimeout:global.clearTimeout,navigator:Object.getOwnPropertyDescriptor(global,'navigator')};
 const events={},timers=new Map();let n=0,revision='one',calls=0,changes=0,status=200;
 const target={addEventListener:(k,v)=>events[k]=v,removeEventListener:k=>delete events[k]};
 global.document={...target,visibilityState:'visible'};global.window=target;
 Object.defineProperty(global,'navigator',{value:{onLine:true},configurable:true});
 global.setTimeout=(fn,ms)=>{timers.set(++n,{fn,ms});return n};global.clearTimeout=id=>timers.delete(id);
 global.fetch=async()=>{calls++;return {status,ok:status===200,json:async()=>({revision})}};
 const flush=()=>new Promise(resolve=>setImmediate(resolve));
 const tick=async()=>{const [id,t]=[...timers][0];timers.delete(id);await t.fn();await flush()};
 try{
  const stop=startSavedProgressSync(async()=>{changes++});await flush();assert.equal(calls,1);assert.equal(changes,0);assert.equal([...timers.values()][0].ms,5000);
  await tick();assert.equal(changes,0);revision='two';await tick();assert.equal(changes,1);
  document.visibilityState='hidden';await tick();assert.equal(calls,3);assert.equal(timers.size,0);
  document.visibilityState='visible';events.visibilitychange();events.focus();await flush();assert.equal(calls,4);
  status=503;await tick();assert.equal([...timers.values()][0].ms,10000);
  stop();assert.equal(timers.size,0);assert.deepEqual(Object.keys(events),[]);
 }finally{for(const k of ['fetch','document','window','setTimeout','clearTimeout'])global[k]=original[k];Object.defineProperty(global,'navigator',original.navigator)}
});
test('homepage keeps saved starter collapsed until the learner chooses to review',()=>{
 const s=fs.readFileSync(require('node:path').resolve(__dirname,'../components/whatslearn/visual-start.tsx'),'utf8');
 assert.match(s,/saved&&!showCreation/);assert.match(s,/Review my starter/);assert.match(s,/saved&&showCreation/);
});
