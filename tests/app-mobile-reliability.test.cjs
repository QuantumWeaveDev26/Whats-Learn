const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {load,hooks,find,text}=require('./helpers/client-components.cjs');
const profile={accountKey:'synthetic-mobile',name:'Test learner',profile:{track:'marketing',level:'beginner',language:'en',minutes:'15'}};
const originalFetch=global.fetch;
test.after(()=>global.fetch=originalFetch);
function responses(failPath,failStatus){global.fetch=async url=>{
 if(url===failPath){if(failStatus===0)throw new TypeError('Synthetic offline');return new Response('{}',{status:failStatus})}
 return Response.json(url==='/api/profile'?profile:url==='/api/work'?{accountKey:profile.accountKey,work:[],points:null,paidAccess:true,checkpoints:[]}:{accountKey:profile.accountKey,context:{role:'learner'}});
}}
for(const [url,status] of [['/api/profile',0],['/api/profile',503],['/api/work',503],['/api/learner-context',503]])test(`temporary ${url} failure (${status}) is not a logged-out or incomplete-setup snapshot`,async()=>{
 responses(url,status);const {loadSnapshot}=load('components/whatslearn-app/api.ts');await assert.rejects(loadSnapshot(),/connection|load|try again|longer/i);
});
test('an expired session is still represented as signed out',async()=>{responses('/api/profile',401);assert.equal(await load('components/whatslearn-app/api.ts').loadSnapshot(),null)});
test('successful snapshots preserve access and setup',async()=>{responses();const s=await load('components/whatslearn-app/api.ts').loadSnapshot();assert.equal(s.paidAccess,true);assert.equal(s.hasContext,true)});
test('a partial new-account snapshot never changes the account header used by the old screen',async()=>{
 const client=load('components/whatslearn-app/api.ts');client.setAccountKey('old-account');let observed;
 global.fetch=async(url,init)=>{if(url==='/api/profile')return Response.json(profile);if(url==='/api/work')return new Response('{}',{status:503});if(url==='/api/learner-context')return Response.json({context:{}});observed=init.headers['x-whatslearn-account'];return Response.json({ok:true})};
 await assert.rejects(client.loadSnapshot(),e=>e.accountKey===profile.accountKey);await client.api('/api/synthetic',{method:'POST',body:{}});assert.equal(observed,'old-account');
});
test('a timeout while reading a successful response body is a failed request',async()=>{
 global.fetch=async(url,init)=>({ok:true,status:200,json:()=>new Promise((resolve,reject)=>init.signal.addEventListener('abort',()=>reject(new DOMException('Synthetic body timeout','AbortError'))))});
 const result=await load('components/whatslearn-app/api.ts').api('/api/work',{timeoutMs:5});assert.equal(result.ok,false);assert.match(result.data.error,/longer/);
});
for(const changed of ['/api/work','/api/learner-context'])test(`${changed} cannot merge another account into a snapshot`,async()=>{
 global.fetch=async url=>Response.json(url==='/api/profile'?profile:url==='/api/work'?{accountKey:url===changed?'other-account':profile.accountKey,work:[],checkpoints:[],paidAccess:false}:{accountKey:url===changed?'other-account':profile.accountKey,context:{}});
 await assert.rejects(load('components/whatslearn-app/api.ts').loadSnapshot(),e=>e.accountKey==='other-account');
});
function worker(){
 const events={},deleted=[],cached=[];const self={addEventListener:(event,fn)=>events[event]=fn,skipWaiting(){},clients:{claim:async()=>{}},location:{origin:'https://whatslearn.in'}};
 const caches={keys:async()=>['wla-shell-v1','website-shell-v1','unrelated-cache','wla-language-pack'],delete:async key=>{deleted.push(key);return true},open:async()=>({addAll:async paths=>cached.push(...paths)}),match:async()=>new Response('PRIVATE CACHED ACCOUNT CONTENT')};
 vm.runInNewContext(fs.readFileSync('public/app-sw.js','utf8'),{self,caches,fetch:async()=>{throw new Error('Synthetic offline')},Response,URL});
 return {events,deleted,cached};
}
test('app activation leaves website and unrelated caches intact',async()=>{const w=worker();let done;w.events.activate({waitUntil:p=>done=p});await done;assert.deepEqual(w.deleted,['wla-shell-v1'])});
test('app installation caches only the public offline game, never an authenticated page',async()=>{const w=worker();let done;w.events.install({waitUntil:p=>done=p});await done;assert.deepEqual(w.cached,['/app-offline.html'])});
test('offline navigation never serves a cached learner page',async()=>{const w=worker();let answer;w.events.fetch({request:{method:'GET',mode:'navigate',url:'https://whatslearn.in/app'},waitUntil(){},respondWith:p=>answer=p});const r=await answer;assert.equal(r.status,503);assert.match(await r.text(),/offline/i);assert.equal(r.headers.get('cache-control'),'no-store')});
for(const url of ['https://whatslearn.in/','https://whatslearn.in/membership','https://whatslearn.in/application','https://example.com/app'])test(`app worker leaves ${url} navigation alone`,()=>{const w=worker();let handled=false;w.events.fetch({request:{method:'GET',mode:'navigate',url},respondWith:()=>handled=true});assert.equal(handled,false)});

