const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const React=require('react');
const root=path.resolve(__dirname,'..');
const nothing=()=>null;
function compile(file,load){
 const out=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const mod={exports:{}};new Function('require','module','exports',out)(load,mod,mod.exports);return mod.exports;
}
function find(node,predicate){
 if(!node||typeof node!=='object')return;
 if(predicate(node))return node;
 for(const child of React.Children.toArray(node.props?.children)){const found=find(child,predicate);if(found)return found}
}
function hooks(){
 const slots=[];let cursor=0;const effects=[];
 const same=(a,b)=>a&&b&&a.length===b.length&&a.every((x,i)=>Object.is(x,b[i]));
 const api={...React,useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],next=>slots[i]=typeof next==='function'?next(slots[i]):next]},
  useRef(value){const i=cursor++;return slots[i]??=( {current:value})},
  useMemo(fn,deps){const i=cursor++;if(!slots[i]||!same(slots[i].deps,deps))slots[i]={deps,value:fn()};return slots[i].value},
  useEffect(fn,deps){const i=cursor++;if(!same(slots[i]?.deps,deps)){slots[i]?.cleanup?.();slots[i]={deps};effects.push(()=>slots[i].cleanup=fn())}}};
 api.useCallback=(fn,deps)=>api.useMemo(()=>fn,deps);
 return {api,start(){cursor=0},async flush(){while(effects.length)effects.shift()();await new Promise(r=>setImmediate(r))}};
}
const fallback={kind:'mission',mission:{id:'m2',track:'marketing',title:'Marketing task'},position:2};
const fullStack={kind:'mission',mission:{id:'d1',track:'development',title:'Booking page'},position:1};
const snapshot={accountKey:'synthetic-a',name:'Synthetic learner',profile:{track:'marketing',language:'en',level:'beginner'},work:[],points:null,paidAccess:false,checkpoints:[],hasContext:true};
const components=Object.fromEntries(['Home','Courses','Mentor','Me','Creations','GuestHome','MissionFlow','CheckpointFlow','Splash','Welcome','LanguageStep','AuthScreen','PersonalSetup','PathSetup'].map(name=>[name,{[name]:function(){return null}}[name]]));
function mountApp(s=snapshot,storage=new Map()){
 const h=hooks();let currentSnapshot=s,accountKey='';
 const module=compile('components/whatslearn-app/app.tsx',id=>{
  if(id==='react')return h.api;
  if(id==='lucide-react')return new Proxy({},{get:()=>nothing});
  if(id==='@/lib/personalization')return {localizeMission:m=>m};
  if(id==='@/lib/progression')return {missionsOfCourse:()=>[fallback.mission,fullStack.mission]};
  if(id==='@/lib/missions')return loadLocal('lib/missions.ts',h);
  if(id==='@/lib/practical')return loadLocal('lib/practical.ts',h);
  if(id==='./api')return {loadSnapshot:async()=>{if(currentSnapshot instanceof Error)throw currentSnapshot;return typeof currentSnapshot==='function'?currentSnapshot():currentSnapshot},api:async()=>({ok:true,data:{limit:3,used:0}}),readLocal:k=>storage.get(k)||null,writeLocal:(k,v)=>{storage.set(k,v);return true},setAccountKey:key=>accountKey=key};
  if(id==='./learning-state')return loadLocal('components/whatslearn-app/learning-state.ts',h);
  if(id==='./sheet')return loadLocal('components/whatslearn-app/sheet.tsx',h);
  if(id==='./checkout')return {BuyButton:function BuyButton(){return null},useBillingStatus:()=>({enabled:false,mode:'live',checked:true})};
  if(id==='./tabs')return {...components,nextFor:()=>fallback};
  if(['./intro','./onboarding','./practice'].includes(id))return components;
  if(id==='./games')return {GamesHub:function GamesHub(){return null}};
  if(id==='./games-data')return {games:[]};
  if(id==='./rewards')return {levelOf:()=>({lv:1,xp:0,into:0,need:200,title:'Curious'})};
  return require(id);
 });
 const render=()=>{h.start();return module.default()};
 return {render,flush:h.flush,setSnapshot:s=>currentSnapshot=s,getAccountKey:()=>accountKey};
}
const host={window:global.window,document:global.document,history:global.history};
test.before(()=>{global.window={addEventListener(){},removeEventListener(){}};global.document={visibilityState:'hidden',addEventListener(){},removeEventListener(){}};global.history={pushState(){},back(){}}});
test.after(()=>Object.assign(global,host));
async function enterApp(m){m.render();await m.flush();const splash=m.render();find(splash,n=>n.type===components.Splash).props.onDone();m.render();await m.flush();return m.render()}
function nav(tree,label){return find(tree,n=>n.type==='button'&&n.props.children?.[1]===label)}

