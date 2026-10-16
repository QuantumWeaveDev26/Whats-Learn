const test=require('node:test'),assert=require('node:assert/strict');
const h=require('./helpers/harness.cjs');
const {missions}=h.load('lib/missions.ts'),{needsMembership}=h.load('lib/mission-access.ts'),{canUseMission}=h.load('lib/mission-access-server.ts');
const {saveMissionWork,recordClue}=h.load('lib/mission-points.ts'),{reviewedSubmission}=h.load('lib/submission-review.ts'),{missionPractice}=h.load('lib/mission-practice.ts');
const samples=require('./fixtures/course-samples.json');
const input=id=>({missionId:id,body:samples[id],checks:[true,true,true,true,true],quiz:missions.find(m=>m.id===id).answer});
const grant=id=>h.db.prepare("INSERT OR REPLACE INTO entitlements(session_id,user_id,mode,sku,status,ends_at,updated_at) VALUES (?,?,'reward','plus_monthly','active','2999-01-01T00:00:00Z',?)").run('access-'+id,id,new Date().toISOString());
const prime=(id,track)=>{for(const m of missions.filter(m=>m.track===track).slice(0,3))h.db.prepare('INSERT INTO work(user_id,mission_id,body,checks,quiz,updated_at) VALUES (?,?,?,?,?,?)').run(id,m.id,samples[m.id],'[true,true,true,true,true]',String(m.answer),new Date().toISOString());h.db.prepare('INSERT INTO checkpoint_clears VALUES (?,?,?,?)').run(id,track,2,new Date().toISOString())};
test('each course has exactly three free missions, with independent trials',async()=>{
 h.reset();for(const track of ['marketing','development','filmmaking','storytelling']){
  const list=missions.filter(m=>m.track===track);assert.equal(list.filter(m=>!needsMembership(m)).length,3);
  for(let i=0;i<10;i++){assert.equal(await canUseMission('explorer',list[i].id),i<3);assert.equal(needsMembership(list[i],true),false)}
 }
});
test('free accounts cannot save, use a clue or spend AI allowance on mission four',async()=>{
 h.reset({env:{OPENAI_API_KEY:'fake-only'}});const real=global.fetch;let calls=0;global.fetch=async()=>{calls++;throw new Error('Must not call provider')};
 try{for(const id of ['m4','d4','f4','v4']){
  assert.equal((await saveMissionWork('explorer',input(id))).code,403);
  assert.equal((await recordClue('explorer',id,'hint')).allowed,false);
  await assert.rejects(reviewedSubmission('explorer',id,samples[id]),/missions 1–3/);
 }assert.equal(calls,0);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM work').get().n,0);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM ai_feedback_usage').get().n,0)}finally{global.fetch=real}
});
test('active access unlocks later missions; expiry/cancellation block further saves but preserve work',async()=>{
 h.reset();grant('paid');prime('paid','marketing');assert.equal(await canUseMission('paid','m4'),true);
 const saved=await saveMissionWork('paid',input('m4'));assert.equal(saved.saved,true,saved.message);
 h.db.prepare("UPDATE entitlements SET ends_at='2000-01-01T00:00:00Z' WHERE user_id='paid'").run();assert.equal(await canUseMission('paid','m4'),false);
 assert.equal((await saveMissionWork('paid',input('m4'))).code,403);assert.equal(h.db.prepare("SELECT COUNT(*) n FROM work WHERE user_id='paid'").get().n,4);
 grant('paid');h.db.prepare("UPDATE entitlements SET status='cancelled' WHERE user_id='paid'").run();assert.equal(await canUseMission('paid','m4'),false);
});
test('every mission names a distinct practical outcome and a concrete trial',()=>{
 for(const m of missions){const p=missionPractice(m);assert.ok(p.outcome.length>10,m.id);assert.ok(p.trial.length>80,m.id);assert.ok(p.day>=1&&p.day<=10)}
 for(const track of ['marketing','development','filmmaking','storytelling'])assert.equal(new Set(missions.filter(m=>m.track===track).map(m=>missionPractice(m).outcome)).size,10);
});
test('AI completion requires reported practical evidence even when all five checks are met',async()=>{
 h.reset({env:{OPENAI_API_KEY:'fake-only'}});const real=global.fetch;let reported=false;
 global.fetch=async()=>Response.json({choices:[{message:{content:JSON.stringify({summary:'Clear offer.',strengths:[],checks:missions.find(m=>m.id==='m1').checks.map(item=>({item,met:true,note:'Present.'})),practicalTest:{created:true,performed:reported,reported,note:reported?'Actual offer, timed reading result and revised copy.':'Add a specific test, result and improvement.'},nextStep:'Try it with a reader.'})}}]});
 try{const first=await saveMissionWork('test-evidence',input('m1'));assert.equal(first.code,422);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM mission_scores').get().n,0);
  reported=true;const next=await saveMissionWork('test-evidence',{...input('m1'),body:samples.m1.replace('\n\n### Link','\nI timed a five-second reading. The next action was unclear, so I changed the last line to View the menu.\n\n### Link')});assert.equal(next.saved,true,next.message);assert.equal(next.score.practical,75);
 }finally{global.fetch=real}
});
test('WhatsApp stops after the same three free missions and honours paid access and expiry',async()=>{
 h.reset();const id='wa-trial',phone='919000000001',stamp=new Date().toISOString();prime(id,'marketing');
 h.db.prepare("INSERT INTO whatsapp_contacts(user_id,phone,state,language,consent_at,updated_at,verified_at,last_inbound_at) VALUES (?,?,'opted_in','en',?,?,?,?)").run(id,phone,stamp,stamp,stamp,stamp);
 const {handleBridgeMessage}=h.load('lib/bridge/whatsapp-chat.ts');
 let n=0;const say=()=>handleBridgeMessage({wamid:'wamid-local-trial-'+(++n),from:phone,text:'TODAY'});
 let r=await say();assert.match(r.text,/first 3 missions are done/);assert.match(r.text,/membership/);
 grant(id);r=await say();assert.doesNotMatch(r.text,/Choose an active paid plan/);assert.match(r.text,/Question 1/);
 h.db.prepare("UPDATE entitlements SET ends_at='2000-01-01T00:00:00Z' WHERE user_id=?").run(id);r=await say();assert.match(r.text,/Choose an active paid plan/);assert.doesNotMatch(r.text,/Question 1/);
});

 test('theory cannot pass review without a created artifact and a performed test',async()=>{
  h.reset({env:{OPENAI_API_KEY:'fake-only'}});const real=global.fetch;
  const {reviewWork}=h.load('lib/ai-feedback.ts');
  try{for(const [created,performed] of [[false,false],[true,false],[false,true],[true,true]]){
   global.fetch=async(url,options)=>{const prompt=JSON.parse(options.body).messages[0].content;
    assert.match(prompt,/manual code trace/);assert.match(prompt,/actual artifact/);assert.match(prompt,/invented/);
    return Response.json({choices:[{message:{content:JSON.stringify({summary:'Evidence checked.',strengths:[],checks:missions.find(m=>m.id==='m1').checks.map(item=>({item,met:true,note:'Present.'})),practicalTest:{created,performed,reported:true,note:'Evidence classification.'},nextStep:'Make and test the artifact.'})}}]});
   };
   const review=await reviewWork('m1',samples.m1,'en');assert.equal(review.practicalTest.reported,created&&performed);
  }}finally{global.fetch=real}
 });
 test('every mission task includes actual hands-on completion and rejects theoretical substitutes',()=>{
  for(const m of missions){assert.match(m.task,/Hands-on completion:/,m.id);assert.match(m.task,/actual test\/run results/,m.id);assert.match(m.task,/manual walkthroughs alone do not complete/,m.id)}
 });