test('failed first load offers Retry instead of treating the learner as a new visitor',async()=>{
 const prior={window:global.window,document:global.document,history:global.history};
 global.window={addEventListener(){},removeEventListener(){}};global.document={visibilityState:'hidden',addEventListener(){},removeEventListener(){}};global.history={pushState(){},back(){}};
 try{
  let fails=true;const h=hooks(),snapshot={...profile,work:[],points:null,paidAccess:false,checkpoints:[],hasContext:true};
  const names=['Splash','Welcome','LanguageStep','AuthScreen','PersonalSetup','PathSetup','Home','Courses','Mentor','Me','Creations','GuestHome','MissionFlow','CheckpointFlow'];
  const components=Object.fromEntries(names.map(name=>[name,{[name]:function(){return null}}[name]]));
  const api={loadSnapshot:async()=>{if(fails)throw Error('Connection unavailable. Please try again.');return snapshot},api:async()=>({ok:true,data:{limit:3,used:0}}),readLocal:()=>null,writeLocal:()=>true,setAccountKey(){}};
  const {default:App}=load('components/whatslearn-app/app.tsx',h,{'./api':api,'./intro':components,'./onboarding':components,'./practice':components,'./tabs':{...components,nextFor:()=>null}});
  const render=()=>{h.start();return App()};render();await h.flush();let tree=render();assert.match(text(tree),/try again|load/i);
  assert.equal(find(tree,n=>n.type===components.Welcome),undefined);const retry=find(tree,n=>n.type==='button'&&text(n)==='Try again');assert.ok(retry);
  fails=false;await retry.props.onClick();await h.flush();tree=render();assert.ok(find(tree,n=>n.type===components.Home));
  const me=find(tree,n=>n.type==='button'&&text(n)==='Me');me.props.onClick();tree=render();find(tree,n=>n.type===components.Me).props.onPrefs();tree=render();fails=true;
  await find(tree,n=>n.type===components.PathSetup).props.onDone();tree=render();assert.ok(find(tree,n=>n.type===components.Home));assert.match(text(tree),/try again/i);
 }finally{Object.assign(global,prior)}
});

test('the mobile sheet contains keyboard focus, closes on Escape and restores the trigger',async()=>{
 const old=global.document;let focused;
 const trigger={isConnected:true,focus(){focused=this}},first={getClientRects:()=>[1],focus(){focused=this;global.document.activeElement=this}},last={getClientRects:()=>[1],focus(){focused=this;global.document.activeElement=this}};
 global.document={activeElement:trigger};
 try{const h=hooks(),{AppSheet}=load('components/whatslearn-app/sheet.tsx',h);let closed=0;h.start();const tree=AppSheet({title:'Plans',onClose:()=>closed++,children:'Synthetic content'}),dialog=find(tree,n=>n.props.role==='dialog');
  dialog.props.ref.current={querySelector:()=>first,querySelectorAll:()=>[first,last]};await h.flush();assert.equal(focused,first);
  global.document.activeElement=last;let prevented=false;dialog.props.onKeyDown({key:'Tab',shiftKey:false,preventDefault(){prevented=true}});assert.equal(focused,first);assert.equal(prevented,true);
  dialog.props.onKeyDown({key:'Escape',preventDefault(){}});assert.equal(closed,1);
  // The effect cleanup is exercised by changing its dependency, as on unmount.
  h.start();AppSheet({title:'Plans',onClose:()=>closed++,children:'Synthetic content'});assert.equal(focused,trigger);
 }finally{global.document=old}
});
