const test=require('node:test'),assert=require('node:assert/strict');
const h=require('./helpers/harness.cjs');
const {learningPath}=h.load('lib/learning-engine.ts');
const {defaultProfile}=h.load('lib/personalization.ts');
const {missions}=h.load('lib/missions.ts');
const {feedbackSummary,reviewAccepted}=h.load('lib/review-summary.ts');
const {loadEvidence}=h.load('lib/learning-memory.ts');
const m=missions.find(m=>m.id==='m1');
const review=(strong=false)=>({summary:'Your lunch copy names office workers; the audience is still too broad.',strengths:['Your phrase "hot lunch before 11" gives a clear deadline.'],checks:m.checks.map((item,i)=>({item,met:strong||i!==0,note:strong?'Supported by your actual test.':'Narrow the audience to office workers near MG Road.'})),nextStep:'Rewrite only the audience line, then test it with one relevant reader.',answerAssessment:{onTopic:true,correct:strong,reason:strong?'Correct and tested.':'The audience is too broad for the stated local offer.'},practicalTest:{created:true,performed:true,reported:true,note:'You tested your draft with a reader.'}});
test('onboarding choices carry into the real localized lesson and session',()=>{for(const track of ['marketing','development','storytelling','filmmaking'])for(const level of ['beginner','experienced']){const p=learningPath({...defaultProfile,track,level,minutes:'5',language:'kn'});assert.equal(p.challenge.track,track);assert.equal(p.challenge.practiceLevel,level);assert.equal(p.sessionMinutes,5);assert.match(p.fit,/5 minutes/);assert.match(p.fit,new RegExp(level));assert.ok(p.challenge.task);}});
test('weak evaluation targets a repeated skill; improvement advances without replaying mastered work',()=>{const weak=review(),records=[1,2].map(i=>({mission_id:'m1',review:weak,created_at:'2026-10-17T10:00:0'+i+'Z'}));const path=learningPath(defaultProfile,[],'adaptive',false,records);assert.equal(path.nextMissionId,'m1');assert.equal(path.focus.skill,m.checks[0]);assert.equal(path.focus.repeated,2);assert.match(path.focus.instruction,/MG Road/);assert.equal(path.level,'guided');const improved={mission_id:'m1',review:review(true),created_at:'2026-10-17T11:00:00Z'};const next=learningPath(defaultProfile,[{mission_id:'m1',checks:'[true,true,true,true,true]',quiz:m.answer}],'adaptive',false,[improved,...records]);assert.equal(next.nextMissionId,'m2');assert.equal(next.level,'stretch');assert.equal(next.focus.mastered,true);assert.equal(next.progress.creations,1);assert.equal(reviewAccepted(weak),false);assert.equal(reviewAccepted(improved.review),true);assert.match(feedbackSummary(weak).worked,/hot lunch/);assert.match(feedbackSummary(weak).improve,/audience/);});
test('evaluated memory survives reload and remains isolated by account',async()=>{h.reset();const r=review();h.db.prepare('INSERT INTO submission_reviews(user_id,mission_id,body_hash,review,created_at) VALUES (?,?,?,?,?)').run('learner-a','m1','hash',JSON.stringify(r),'2026-10-17T10:00:00Z');assert.equal((await loadEvidence('learner-a')).length,1);assert.equal((await loadEvidence('learner-b')).length,0);assert.equal((await loadEvidence('learner-a'))[0].review.nextStep,r.nextStep);});


test('test learner flow: weak answer, focused feedback, revision, safe save and linked WhatsApp context',async()=>{
 h.reset({env:{OPENAI_API_KEY:'fake-product-review',AI_FEEDBACK_DAILY_LIMIT:'10'}});
 const {saveProfile,loadLearning}=h.load('lib/learning-service.ts');
 const {reviewedSubmission}=h.load('lib/submission-review.ts');
 const {saveMissionWork}=h.load('lib/mission-points.ts');
 const {handleBridgeMessage}=h.load('lib/bridge/whatsapp-chat.ts');
 const body=require('./fixtures/course-samples.json').m1;
 await saveProfile('flow-learner',{...defaultProfile,language:'kn',minutes:'15'});
 let strong=false,calls=0,system='';global.fetch=async(url,options)=>{assert.equal(String(url),'https://api.openai.com/v1/chat/completions');calls++;system=JSON.parse(options.body).messages[0].content;return Response.json({choices:[{message:{content:JSON.stringify(review(strong))}}]})};
 const weak=await reviewedSubmission('flow-learner','m1',body,'kn',true);
 assert.equal(reviewAccepted(weak),false);assert.match(system,/Kanglish/);assert.match(system,/Kannada/);
 const cached=await reviewedSubmission('flow-learner','m1',body,'kn',true);assert.deepEqual(cached,weak);assert.equal(calls,1);
 let state=await loadLearning('flow-learner');assert.equal(state.work.length,0);assert.equal(state.path.focus.skill,weak.checks[0].item);
 const phone='919876543210',stamp=new Date().toISOString();h.db.prepare("INSERT INTO whatsapp_contacts(user_id,phone,state,language,verified_at,consent_at,updated_at) VALUES (?,?,'opted_in','kn',?,?,?)").run('flow-learner',phone,stamp,stamp,stamp);
 const out=await handleBridgeMessage({wamid:'product-flow-1',from:phone,type:'text',text:'TODAY'});assert.equal(out.action,'reply');assert.match(out.text,/MG Road/);assert.match(out.text,/Focus:/);
 strong=true;const revised=body.replace('### Your reasoning\n','### Your reasoning\nAudience revised after the reader test: ');
 const improved=await reviewedSubmission('flow-learner','m1',revised,'kn',true);assert.equal(reviewAccepted(improved),true);
 const saved=await saveMissionWork('flow-learner',{missionId:'m1',body:revised,quiz:m.answer,checks:m.checks.map(()=>true)});assert.equal(saved.saved,true);
 const countBefore=h.db.prepare('SELECT COUNT(*) n FROM mission_scores').get().n;
 const repeat=await saveMissionWork('flow-learner',{missionId:'m1',body:revised,quiz:m.answer,checks:m.checks.map(()=>true)});assert.equal(repeat.saved,true);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM mission_scores').get().n,countBefore);
 state=await loadLearning('flow-learner');assert.equal(state.path.nextMissionId,'m2');assert.equal(state.path.practiceLevel,'experienced');assert.equal(state.path.progress.creations,1);
 const reloaded=await loadLearning('flow-learner');assert.deepEqual(reloaded.path,state.path);assert.equal((await loadLearning('other-learner')).work.length,0);
});
