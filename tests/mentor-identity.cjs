const test=require('node:test'),assert=require('node:assert/strict');
const h=require('./helpers/harness.cjs');let seq=0;
const phone='919990000081',uid='mentor-name-test';
async function setup(name='Pavana'){
 h.reset({env:{OPENAI_API_KEY:'fake-name-test'}});h.db.exec('DELETE FROM whatsapp_events; DELETE FROM whatsapp_drafts');
 await h.load('lib/learning-service.ts').saveProfile(uid,{...h.load('lib/personalization.ts').defaultProfile,track:'development'});
 const old='2026-01-01T00:00:00Z';h.db.prepare("INSERT INTO whatsapp_contacts(user_id,phone,state,language,verified_at,consent_at,last_inbound_at,updated_at,display_name) VALUES (?,?,'opted_in','en',?,?,?,?,?)").run(uid,phone,old,old,old,old,name);
 global.fetch=async()=>Response.json({choices:[{message:{content:'A keyframe records one position in an animation. Set two and preview the movement between them.'}}]});
}
const say=text=>h.load('lib/bridge/whatsapp-chat.ts').handleBridgeMessage({wamid:'name-'+Date.now()+'-'+(++seq),from:phone,text,type:'text'});
test('greeting and performance use the verified linking name when website display name is absent',async()=>{
 await setup();assert.match((await say('Hello')).text,/Hey Pavana!/);assert.equal((await h.load('lib/learner-performance.ts').learnerPerformance(uid)).name,'Pavana');assert.match((await say('show my progress')).text,/Pavana/);
});
test('follow-up answers do not have the learner name forced onto every reply',async()=>{
 await setup();await say('Hello');const first=await say('What is a keyframe?');assert.doesNotMatch(first.text,/^Pavana,/);assert.match(first.text,/keyframe/);const second=await say('How do I preview it?');assert.doesNotMatch(second.text,/^Pavana,/);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM work').get().n,0);
});
test('continuing an open mission preserves its exact draft without another greeting',async()=>{
 await setup();await say('TODAY');const before=h.db.prepare('SELECT body FROM whatsapp_drafts WHERE user_id=?').get(uid).body;const result=await say('TODAY');assert.doesNotMatch(result.text,/Pavana/);assert.equal(h.db.prepare('SELECT body FROM whatsapp_drafts WHERE user_id=?').get(uid).body,before);
});
test('website name wins; formatting and email addresses never become a greeting',async()=>{
 await setup('Account name');h.db.prepare('UPDATE learner_profiles SET display_name=? WHERE user_id=?').run('  Pavana\n*_Rao*  ',uid);let p=await h.load('lib/learner-performance.ts').learnerPerformance(uid);assert.equal(p.name,'Pavana Rao');
 h.db.prepare('UPDATE learner_profiles SET display_name=? WHERE user_id=?').run('private@example.test',uid);p=await h.load('lib/learner-performance.ts').learnerPerformance(uid);assert.equal(p.name,'Account name');
});
test('ordinary mentor instructions allow natural addressing and carry the adaptive next-task reason',async()=>{
 await setup();let sent;global.fetch=async(url,o)=>{sent=JSON.parse(o.body);return Response.json({choices:[{message:{content:'Try one feature first, then test a failure case.'}}]})};await say('Why is this my next task?');assert.doesNotMatch(sent.messages[0].content,/No greeting,/);const account=JSON.parse(sent.messages[1].content).account;assert.equal(account.name,'Pavana');assert.ok(account.learning.nextTask.reason);assert.ok(account.learning.firstChallengeWhy);assert.doesNotMatch(JSON.stringify(account.currentTask),/"answer"|"explanation"/);
});
test('short names are not mistaken for part of an ordinary word',()=>{
 const {addressLearner}=h.load('lib/learner-name.ts');assert.equal(addressLearner('A program needs one clear action.','Ram'),'Ram, A program needs one clear action.');assert.equal(addressLearner('Hey Ram! Ready?','Ram'),'Hey Ram! Ready?');assert.equal(addressLearner('Pavana Rao, try one action.','Pavana Rao'),'Pavana Rao, try one action.');
});