test('the mentor and Practice retain a selected task from another course across tab changes',async()=>{
 const m=mountApp();let tree=await enterApp(m);
 nav(tree,'Courses').props.onClick();tree=m.render();
 find(tree,n=>n.type===components.Courses).props.onOpen(fullStack);tree=m.render();
 assert.equal(find(tree,n=>n.type===components.MissionFlow).props.mission.id,'d1');
 nav(tree,'Mentor').props.onClick();tree=m.render();
 assert.equal(find(tree,n=>n.type===components.Mentor).props.missionId,'d1');
 // Keeping the existing flow mounted retains its local step, draft and review.
 assert.ok(find(tree,n=>n.type===components.MissionFlow),'practice stays mounted while hidden');
 nav(tree,'Practice').props.onClick();tree=m.render();
 assert.equal(find(tree,n=>n.type===components.MissionFlow).props.mission.id,'d1');
});

test('reopening the app restores the last selected task instead of the profile default',async()=>{
 const storage=new Map(),first=mountApp(snapshot,storage);let tree=await enterApp(first);nav(tree,'Courses').props.onClick();tree=first.render();find(tree,n=>n.type===components.Courses).props.onOpen(fullStack);first.render();await first.flush();
 const reopened=mountApp(snapshot,storage);tree=await enterApp(reopened);
 assert.equal(find(tree,n=>n.type===components.MissionFlow)?.props.mission.id,'d1');
 assert.equal(nav(tree,'Practice').props['aria-current'],'page');
});

test('guests can reach the course outline without being forced into sign-in',async()=>{
 const m=mountApp(null);let tree=await enterApp(m);
 find(tree,n=>n.type===components.Welcome).props.onDone();tree=m.render();
 find(tree,n=>n.type===components.LanguageStep).props.onNext();tree=m.render();
 find(tree,n=>n.type===components.AuthScreen).props.onGuest();tree=m.render();
 nav(tree,'Courses').props.onClick();tree=m.render();
 assert.ok(find(tree,n=>n.type===components.Courses),'the public course catalogue is available');
 assert.equal(find(tree,n=>n.type===components.MissionFlow),undefined,'guest cannot mount signed-in practice');
});

test('sign-out clears the selected private practice task before the next sign-in',async()=>{
 const m=mountApp();let tree=await enterApp(m);nav(tree,'Courses').props.onClick();tree=m.render();
 find(tree,n=>n.type===components.Courses).props.onOpen(fullStack);tree=m.render();nav(tree,'Me').props.onClick();tree=m.render();
 await find(tree,n=>n.type===components.Me).props.onSignOut();tree=m.render();
 find(tree,n=>n.type===components.AuthScreen).props.onSignedIn();await m.flush();tree=m.render();
 nav(tree,'Practice').props.onClick();tree=m.render();
 assert.equal(find(tree,n=>n.type===components.MissionFlow).props.mission.id,'m2');
});

function loadLocal(file,h,cache=new Map()){
 if(cache.has(file))return cache.get(file);
 const mod=compile(file,id=>{
  if(id==='react')return h.api;
  if(id==='lucide-react')return new Proxy({},{get:()=>nothing});
  if(id.startsWith('@/')||id.startsWith('.')){
   const base=id.startsWith('@/')?id.slice(2):path.join(path.dirname(file),id);
   const resolved=['','.ts','.tsx','.json','/index.ts','/index.tsx'].map(ext=>base+ext).find(f=>fs.existsSync(path.join(root,f))&&fs.statSync(path.join(root,f)).isFile());
   if(resolved?.endsWith('.json'))return JSON.parse(fs.readFileSync(path.join(root,resolved),'utf8'));
   if(resolved)return loadLocal(resolved,h,cache);
  }
  return require(id);
 });cache.set(file,mod);return mod;
}
const text=node=>typeof node==='string'||typeof node==='number'?String(node):node?.props?React.Children.toArray(node.props.children).map(text).join(''):'';

