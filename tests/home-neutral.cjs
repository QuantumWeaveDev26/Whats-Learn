const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),Module=require('node:module');
const old=Module._load;Module._load=function(name,parent,main){if(name.startsWith('@/'))name=path.resolve(__dirname,'..',name.slice(2));return old.call(this,name,parent,main)};
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
test('a fresh hero asks for a subject and does not open a story or completed progress',()=>{
 const Hero=require('../components/whatslearn/visual-start.tsx').default;
 const html=renderToStaticMarkup(React.createElement(Hero));
 assert.match(html,/One spark\. Something real\./);assert.match(html,/Pick your spark/);
 assert.equal((html.match(/aria-pressed="false"/g)||[]).length,4);
 assert.doesNotMatch(html,/aria-pressed="true"|role="progressbar"|A draft\. An approval\.|THE APP STUDIO/);
 assert.match(html,/welcome-video-inline/);
});
test('all four programme rows start collapsed',()=>{
 const Explorer=require('../components/whatslearn/programme-explorer.tsx').default;
 const html=renderToStaticMarkup(React.createElement(Explorer));
 assert.equal((html.match(/aria-expanded="false"/g)||[]).length,4);
 assert.doesNotMatch(html,/aria-expanded="true"|class="programme-detail"/);
});
test('guests choose a subject while accounts restore saved course',()=>{
 const source=fs.readFileSync(path.resolve(__dirname,'../components/whatslearn/visual-start.tsx'),'utf8');
 assert.match(source,/\[chosen,setChosen\]=useState\(false\)/);
 assert.match(source,/function selectTrack[\s\S]*setChosen\(true\)/);
 assert.match(source,/chosen\?'agency-first-choice':'agency-first-subject'/);
 assert.doesNotMatch(source,/const initial=agencyTracks|removeItem|localStorage\.clear/);
 assert.match(source,/const stored=readAgencyDrafts\(\)\[value\]/);
 assert.match(source,/startSavedProgressSync\(loadAccount\)/);
 assert.match(source,/accountTrack.current!==selected.id/);
 assert.match(source,/setTrack\(selected.id\);setChosen\(true\)/);
});

test('old saved starter cannot preselect an answer or mark a new attempt saved',()=>{
 const source=fs.readFileSync(path.resolve(__dirname,'../components/whatslearn/visual-start.tsx'),'utf8');
 const select=source.slice(source.indexOf('function selectTrack'),source.indexOf('function selectLanguage'));
 assert.match(select,/const draft=draftsInVisit.current\[value\];/);
 assert.doesNotMatch(select,/stored.choice|saved:true|body:stored.body/);
 assert.match(select,/setPreviousStarter\(stored\?\.body/);
 assert.match(source,/View saved starter/);
 assert.match(source,/This attempt starts unanswered/);
});

test('unanswered starter options share a neutral appearance',()=>{
 const css=fs.readFileSync(path.resolve(__dirname,'../app/globals.css'),'utf8');
 assert.match(css,/\.agency-studio \.visual-option\[aria-pressed=false\]\{background:#f2f4f2/);
});
