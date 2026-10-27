const test=require('node:test'),assert=require('node:assert/strict'),Module=require('node:module'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
require('react/jsx-runtime'); // Bind the real JSX element factory before replacing only the component hooks.
let model;
const react={useState(value){const i=model.index++,m=model;if(!(i in m.slots))m.slots[i]=value;return [m.slots[i],v=>{m.writes++;m.slots[i]=typeof v==='function'?v(m.slots[i]):v}]},useRef(value){const i=model.index++;return model.slots[i]??(model.slots[i]={current:value})},useEffect(fn){if(model.first)model.effects.push(fn)}};
const original=Module._load;Module._load=function(name,parent,isMain){if(name==='react')return react;if(name.startsWith('@/'))name=path.resolve(name.slice(2));return original.call(this,name,parent,isMain)};
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,f);
const Component=require('../components/whatslearn/membership-subscriptions.tsx').default;
const billing={accountKey:'account-a',enabled:false,checkoutOpen:false,sessions:[{id:'11111111-1111-4111-8111-111111111111',sku:'plus_monthly',kind:'subscription',state:'active',mode:'live',canManage:true}]};
function mount(data=billing){const m={slots:[],index:0,first:true,effects:[],writes:0,reloads:0};const render=()=>{model=m;m.index=0;const tree=Component({billing:data,onReload:async()=>{m.reloads++}});if(m.first){m.first=false;m.cleanups=m.effects.map(fn=>fn())}return tree};return {m,render,unmount(){for(const cleanup of m.cleanups||[])cleanup?.()}}}
function nodes(tree){if(tree==null||typeof tree!=='object')return [];if(Array.isArray(tree))return tree.flatMap(nodes);return [tree,...nodes(tree.props?.children)]}
function text(tree){if(tree==null)return '';if(typeof tree==='string'||typeof tree==='number')return String(tree);if(Array.isArray(tree))return tree.map(text).join('');return text(tree.props?.children)}
const button=(tree,label)=>nodes(tree).find(n=>n.type==='button'&&text(n)===label);
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('stopping renewal requires a separate confirmation and duplicate clicks send one account-bound request',async()=>{
 const ui=mount();let calls=[];global.fetch=async(url,o)=>{calls.push({url,...o});return Response.json({message:'Razorpay accepted your request.'})};
 let tree=ui.render();button(tree,'Stop future renewals').props.onClick();assert.equal(calls.length,0);tree=ui.render();assert.match(text(tree),/period already paid/);
 const confirm=button(tree,'Confirm stop renewal');confirm.props.onClick();confirm.props.onClick();await tick();tree=ui.render();assert.equal(calls.length,1);assert.equal(calls[0].headers['x-whatslearn-account'],'account-a');assert.deepEqual(JSON.parse(calls[0].body),{action:'cancel',sessionId:billing.sessions[0].id});assert.match(text(tree),/accepted your request/);assert.equal(ui.m.reloads,1);ui.unmount();
});
test('keeping a subscription and a failed cancellation never display success',async()=>{
 const ui=mount();let calls=0;global.fetch=async()=>{calls++;return Response.json({error:'Your account changed. Reload this page.'},{status:409})};
 button(ui.render(),'Stop future renewals').props.onClick();button(ui.render(),'Keep my subscription').props.onClick();assert.equal(calls,0);assert.equal(button(ui.render(),'Confirm stop renewal'),undefined);
 button(ui.render(),'Stop future renewals').props.onClick();button(ui.render(),'Confirm stop renewal').props.onClick();await tick();const tree=ui.render();assert.ok(nodes(tree).some(n=>n.props?.role==='alert'&&/account changed/.test(text(n))));assert.equal(ui.m.reloads,0);ui.unmount();
});
test('an unmounted account cannot receive an old action result',async()=>{
 const ui=mount();let resolve;global.fetch=()=>new Promise(r=>resolve=r);button(ui.render(),'Refresh status').props.onClick();ui.unmount();const before=ui.m.writes;resolve(Response.json({message:'Old account result'}));await tick();assert.equal(ui.m.writes,before);assert.equal(ui.m.reloads,0);
});
test('guest sessions are hidden and test cancellation is labelled as test-only',()=>{
 assert.equal(mount(null).render(),null);assert.equal(mount({...billing,accountKey:undefined}).render(),null);
 const ui=mount({...billing,sessions:[{...billing.sessions[0],mode:'test'}]});const tree=ui.render();assert.match(text(tree),/Plus monthly · test/);assert.ok(button(tree,'Cancel test subscription'));ui.unmount();
});

test('unused checkout has a distinct cancellation action that requires confirmation',async()=>{
 const ui=mount({...billing,sessions:[{...billing.sessions[0],state:'created'}]});let calls=0;global.fetch=async()=>{calls++;return Response.json({message:'Unused checkout cancelled.'})};
 let tree=ui.render();const cancel=button(tree,'Cancel unused checkout');assert.ok(cancel);cancel.props.onClick();assert.equal(calls,0);tree=ui.render();assert.match(text(tree),/choose a plan at its current price/);await button(tree,'Confirm cancel checkout').props.onClick();assert.equal(calls,1);ui.unmount();
});

test('a provider-rejected attempt is not presented as a manageable subscription',()=>{
 const ui=mount({...billing,sessions:[{...billing.sessions[0],state:'rejected',canManage:false}]});assert.equal(ui.render(),null);ui.unmount();
});
