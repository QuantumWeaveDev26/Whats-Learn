const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const root=path.resolve(__dirname,'..');const original=Module._load;
Module._load=function(name,parent,isMain){if(name.startsWith('@/'))name=path.join(root,name.slice(2));return original.call(this,name,parent,isMain)};
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,f);
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const Notice=require('../components/whatslearn/language-notice.tsx').default;
test('English missions never show an English translation pending notice',()=>{
 assert.equal(renderToStaticMarkup(React.createElement(Notice,{language:'en',missionId:'d1'})),'');
 assert.match(renderToStaticMarkup(React.createElement(Notice,{language:'hi',missionId:'d1'})),/question and practical task are in English/);
});
test('email-hosted learner actions do not advertise a ChatGPT-only sign-in',()=>{
 for(const file of ['components/whatslearn/practice-coach.tsx','components/whatslearn/whatsapp-optin.tsx','app/learn/page.tsx'])assert.doesNotMatch(fs.readFileSync(path.join(root,file),'utf8'),/>\s*Sign in with ChatGPT/);
});
test('settings do not promise automatic custom GPT synchronization',()=>{
 assert.doesNotMatch(fs.readFileSync(path.join(root,'app/settings/page.tsx'),'utf8'),/ChatGPT plugin/);
});
test('standalone membership page declares its main heading',()=>{
 assert.match(fs.readFileSync(path.join(root,'app/membership/page.tsx'),'utf8'),/headingLevel=\{1\}/);
});
