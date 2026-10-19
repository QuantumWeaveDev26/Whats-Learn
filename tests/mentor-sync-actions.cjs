const test=require('node:test'),assert=require('node:assert/strict');
const h=require('./helpers/harness.cjs');const uid='mentor-synced',phone='919990000087';let seq=0,calls=[];
async function setup(){
 h.reset({env:{OPENAI_API_KEY:'fake-semantic'}});h.db.exec('DELETE FROM whatsapp_events; DELETE FROM learner_context');
 await h.load('lib/learning-service.ts').saveProfile(uid,{...h.load('lib/personalization.ts').defaultProfile,track:'development'});
 h.db.prepare('UPDATE learner_profiles SET display_name=? WHERE user_id=?').run('Pavana',uid);
 const at=new Date().toISOString();h.db.prepare("INSERT INTO whatsapp_contacts(user_id,phone,state,language,consent_at,verified_at,last_inbound_at,updated_at) VALUES (?,?,'opted_in','en',?,?,?,?)").run(uid,phone,at,at,at,at);
 await h.load('lib/learner-context-store.ts').finishContext(uid,{ageBand:'18-24',stage:'student',hobbies:['gaming'],interests:['sports'],project:'Make a cricket scores app',barrier:'jargon',device:'phone'});
 calls=[];
}
const say=text=>h.load('lib/bridge/whatsapp-chat.ts').handleBridgeMessage({wamid:'semantic-'+Date.now()+'-'+(++seq),from:phone,text,type:'text'});
test('screenshot points, journey and completion-permission phrases use actual account functions',async()=>{
 await setup();provider('question');await say('TODAY');calls=[];
 const points=await say("What's my point");assert.ok(points.text.includes("Points: "+(await h.load("lib/mission-points.ts").loadScores(uid)).balance));assert.doesNotMatch(points.text,/rewards|redeem|looks strong/);
 const journey=await say("Where's my journey in whatslearn");assert.match(journey.text,/\/learn/);assert.match(journey.text,/10-day foundation/);
 const before=h.db.prepare('SELECT body FROM whatsapp_drafts WHERE user_id=?').get(uid).body;
 for(const text of ['Ok now I wanna finish my mission','Can i finish the task now']){const out=await say(text);assert.equal(out.action,'reply');assert.doesNotMatch(out.text,/looks strong|503|fixed|approved/i);}
 assert.equal(calls.length,0);assert.equal(h.db.prepare('SELECT body FROM whatsapp_drafts WHERE user_id=?').get(uid).body,before);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM work').get().n,0);
});
function provider(kind='question',answer='We can take this one step at a time. Which part would you like help with?'){
 global.fetch=async(url,o)=>{const r=JSON.parse(o.body);calls.push(r);return Response.json({choices:[{message:{content:r.messages[0].content.startsWith('Classify the meaning')?JSON.stringify({kind,track:null}):answer}}]})};
}
test('style requests do not assess or mutate a draft; edit and question requests return real account prompts',async()=>{
 await setup();await say('TODAY');const before=h.db.prepare('SELECT body FROM whatsapp_drafts WHERE user_id=?').get(uid).body;
 provider('answer','Got it—just one emoji and no rushing.');
 for(const text of ['I need to be learn different and genz style','Add some emojis too','Not too many just few is enough','But u rushing?']){
  const out=await say(text);assert.equal(out.action,'reply');assert.match(out.text,/no rushing/);const account=JSON.parse(calls.at(-1).messages[1].content).account;assert.equal(account.draft,'');assert.equal(account.learning.feedback,null);
 }
 assert.equal(h.db.prepare('SELECT body FROM whatsapp_drafts WHERE user_id=?').get(uid).body,before);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM ai_feedback_usage').get().n,0);
 const edit=await say('I need to edit that');assert.match(edit.text,/Which part/);assert.match(edit.text,/EDIT 2/);
 const q=await say('Tell me the qns');assert.match(q.text,/When should a booking page say Booking saved/);assert.doesNotMatch(q.text,/Write the feature brief/);
 const p=await say('PROFILE');assert.equal(typeof p.context.currentPrompt.text,'string');assert.equal(p.context.currentPrompt.missionId,'d1');
});
test('fresh snapshots include all-course status, personal setup and observed practice without another account or an answer key',async()=>{
 await setup();const m=h.load('lib/missions.ts').missions.find(m=>m.id==='m1');const at=new Date().toISOString();
 h.db.prepare('INSERT INTO work(user_id,mission_id,body,checks,quiz,updated_at) VALUES (?,?,?,?,?,?)').run(uid,m.id,'An accepted creation',JSON.stringify([true,true,true,true,true]),m.answer,at);
 await say('TODAY');const ctx=await h.load('lib/mentor.ts').mentorContext(uid);
 assert.equal(ctx.name,'Pavana');assert.equal(ctx.preferences.project,'Make a cricket scores app');assert.deepEqual(ctx.preferences.hobbies,['gaming']);assert.equal(ctx.courses.length,4);
 assert.equal(ctx.courses.find(c=>c.id==='marketing').savedMissions,1);assert.equal(ctx.courses.find(c=>c.id==='marketing').pending.length,9);assert.equal(ctx.progress.totalSavedMissions,1);assert.equal(ctx.whatsapp.draft.status,'draft');
 assert.equal(ctx.observedPractice.style,'casual');assert.match(ctx.observedPractice.source,/not inferred/);assert.doesNotMatch(JSON.stringify(ctx),/18-24|919990000087|"answer"|"explanation"/);
 const other=await h.load('lib/mentor.ts').mentorContext('another-learner');assert.equal(other.name,'');assert.equal(other.preferences,null);assert.equal(other.progress.totalSavedMissions,0);assert.equal(other.whatsapp.draft,null);
 await h.load('lib/learning-service.ts').saveProfile(uid,{...ctx.profile,track:'filmmaking',style:'story',language:'kn'});
 const fresh=await h.load('lib/mentor.ts').mentorContext(uid);assert.equal(fresh.profile.track,'filmmaking');assert.equal(fresh.profile.language,'kn');assert.equal(fresh.observedPractice.style,'story');assert.equal(fresh.courses.find(c=>c.id==='marketing').savedMissions,1);
});
test('indirect resume and pause requests do not become task answers or complete work',async()=>{
 await setup();await say('TODAY');const before=h.db.prepare('SELECT body FROM whatsapp_drafts WHERE user_id=?').get(uid).body;
 provider('continue');let out=await say('Can we pick up from yesterday?');assert.equal(out.action,'reply');assert.doesNotMatch(out.text,/Pavana/);assert.equal(h.db.prepare('SELECT body FROM whatsapp_drafts WHERE user_id=?').get(uid).body,before);
 provider('keep-draft');out=await say('Gotta run, hold my place till tomorrow');assert.match(out.text,/already kept/);assert.equal(h.db.prepare('SELECT body FROM whatsapp_drafts WHERE user_id=?').get(uid).body,before);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM work').get().n,0);
});
test('an indirect completion request still cannot skip practical work or correctness checks',async()=>{
 await setup();await say('TODAY');provider('save');const out=await say('Ready to hand this in for the final check');assert.equal(out.action,'reply');assert.match(out.text,/not complete yet/);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM work').get().n,0);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM mission_scores').get().n,0);
});
test('unclear chat and an unrelated question stay out of practical answers without repeating the saved name',async()=>{
 await setup();await say('TODAY');const before=h.db.prepare('SELECT body FROM whatsapp_drafts WHERE user_id=?').get(uid).body;
 provider('question','Did you mean where to start, or something else?');const out=await say('Wia');assert.doesNotMatch(out.text,/^Pavana,/);assert.match(out.text,/Did you mean/);assert.equal(h.db.prepare('SELECT body FROM whatsapp_drafts WHERE user_id=?').get(uid).body,before);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM ai_feedback_usage').get().n,0);
 assert.match(calls.at(-1).messages[0].content,/real-world example|real.world example/);assert.match(calls.at(-1).messages[0].content,/Stay calm/);
});
test('website AI failure hands WhatsApp to n8n with current account context rather than a dead-end reply',async()=>{
 await setup();await say('TODAY');global.fetch=async()=>Response.json({error:'busy'},{status:503});const out=await say('ASK explain an API with a cricket example');assert.equal(out.action,'tutor');assert.equal(out.material.name,'Pavana');assert.deepEqual(out.material.preferences.interests,['sports']);assert.equal(out.material.courses.length,4);assert.match(out.question,/cricket/);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM work').get().n,0);
});
test('a failed shortening request preserves a usable answer instead of showing a generic failure',async()=>{
 await setup();let n=0;const answer='An API lets two apps exchange information. A cricket scoreboard asks the server for the latest score, then displays the reply. It should show an error if the request fails instead of inventing runs. Start by asking for one score and checking the response before updating the screen.';
 global.fetch=async()=>++n===1?Response.json({choices:[{message:{content:answer}}]}):Response.json({error:'busy'},{status:503});const out=await say('ASK what is an API?');assert.equal(out.action,'reply');assert.match(out.text,/scoreboard/);assert.doesNotMatch(out.text,/couldn.t finish/);
});
test('a website course edit is visible on the next WhatsApp message and preserves the old chat draft as a revision',async()=>{
 await setup();await say('TODAY');const original=h.db.prepare('SELECT body FROM whatsapp_drafts WHERE user_id=?').get(uid).body;
 await h.load('lib/learning-service.ts').saveProfile(uid,{...h.load('lib/personalization.ts').defaultProfile,track:'filmmaking',style:'story'});
 provider('question','Start with a character who wants something.');await say('ASK what should I work on now?');const ctx=JSON.parse(calls.at(-1).messages[1].content).account;
 assert.equal(ctx.profile.track,'filmmaking');assert.match(ctx.currentTask.id,/^f/);assert.equal(ctx.draft,'');assert.equal(h.db.prepare('SELECT body FROM whatsapp_saved_drafts WHERE user_id=? AND mission_id=?').get(uid,'d1').body,original);
});
test('the signed PROFILE contract carries fresh private context without replacing the last mentor exchange',async()=>{
 await setup();provider();await say('ASK what is an API?');const before=await h.load('lib/mentor-conversation.ts').recentMentorTurn(uid,'whatsapp','d1');
 const out=await h.load('lib/bridge/whatsapp-chat.ts').handleBridgeMessage({wamid:'mentor-profile:fixture',from:phone,type:'text',text:'PROFILE'});
 assert.equal(out.action,'reply');assert.equal(out.context.name,'Pavana');assert.deepEqual(out.context.preferences.hobbies,['gaming']);assert.equal(out.context.courses.length,4);
 assert.deepEqual(await h.load('lib/mentor-conversation.ts').recentMentorTurn(uid,'whatsapp','d1'),before);
});