test('a guest can inspect all ten task titles but starting a task or checkpoint requires sign-in',()=>{
 const h=hooks(),{Courses}=loadLocal('components/whatslearn-app/tabs.tsx',h);let started=0,signIns=0;
 const render=()=>{h.start();return Courses({s:null,onOpen:()=>started++,onSignIn:()=>signIns++})};
 let tree=render();assert.equal(find(tree,n=>n.type==='button'&&text(n).includes('Capstone: build a one-page campaign plan')),undefined,'outlines start collapsed to keep the screen concise');
 find(tree,n=>n.type==='button'&&text(n).includes('AI Digital Marketing')).props.onClick();tree=render();
 assert.ok(find(tree,n=>n.type==='button'&&text(n).includes('Capstone: build a one-page campaign plan')));
 find(tree,n=>n.type==='button'&&text(n).includes('Turn a customer problem into a clear offer')).props.onClick();
 find(tree,n=>n.type==='button'&&text(n).includes('Brief the AI, then check its claims')).props.onClick();
 assert.equal(started,0);assert.equal(signIns,2);
});

test('Home course cards open the course the learner chose instead of the profile default',()=>{
 const h=hooks(),{Home}=loadLocal('components/whatslearn-app/tabs.tsx',h);let selected;
 h.start();const tree=Home({s:snapshot,onOpen(){},onTab(){},onCourse:id=>selected=id});
 find(tree,n=>n.type==='button'&&text(n).includes('AI Full-Stack Development')).props.onClick();
 assert.equal(selected,'development');
});

test('membership opens the app plan sheet while external settings keep their existing URL',()=>{
 const h=hooks(),{Me}=loadLocal('components/whatslearn-app/tabs.tsx',h);
 let plans=0;h.start();const tree=Me({s:snapshot,signedIn:true,onSignIn(){},onCreations(){},onPrefs(){},onLanguage(){},onPlans:()=>plans++,onSignOut(){}});
 find(tree,n=>n.type==='button'&&text(n).includes('Membership & plans')).props.onClick();assert.equal(plans,1);
 assert.equal(find(tree,n=>n.type==='a'&&text(n).includes('Connect WhatsApp reminders')).props.href,'/settings?connect=whatsapp#whatsapp');
});

test('the app plan sheet can close without navigating or changing the website',async()=>{
 const m=mountApp();let tree=await enterApp(m);nav(tree,'Me').props.onClick();tree=m.render();
 find(tree,n=>n.type===components.Me).props.onPlans();tree=m.render();
 const sheet=find(tree,n=>n.type?.name==='AppSheet');assert.ok(sheet);
 assert.equal(find(tree,n=>n.type==='main').props.inert,true,'background content cannot receive focus behind the sheet');
 assert.ok(find(tree,n=>n.type?.name==='BuyButton'),'the existing in-app plan control remains present; the test never activates checkout');
 find(tree,n=>n.type==='button'&&text(n)==='Maybe later').props.onClick();tree=m.render();assert.equal(find(tree,n=>n.type?.name==='AppSheet'),undefined);
});

test('an external account change remounts a retained lesson even when both accounts have the same next task',async()=>{
 const m=mountApp();let tree=await enterApp(m);nav(tree,'Practice').props.onClick();tree=m.render();
 const previous=find(tree,n=>n.type===components.MissionFlow);
 m.setSnapshot({...snapshot,accountKey:'synthetic-b'});previous.props.onPoints();await m.flush();m.render();await m.flush();tree=m.render();
 const next=find(tree,n=>n.type===components.MissionFlow);
 assert.equal(next.props.mission.id,'m2');assert.notEqual(next.key,previous.key,'the former account flow must unmount');
});

test('phone Back from Mentor preserves hidden practice rather than closing it',async()=>{
 const listeners={};const old=global.window;global.window={addEventListener:(name,fn)=>listeners[name]=fn,removeEventListener(){}};
 try{
  const m=mountApp();let tree=await enterApp(m);nav(tree,'Courses').props.onClick();tree=m.render();
  find(tree,n=>n.type===components.Courses).props.onOpen(fullStack);tree=m.render();nav(tree,'Mentor').props.onClick();m.render();
  listeners.popstate();tree=m.render();
  assert.equal(find(tree,n=>n.type===components.MissionFlow)?.props.mission.id,'d1');
  assert.equal(nav(tree,'Home').props['aria-current'],'page');
 }finally{global.window=old}
});

