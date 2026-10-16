const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),Module=require('node:module');
const original=Module._load;Module._load=function(name,parent,main){if(name.startsWith('@/'))name=path.resolve(__dirname,'..',name.slice(2));return original.call(this,name,parent,main)};
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const styles=require('../lib/learning-styles.ts'),{missions}=require('../lib/missions.ts');
test('all four approaches use approved material and leave the mission and scoring unchanged',()=>{
 for(const mission of missions){
  const before=JSON.stringify(mission),intros=new Set();
  for(const style of styles.learningStyleCodes){
   intros.add(styles.chatStyleIntro(mission,style,1));
   const lesson=styles.chatStyleLesson(mission,style);
   assert.ok(lesson.includes(mission.task));
   for(const fact of styles.lessonFacts(mission.lesson))assert.ok(lesson.includes(fact));
   assert.equal(JSON.stringify(mission),before);
  }
  assert.equal(intros.size,4);
 }
 assert.equal(styles.learningStyle('invalid'),'casual');assert.equal(styles.learningStyle(undefined),'casual');
});
test('website renders distinct accessible lesson views with every original task and example',()=>{
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),View=require('../components/whatslearn/styled-lesson.tsx').default,m=missions.find(x=>x.id==='d1');
 const views=new Set();
 for(const style of styles.learningStyleCodes){
  const html=renderToStaticMarkup(React.createElement(View,{mission:m,style,language:'en'}));
  views.add(html);assert.ok(html.includes('style-'+style));assert.ok(html.includes('aria-label='));assert.ok(html.includes('<summary>'));assert.ok(html.includes(m.example.replaceAll('&','&amp;').replaceAll('>','&gt;').replaceAll('<','&lt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;')));
 }
 assert.equal(views.size,4);
});
test('setup and settings save the account style and new missions open the chosen lesson view',()=>{
 const source=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');
 for(const f of ['app/find-my-path/page.tsx','app/profile-panel.tsx','app/settings/page.tsx'])assert.ok(source(f).includes('learningStyles'),f);
 const workspace=source('app/learn/workspace.tsx');assert.match(workspace,/<StyledLesson mission=\{active\} style=\{profile.style\}/);assert.match(workspace,/setStep\(saved\|\|draft\?1:0\)/);
 assert.ok(workspace.indexOf('<StyledLesson')<workspace.indexOf('<MiniChallenge key={active.id'));
});

test('all modes hand the real decision back to the mission assessment',()=>{
 const source=fs.readFileSync(path.resolve(__dirname,'../components/whatslearn/styled-lesson.tsx'),'utf8');
 assert.match(source,/correct=choice===mission.answer/);
 assert.match(source,/onAnswer\?\.\(i\)/);
 assert.match(source,/correct&&<div className="style-next-move"/);
 assert.match(source,/onClick=\{onContinue\}/);
 assert.doesNotMatch(source,/style-quest-steps|setInterval|Math.random|fetch\(/);
 const workspace=fs.readFileSync(path.resolve(__dirname,'../app/learn/workspace.tsx'),'utf8');
 assert.match(workspace,/choice=\{quiz\} onAnswer=\{value=>\{setQuiz\(value\)/);
 assert.match(workspace,/onContinue=\{\(\)=>setStep\(1\)\}/);
 assert.match(workspace,/Optional · 30-second side quest/);
});

test('mode interactions include real navigation and no pretend earned points',()=>{
 const source=fs.readFileSync(path.resolve(__dirname,'../components/whatslearn/styled-lesson.tsx'),'utf8');
 for(const label of ['Start quest','Okay, walk me through it','Let me try','Step into the story','Make the next move','Previous fact','Next fact','Check my understanding'])assert.ok(source.includes(label),label);
 assert.match(source,/onClick=\{\(\)=>setFact\(i\)\}/);
 assert.match(source,/Mission points are awarded when your completed work is saved/);
 assert.match(source,/No points lost/);
});
