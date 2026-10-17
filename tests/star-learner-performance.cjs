const test=require('node:test'),assert=require('node:assert/strict');
const h=require('./helpers/harness.cjs');
const {missions}=h.load('lib/missions.ts'),{starLearnerProgress}=h.load('lib/course-titles.ts');
const done=new Set(missions.filter(m=>m.track==='development').map(m=>m.id));
const perfect=()=>[...done].map((mission_id,i)=>({mission_id,clues:0,points:100,day:`2026-10-${String(i+1).padStart(2,'0')}`}));
test('Star Learner recognises completed course work despite clues, imperfect scores or breaks',()=>{
 const scores=perfect();assert.equal(starLearnerProgress('development',done,scores).earned,true);
 for(const change of [s=>s.pop(),s=>s[3].points=85,s=>s[3].clues=1,s=>s[9].day='2026-10-12',s=>delete s[3].points]){
  const altered=perfect();change(altered);assert.equal(starLearnerProgress('development',done,altered).earned,true);
 }
 assert.equal(starLearnerProgress('development',new Set([...done].slice(0,9)),scores).earned,false);
 assert.equal(starLearnerProgress('marketing',done,scores).earned,false);
});
test('performance reads saved account progress without awarding or changing points',async()=>{
 h.reset();const {saveProfile}=h.load('lib/learning-service.ts');await saveProfile('p',{goal:'job',track:'development',level:'beginner',language:'en',minutes:'15',style:'game'});
 h.db.prepare("UPDATE learner_profiles SET display_name='Pavana' WHERE user_id='p'").run();
 for(const s of perfect()){
  h.db.prepare("INSERT INTO work(user_id,mission_id,body,checks,quiz,updated_at) VALUES (?,?,?,'[]','0',?)").run('p',s.mission_id,'QA artifact',s.day+'T10:00:00Z');
  h.db.prepare("INSERT INTO mission_scores(user_id,mission_id,day,understanding,practical,clues,deduction,points,created_at) VALUES (?,?,?,25,75,0,0,100,?)").run('p',s.mission_id,s.day,s.day+'T10:00:00Z');
 }
 const {learnerPerformance}=h.load('lib/learner-performance.ts');const r=await learnerPerformance('p',new Date('2026-10-10T12:00:00Z'));
 assert.equal(r.star.earned,true);assert.equal(r.count,10);assert.equal(r.weekMissions,7);assert.equal(r.todayPoints,100);assert.match(r.text,/Pavana/);assert.match(r.text,/Star Learner/);assert.ok(r.text.length<650);
 const before=h.db.prepare('SELECT count(*) n FROM mission_scores').get().n;await learnerPerformance('p',new Date('2026-10-11T12:00:00Z'));assert.equal(h.db.prepare('SELECT count(*) n FROM mission_scores').get().n,before);
});
test('daily recaps honour opt-in, quiet hours, completed days and template boundaries',async()=>{
 h.reset();const {saveProfile}=h.load('lib/learning-service.ts');await saveProfile('daily-recap',{goal:'job',track:'marketing',level:'beginner',language:'en',minutes:'15',style:'casual'});
 const stamp='2026-10-10T12:00:00Z';h.db.prepare("INSERT INTO whatsapp_contacts(user_id,phone,state,language,consent_at,updated_at,verified_at,last_inbound_at,remind_state,remind_hour,remind_freq,quiet_start,quiet_end) VALUES ('daily-recap','919000000099','opted_in','en',?,?,?,?,'on',19,'daily',22,7)").run(stamp,stamp,stamp,stamp);
 h.db.prepare("INSERT INTO mission_scores(user_id,mission_id,day,understanding,practical,clues,deduction,points,created_at) VALUES ('daily-recap','m1','2026-10-10',25,75,0,0,100,?)").run(stamp);
 const {claimReminders}=h.load('lib/bridge/whatsapp-jobs.ts');const at=new Date('2026-10-10T13:35:00Z');
 const first=await claimReminders(50,at);assert.equal(first.items.length,1);assert.match(first.items[0].text,/0\/10 creations saved/);assert.match(first.items[0].text,/Next:/);assert.match(first.items[0].text,/POINTS.*optional reward/);assert.doesNotMatch(first.items[0].text,/balance|streak|Last 7 days/);assert.match(first.items[0].text,/REMIND OFF/);
 assert.equal((await claimReminders(50,at)).items.length,0,'no duplicate recap');
 h.db.prepare("UPDATE whatsapp_contacts SET last_inbound_at='2026-10-01T00:00:00Z'").run();
 assert.equal((await claimReminders(50,new Date('2026-10-11T13:35:00Z'))).items.length,0,'no approved recap template: skip outside window');
 h.env.WHATSAPP_PERFORMANCE_TEMPLATE='approved_fixture';const templated=await claimReminders(50,new Date('2026-10-12T13:35:00Z'));assert.equal(templated.items[0].mode,'template');assert.equal(templated.items[0].template.params.length,4);
 assert.equal((await claimReminders(50,new Date('2026-10-13T17:00:00Z'))).items.length,0,'quiet hours');
 h.db.prepare("UPDATE whatsapp_contacts SET state='opted_out'").run();assert.equal((await claimReminders(50,new Date('2026-10-14T13:35:00Z'))).items.length,0,'STOP respected');
});

test('short approved progress template uses saved count and the actual next task, keeping legacy templates intact',async()=>{
 h.reset({env:{WHATSAPP_PROGRESS_TEMPLATE:'whatslearn_progress_v2',WHATSAPP_PERFORMANCE_TEMPLATE:'legacy_four_metrics',WHATSAPP_TEMPLATE_LANGUAGE:'en'}});
 const {saveProfile,loadLearning}=h.load('lib/learning-service.ts');await saveProfile('short-recap',{goal:'job',track:'development',level:'experienced',language:'en',minutes:'15',style:'casual'});
 const stamp='2026-10-01T00:00:00Z';h.db.prepare("INSERT INTO whatsapp_contacts(user_id,phone,state,language,consent_at,updated_at,verified_at,last_inbound_at,remind_state,remind_hour,remind_freq,quiet_start,quiet_end) VALUES ('short-recap','919000000098','opted_in','en',?,?,?,?,'on',19,'daily',22,7)").run(stamp,stamp,stamp,stamp);
 const path=(await loadLearning('short-recap')).path;const jobs=h.load('lib/bridge/whatsapp-jobs.ts');const out=await jobs.claimReminders(50,new Date('2026-10-12T13:35:00Z'));
 assert.equal(out.items.length,1);assert.equal(out.items[0].template.name,'whatslearn_progress_v2');assert.deepEqual(out.items[0].template.params,['0',path.challenge.title]);assert.equal((await jobs.claimReminders(50,new Date('2026-10-12T13:35:00Z'))).items.length,0);
});
