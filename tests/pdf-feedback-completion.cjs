const test=require('node:test'),assert=require('node:assert/strict');
const h=require('./helpers/harness.cjs');
const {defaultProfile}=h.load('lib/personalization.ts'),{missions}=h.load('lib/missions.ts');
const {saveProfile,loadLearning}=h.load('lib/learning-service.ts'),{checkSkillPractice}=h.load('lib/skill-practice-service.ts');
const m=missions.find(m=>m.id==='m1');
function review(strong=false){return {summary:'The hook works; the audience needs narrowing.',strengths:['Your hot lunch before 11 hook gives a clear deadline.'],checks:m.checks.map((item,i)=>({item,met:strong||i!==0,note:i===0?'Name office workers near MG Road, not everyone.':'Supported in the work.'})),nextStep:'Narrow only the audience and test the revised line.',answerAssessment:{onTopic:true,correct:strong,reason:strong?'Specific and tested.':'Everyone is not a useful audience.'},practicalTest:{created:true,performed:true,reported:true,note:'The supplied work has a reported reader test.'}};}
async function setup(){h.reset({env:{OPENAI_API_KEY:'fake-pdf-practice'}});await saveProfile('pdf-learner',defaultProfile);h.db.prepare('INSERT INTO submission_reviews(user_id,mission_id,body_hash,review,created_at) VALUES (?,?,?,?,?)').run('pdf-learner','m1','weak-source',JSON.stringify(review()),new Date().toISOString());return (await loadLearning('pdf-learner')).path.remediation;}
test('weak audience selects an actual audience drill, tracks mistakes, accepts Kanglish, then stops repeating it',async()=>{
 const task=await setup();assert.equal(task.skill,'audience');assert.match(task.prompt,/Who exactly/);assert.match(task.scenario,/meal|lunch/i);let pass=false,requests=[];
 global.fetch=async(url,options)=>{requests.push(JSON.parse(options.body));return Response.json({choices:[{message:{content:JSON.stringify({accepted:pass,feedback:pass?'MG Road office workers — nanna audience specific, lunch beku ✅':'Everyone is too broad.',followUp:pass?'':'Who needs weekday lunch near MG Road?'})}}]})};
 for(let i=0;i<2;i++){const r=await checkSkillPractice('pdf-learner',task.key,'Everyone in Bengaluru wants food and a good lunch offer.');assert.equal(r.accepted,false);}
 let state=await loadLearning('pdf-learner');assert.match(state.path.remediation.prompt,/one concrete example/);assert.equal(state.skillPractice[0].mistakes,2);
 h.db.prepare('UPDATE learner_profiles SET language=? WHERE user_id=?').run('kn','pdf-learner');pass=true;const result=await checkSkillPractice('pdf-learner',task.key,'Nanna audience MG Road office workers, avarige weekday lunch beku andre quick hot meal offer maadi.');assert.equal(result.accepted,true);assert.equal(result.courseCompleted,false);assert.match(requests.at(-1).messages[0].content,/Kanglish/);
 state=await loadLearning('pdf-learner');assert.equal(state.path.remediation,null);assert.equal(state.path.skills.audience.demonstrated,true);assert.equal(state.skillPractice[0].attempts,3);assert.equal(state.work.length,0);assert.equal(h.db.prepare('SELECT count(*) n FROM mission_scores').get().n,0);assert.equal(h.db.prepare('SELECT count(*) n FROM ai_feedback_usage').get().n,0);
 await assert.rejects(()=>checkSkillPractice('pdf-learner',task.key,'A new answer must not reopen the already passed drill.'),e=>e.status===409);
 assert.equal((await loadLearning('unrelated-account')).skillPractice.length,0);
});
test('practice provider failure, stale task and junk never claim assessment or completion',async()=>{
 const task=await setup();let calls=0;global.fetch=async()=>{calls++;return new Response('{}',{status:500})};
 await assert.rejects(()=>checkSkillPractice('pdf-learner','not-current','A genuine answer for a stale task.'),e=>e.status===409);assert.equal(calls,0);
 await assert.rejects(()=>checkSkillPractice('pdf-learner',task.key,'asdf'),e=>e.status===422);assert.equal(calls,0);
 await assert.rejects(()=>checkSkillPractice('pdf-learner',task.key,'Office workers near MG Road need weekday lunch.'),e=>e.status===502);assert.equal((await loadLearning('pdf-learner')).skillPractice.length,0);assert.ok((await loadLearning('pdf-learner')).path.remediation);
 const api=h.load('app/api/skill-practice/route.ts');assert.equal((await api.POST(h.req('/api/skill-practice',{body:{key:task.key,answer:'Office workers near MG Road need weekday lunch.'}}))).status,401);assert.equal((await api.POST(h.req('/api/skill-practice',{origin:'https://evil.test',body:{key:task.key,answer:'Office workers need lunch.'}}))).status,403);
});
test('weak work → targeted practice → revised creation → one save → harder next task → WhatsApp uses the same context',async()=>{
 const task=await setup();global.fetch=async(url,options)=>{const system=JSON.parse(options.body).messages[0].content;return Response.json({choices:[{message:{content:JSON.stringify(system.includes('conversation, not a form')?{accepted:true,feedback:'MG Road office workers makes the audience specific.',followUp:''}:review(true))}}]})};
 await checkSkillPractice('pdf-learner',task.key,'MG Road office workers who need weekday lunch before their next meeting.');
 const body=require('./fixtures/course-samples.json').m1,data={missionId:'m1',body,quiz:m.answer,checks:m.checks.map(()=>true)};
 const save=h.load('lib/mission-points.ts').saveMissionWork;assert.equal((await save('pdf-learner',data)).saved,true);assert.equal((await save('pdf-learner',data)).saved,true);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM mission_scores WHERE user_id=?').get('pdf-learner').n,1);
 const state=await loadLearning('pdf-learner');assert.equal(state.path.nextMissionId,'m2');assert.equal(state.path.practiceLevel,'experienced');assert.equal(state.path.progress.creations,1);assert.equal(state.path.remediation,null);
 const stamp=new Date().toISOString(),phone='919876540020';h.db.prepare("INSERT INTO whatsapp_contacts(user_id,phone,state,language,verified_at,consent_at,updated_at) VALUES (?,?,'opted_in','en',?,?,?)").run('pdf-learner',phone,stamp,stamp,stamp);
 const out=await h.load('lib/bridge/whatsapp-chat.ts').handleBridgeMessage({wamid:'pdf-shared-progress',from:phone,type:'text',text:'TODAY'});assert.match(out.text,/1\/10 creations saved/);assert.ok(out.text.includes(state.path.challenge.title));assert.equal((await loadLearning('pdf-learner')).work[0].body,body);
});
test('revision rewards require a demonstrated criterion improvement, not a cosmetic edit; retry grants once',async()=>{
 h.reset();const {saveCreation}=h.load('lib/save-creation.ts'),base={missionId:'m1',body:'Original practical creation with a real audience test.',quiz:m.answer,checks:m.checks.map(()=>true)};
 const older={...review(true),checks:m.checks.map((item,i)=>({item,met:i!==0,note:'Earlier reviewed criterion.'}))};
 await saveCreation('revision-quality',{...base,evaluation:JSON.stringify(older)});
 await saveCreation('revision-quality',{...base,body:base.body+' Cosmetic wording.',reflection:'I changed a few words for style.',evaluation:JSON.stringify(older)});
 assert.equal(h.db.prepare("SELECT count(*) n FROM practice_events WHERE user_id=? AND kind='revision'").get('revision-quality').n,0);
 for(let i=0;i<3;i++)await saveCreation('revision-quality',{...base,body:base.body+' Narrowed audience after testing.',reflection:'I narrowed the audience and checked the revised line.',evaluation:JSON.stringify(review(true))});
 assert.equal(h.db.prepare("SELECT count(*) n FROM practice_events WHERE user_id=? AND kind='revision'").get('revision-quality').n,1);
});

test('legacy generic checklist labels use the actual reviewer correction in the drill',()=>{const {skillTask}=h.load('lib/skill-practice.ts');const task=skillTask('d1','Write one user story','A forced 503 must show only failure, never success.','legacy');assert.match(task.prompt,/503/);assert.match(task.criterion,/never success/);assert.doesNotMatch(task.prompt,/Revise only.*user story/);});
