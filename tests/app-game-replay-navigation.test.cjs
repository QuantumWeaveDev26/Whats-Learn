const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const {hooks,load,find}=require('./helpers/client-components.cjs');

function screen(save){
 const h=hooks(),storage=new Map(),requests=[];let replays=0;
 const client={readLocal:k=>storage.get(k)||null,writeLocal:(k,v)=>{storage.set(k,v);return true},api:(url,init)=>{requests.push({url,init});return save()}};
 const overrides={'./api':client,'./rewards':{markGameDay(){}}},cache=new Map();
 const mod={exports:{}},code=fs.readFileSync('components/whatslearn-app/games.tsx','utf8')+'\nexport {GameScreen};';
 new Function('require','module','exports',ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText)(id=>{
  if(id==='react')return h.api;
  if(id==='lucide-react')return new Proxy({},{get:()=>()=>null});
  if(id in overrides)return overrides[id];
  if(id.startsWith('.')){const base='components/whatslearn-app/'+id.slice(2);return load(base+(fs.existsSync(base+'.ts')?'.ts':'.tsx'),h,overrides,cache)}
  return require(id);
 },mod,mod.exports);
 const props={meta:{id:'shot-order',track:'filmmaking',name:'Shot Order'},who:'synthetic-replay',onExit(){},onAgain(){replays++}};
 const render=()=>{h.start();return mod.exports.GameScreen(props)};
 return {render,h,requests,replays:()=>replays};
}

test('Play again starts immediately while a score upload is still pending',async()=>{
 const m=screen(()=>new Promise(()=>{}));
 find(m.render(),n=>n.type?.name==='Game').props.onDone(75);
 const result=find(m.render(),n=>n.type?.name==='Result');
 result.props.onAgain();
 assert.equal(m.replays(),1,'replay must not wait for score saving');
 assert.equal(m.requests.length,1,'the completed score is still submitted once');
 assert.equal(m.requests[0].init.body.score,75);
 assert.ok(m.requests[0].init.timeoutMs>0,'score saving has a bounded wait');
});

test('a rejected score upload does not prevent starting the next game',async()=>{
 const m=screen(()=>Promise.reject(new Error('Synthetic network failure')));
 find(m.render(),n=>n.type?.name==='Game').props.onDone(50);
 find(m.render(),n=>n.type?.name==='Result').props.onAgain();
 await m.h.flush();
 assert.equal(m.replays(),1);
});
