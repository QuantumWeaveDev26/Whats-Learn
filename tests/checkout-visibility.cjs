const test=require('node:test'),assert=require('node:assert/strict'),Module=require('node:module'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
require('react/jsx-runtime');let model;
const react={useState(value){const i=model.index++,m=model;if(!(i in m.slots))m.slots[i]=value;return [m.slots[i],v=>{m.slots[i]=typeof v==='function'?v(m.slots[i]):v}]},useEffect(fn){if(model.first)model.effects.push(fn)}};
const original=Module._load;Module._load=function(name,parent,isMain){if(name==='react')return react;if(name.startsWith('@/'))name=path.resolve(name.slice(2));return original.call(this,name,parent,isMain)};
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,f);
const Component=require('../components/whatslearn/razorpay-checkout.tsx').default;
function mount(){const m={slots:[],index:0,first:true,effects:[]};return {render(){model=m;m.index=0;const tree=Component({sku:'plus_monthly'});if(m.first){m.first=false;m.cleanups=m.effects.map(fn=>fn())}return tree},unmount(){for(const fn of m.cleanups||[])fn?.()}}}
function nodes(t){if(t==null||typeof t!=='object')return [];if(Array.isArray(t))return t.flatMap(nodes);return [t,...nodes(t.props?.children)]}
function text(t){if(t==null)return '';if(typeof t==='string'||typeof t==='number')return String(t);if(Array.isArray(t))return t.map(text).join('');return text(t.props?.children)}
const tick=()=>new Promise(r=>setImmediate(r));
test('purchase button stays visible and disabled while loading and when checkout is closed',async()=>{
 let calls=[];global.fetch=async(url,opts)=>{calls.push({url,opts});return Response.json({enabled:false,checkoutOpen:false})};
 const ui=mount();let tree=ui.render();let button=nodes(tree).find(n=>n.type==='button');assert.ok(button,'Payment action must not disappear');assert.equal(button.props.disabled,true);assert.match(text(tree),/Checking payment availability/);
 await tick();tree=ui.render();button=nodes(tree).find(n=>n.type==='button');assert.match(text(button),/Pay securely with Razorpay/);assert.equal(button.props.disabled,true);await button.props.onClick();assert.equal(calls.length,1);assert.equal(calls[0].opts?.method,undefined,'Closed checkout never posts an order');assert.doesNotMatch(text(tree),/TEST MODE/);ui.unmount();
});
test('verified live availability enables the visible payment action',async()=>{
 global.fetch=async()=>Response.json({enabled:true,checkoutOpen:true,mode:'live'});const ui=mount();ui.render();await tick();const tree=ui.render(),button=nodes(tree).find(n=>n.type==='button');assert.equal(button.props.disabled,false);assert.match(text(button),/Pay securely with Razorpay/);ui.unmount();
});
test('owner test mode keeps the checkout explicitly labelled as a test',async()=>{
 global.fetch=async()=>Response.json({enabled:true,mode:'test'});const ui=mount();ui.render();await tick();const tree=ui.render();assert.match(text(tree),/Open Razorpay test checkout/);assert.match(text(tree),/TEST MODE/);ui.unmount();
});
test('failed status check keeps the payment action disabled and explains recovery',async()=>{
 global.fetch=async()=>Response.json({error:'Status unavailable'},{status:503});const ui=mount();ui.render();await tick();const tree=ui.render();assert.equal(nodes(tree).find(n=>n.type==='button').props.disabled,true);assert.match(text(tree),/Reopen this plan to retry/);ui.unmount();
});
