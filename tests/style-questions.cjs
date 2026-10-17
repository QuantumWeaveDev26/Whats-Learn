const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const h=require('./helpers/harness.cjs');
const {missions}=h.load('lib/missions.ts'),{missionForLevel}=h.load('lib/mission-levels.ts'),{questionForStyle}=h.load('lib/style-questions.ts');
const modes=['casual','game','story','facts'];
test('every mission and starting level has four distinct questions without changing answer keys or saved work',()=>{
 for(const base of missions)for(const level of ['beginner','practising','experienced']){
  const m=missionForLevel(base,level),before=JSON.stringify(m),qs=modes.map(style=>questionForStyle(m,style));
  assert.equal(new Set(qs).size,4,base.id+' '+level);
  assert.ok(qs.every(q=>q.length>20));assert.equal(questionForStyle(m,'invalid'),m.question);
  assert.equal(JSON.stringify(m),before);assert.equal(m.answer,base.answer);assert.ok(m.options[m.answer]);
 }
});
test('novice questions reflect the mission concept rather than style headings alone',()=>{
 const m=missionForLevel(missions.find(m=>m.id==='d1'),'beginner');
 assert.match(questionForStyle(m,'game'),/saving is still running/);assert.match(questionForStyle(m,'story'),/parent taps Book/);assert.match(questionForStyle(m,'facts'),/Which event is required/);
 assert.doesNotMatch(questionForStyle(m,'game'),new RegExp(m.question.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 const branch=missionForLevel(missions.find(m=>m.id==='d9'),'beginner');assert.match(questionForStyle(branch,'game'),/separate branch/);
});
test('applied and stretch variants retain exact scenario evidence, numbers and constraints',()=>{
 const base=missions.find(m=>m.id==='m7');
 for(const level of ['practising','experienced']){
  const m=missionForLevel(base,level);for(const mode of modes){const q=questionForStyle(m,mode);for(const n of m.question.match(/\d[\d,]*%?/g)||[])assert.ok(q.includes(n),level+' '+mode+' '+n);}
 }
});
test('onboarding previews use the selected style and match the lesson question',()=>{
 require.extensions['.tsx']=require.extensions['.ts'];const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),Preview=h.load('components/whatslearn/level-question-preview.tsx').default;
 const outputs=modes.map(style=>renderToStaticMarkup(React.createElement(Preview,{track:'development',level:'beginner',language:'en',style})));
 assert.equal(new Set(outputs).size,4);assert.match(outputs[1],/saving is still running/);
 const source=fs.readFileSync('app/find-my-path/page.tsx','utf8');assert.equal((source.match(/<LevelQuestionPreview[^>]*style=\{profile.style\}/g)||[]).length,2);
 for(const f of ['app/learn/workspace.tsx','components/whatslearn/styled-lesson.tsx'])assert.match(fs.readFileSync(f,'utf8'),/<StyleInteraction/,f);assert.match(fs.readFileSync('lib/bridge/whatsapp-chat.ts','utf8'),/interactionPrompt\(/);
});
test('WhatsApp uses the selected question while keeping canonical letter validation',async()=>{
 h.reset();const {saveProfile}=h.load('lib/learning-service.ts'),{handleBridgeMessage}=h.load('lib/bridge/whatsapp-chat.ts');
 const outputs=[];
 for(let i=0;i<modes.length;i++){
  const id='style-question-'+i,phone='91900000007'+i,stamp=new Date().toISOString();
  await saveProfile(id,{track:'development',level:'beginner',language:'en',goal:'job',minutes:'15',style:modes[i]});
  h.db.prepare("INSERT INTO whatsapp_contacts(user_id,phone,state,language,verified_at,consent_at,updated_at) VALUES (?,?,'opted_in','en',?,?,?)").run(id,phone,stamp,stamp,stamp);
  const out=await handleBridgeMessage({wamid:'different-style-'+i,from:phone,type:'text',text:'TODAY'});assert.equal(out.action,'reply');outputs.push(out.text);
  const m=missionForLevel(missions.find(m=>m.id==='d1'),'beginner');const interactions=h.load('lib/style-interactions.ts');assert.ok(out.text.includes(interactions.interactionPrompt(m,interactions.initialStyleState(modes[i]))));
 }
 assert.equal(new Set(outputs).size,4);
 assert.equal(h.db.prepare('SELECT count(*) n FROM mission_scores').get().n,0);
});