test('practice and the visible screen always have distinct React identities',async()=>{
 const m=mountApp();let tree=await enterApp(m);nav(tree,'Practice').props.onClick();tree=m.render();
 m.setSnapshot({...snapshot,accountKey:'synthetic-b'});find(tree,n=>n.type===components.MissionFlow).props.onPoints();await m.flush();m.render();await m.flush();tree=m.render();
 const main=find(tree,n=>n.type==='main'),keys=React.Children.toArray(main.props.children).map(n=>n.key);
 assert.equal(new Set(keys).size,keys.length,'duplicate sibling keys can remount or duplicate practice');
});

test('a different account never restores the former account draft or a legacy unscoped draft',()=>{
 const previousStorage=global.localStorage;const data=new Map();global.localStorage={getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};
 try{
  const h=hooks(),{MissionFlow}=loadLocal('components/whatslearn-app/practice.tsx',h),{missions}=loadLocal('lib/missions.ts',h);
  const mission=missions.find(m=>m.id==='d1'),field=mission.practical.fields[0].id;
  const privateAnswer=JSON.stringify({fields:{[field]:'Account A private draft'},reasoning:'Private reasoning from account A',link:''});
  data.set('wla-draft:d1',privateAnswer);data.set('wla-draft:synthetic-a:d1',privateAnswer);
  const render=()=>{h.start();return MissionFlow({accountKey:'synthetic-b',mission,position:1,language:'en',onSaved(){},onUpgrade(){},onBack(){}})};
  let tree=render();find(tree,n=>n.type==='button'&&text(n)==='Check my understanding').props.onClick();tree=render();
  find(tree,n=>n.type==='button'&&text(n)===mission.options[mission.answer]).props.onClick();tree=render();
  const input=find(tree,n=>n.props.id==='f-'+field);assert.ok(input);assert.notEqual(input.props.value,'Account A private draft');
 }finally{global.localStorage=previousStorage}
});

test('a known account switch with a partial load failure unmounts the previous private task',async()=>{
 const m=mountApp();let tree=await enterApp(m);nav(tree,'Practice').props.onClick();tree=m.render();
 m.setSnapshot(Object.assign(new Error('Synthetic partial failure'),{accountKey:'synthetic-b'}));find(tree,n=>n.type===components.MissionFlow).props.onPoints();await m.flush();tree=m.render();
 assert.equal(find(tree,n=>n.type===components.MissionFlow),undefined);assert.ok(find(tree,n=>n.type==='button'&&text(n)==='Try again'));assert.equal(m.getAccountKey(),'');
});

test('retry after a saved setup refresh failure resumes Home without saving setup twice',async()=>{
 const m=mountApp({...snapshot,hasContext:false});let tree=await enterApp(m);assert.ok(find(tree,n=>n.type===components.PersonalSetup));
 m.setSnapshot(new Error('Synthetic refresh failure'));await find(tree,n=>n.type===components.PersonalSetup).props.onDone();tree=m.render();
 assert.equal(find(tree,n=>n.type===components.PersonalSetup),undefined);const retry=find(tree,n=>n.type==='button'&&text(n)==='Try again');assert.ok(retry);
 m.setSnapshot(snapshot);await retry.props.onClick();tree=m.render();assert.ok(find(tree,n=>n.type===components.Home));
});

test('a refresh finishing after sign-out cannot publish the old account again',async()=>{
 const m=mountApp();let tree=await enterApp(m);nav(tree,'Practice').props.onClick();tree=m.render();let resolve;
 m.setSnapshot(()=>new Promise(r=>resolve=r));find(tree,n=>n.type===components.MissionFlow).props.onPoints();nav(tree,'Me').props.onClick();tree=m.render();await find(tree,n=>n.type===components.Me).props.onSignOut();
 resolve(snapshot);await m.flush();tree=m.render();assert.equal(m.getAccountKey(),'');assert.ok(find(tree,n=>n.type===components.AuthScreen));
});

test('phone Back returns from a challenge screen to Play before Home',async()=>{
 const listeners={},old=global.window;global.window={addEventListener:(name,fn)=>listeners[name]=fn,removeEventListener(){}};
 try{const m=mountApp();let tree=await enterApp(m);nav(tree,'Play').props.onClick();tree=m.render();const play=find(tree,n=>typeof n.props.onView==='function');assert.ok(play);play.props.onView('squad');m.render();listeners.popstate();tree=m.render();assert.equal(find(tree,n=>typeof n.props.onView==='function').props.view,'games');assert.equal(nav(tree,'Play').props['aria-current'],'page')}
 finally{global.window=old}
});
