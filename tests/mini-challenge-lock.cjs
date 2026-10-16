const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const React=require('react');let hooks=[],cursor=0;
const fakeReact={...React,useState(initial){const i=cursor++;if(!(i in hooks))hooks[i]=initial;return [hooks[i],value=>{hooks[i]=typeof value==='function'?value(hooks[i]):value}]},useRef(initial){const i=cursor++;if(!(i in hooks))hooks[i]={current:initial};return hooks[i]}};
const original=Module._load;Module._load=function(name,parent,main){if(name==='react')return fakeReact;if(name.startsWith('@/'))name=path.resolve(__dirname,'..',name.slice(2));return original.call(this,name,parent,main)};
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const Mini=require('../components/whatslearn/mini-challenge.tsx').default,{miniChallenge}=require('../lib/play.ts');
const walk=n=>!n||typeof n!=='object'?[]:Array.isArray(n)?n.flatMap(walk):[n,...walk(n.props?.children)];
const render=props=>{cursor=0;return walk(Mini(props))};
const options=tree=>tree.filter(n=>n.type==='button'&&typeof n.props['aria-pressed']==='boolean');
for(const correct of [false,true])test(`first ${correct?'correct':'incorrect'} side-quest choice stays locked, including rapid clicks`,async()=>{
 hooks=[];let earns=0;const props={missionId:'m1',earned:false,onEarn:async()=>{earns++}},answer=miniChallenge('m1','en').answer,first=correct?answer:1-answer;
 let tree=render(props),buttons=options(tree);assert.ok(buttons.every(b=>!b.props.disabled));
 buttons[first].props.onClick();buttons[1-first].props.onClick(); // Stale handler before React's next render.
 tree=render(props);buttons=options(tree);assert.ok(buttons.every(b=>b.props.disabled));assert.equal(buttons[first].props['aria-pressed'],true);assert.equal(buttons[1-first].props['aria-pressed'],false);
 buttons[1-first].props.onClick();assert.equal(options(render(props))[first].props['aria-pressed'],true);
 const status=tree.find(n=>n.props?.role==='status');assert.ok(!JSON.stringify(status).includes('Choose another answer'));
 const collect=tree.find(n=>n.type==='button'&&n.props.className==='outline');assert.equal(!!collect,correct);
 if(collect)await collect.props.onClick();assert.equal(earns,correct?1:0);
});
test('previously earned quest cannot choose or collect again',()=>{hooks=[];let earns=0;const props={missionId:'m1',earned:true,onEarn:async()=>{earns++}};const tree=render(props);assert.ok(options(tree).every(b=>b.props.disabled));options(tree)[0].props.onClick();assert.ok(options(render(props)).every(b=>!b.props['aria-pressed']));assert.equal(earns,0)});
