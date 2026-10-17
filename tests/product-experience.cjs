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
 let strong=false,calls=0,system='',userPrompt='';global.fetch=async(url,options)=>{assert.equal(String(url),'https://api.openai.com/v1/chat/completions');calls++;system=JSON.parse(options.body).messages[0].content;if(!system.includes('FINAL CORRECTNESS VERIFICATION'))userPrompt=JSON.parse(options.body).messages[1].content;return Response.json({choices:[{message:{content:JSON.stringify(review(strong))}}]})};
 const weak=await reviewedSubmission('flow-learner','m1',body,'kn',true);
 assert.equal(reviewAccepted(weak),false);assert.match(system,/Kanglish/);assert.match(system,/Kannada/);
 const cached=await reviewedSubmission('flow-learner','m1',body,'kn',true);assert.deepEqual(cached,weak);assert.equal(calls,1);
 let state=await loadLearning('flow-learner');assert.equal(state.work.length,0);assert.equal(state.path.focus.skill,weak.checks[0].item);
 const phone='919876543210',stamp=new Date().toISOString();h.db.prepare("INSERT INTO whatsapp_contacts(user_id,phone,state,language,verified_at,consent_at,updated_at) VALUES (?,?,'opted_in','kn',?,?,?)").run('flow-learner',phone,stamp,stamp,stamp);
 const out=await handleBridgeMessage({wamid:'product-flow-1',from:phone,type:'text',text:'TODAY'});assert.equal(out.action,'reply');assert.match(out.text,/MG Road/);assert.match(out.text,/Next skill:/);
 strong=true;const revised=body.replace('### Your reasoning\n','### Your reasoning\nAudience revised after the reader test: ');
 const improved=await reviewedSubmission('flow-learner','m1',revised,'kn',true);assert.equal(reviewAccepted(improved),true);assert.match(userPrompt,/<prior_review_data>/);assert.match(userPrompt,/MG Road/);
 const saved=await saveMissionWork('flow-learner',{missionId:'m1',body:revised,quiz:m.answer,checks:m.checks.map(()=>true)});assert.equal(saved.saved,true);
 const countBefore=h.db.prepare('SELECT COUNT(*) n FROM mission_scores').get().n;
 const repeat=await saveMissionWork('flow-learner',{missionId:'m1',body:revised,quiz:m.answer,checks:m.checks.map(()=>true)});assert.equal(repeat.saved,true);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM mission_scores').get().n,countBefore);
 state=await loadLearning('flow-learner');assert.equal(state.path.nextMissionId,'m2');assert.equal(state.path.practiceLevel,'experienced');assert.equal(state.path.progress.creations,1);
 const reloaded=await loadLearning('flow-learner');assert.deepEqual(reloaded.path,state.path);assert.equal((await loadLearning('other-learner')).work.length,0);
});


test('WhatsApp matches the actual experienced question and current language',async()=>{
 h.reset();const {saveProfile}=h.load('lib/learning-service.ts');const {handleBridgeMessage}=h.load('lib/bridge/whatsapp-chat.ts');
 const user='level-language-flow',phone='919876540001',stamp=new Date().toISOString();
 await saveProfile(user,{...defaultProfile,track:'development',level:'experienced',language:'en'});
 h.db.prepare("INSERT INTO whatsapp_contacts(user_id,phone,state,language,verified_at,consent_at,updated_at) VALUES (?,?,'opted_in','en',?,?,?)").run(user,phone,stamp,stamp,stamp);
 let state=await h.load('lib/learning-service.ts').loadLearning(user);
 let out=await handleBridgeMessage({wamid:'level-language-1',from:phone,text:'TODAY',type:'text'});
 assert.ok(out.text.includes(state.path.challenge.question));
 assert.ok(out.text.includes(state.path.challenge.options[0]));
 await saveProfile(user,{...state.profile,language:'kn'});
 out=await handleBridgeMessage({wamid:'level-language-2',from:phone,text:'PROFILE',type:'text'});
 assert.match(out.text,/Kannada/);
});

test('WhatsApp submission shows specific formative feedback without completing weak work',async()=>{
 h.reset({env:{OPENAI_API_KEY:'fake-wa-formative',AI_FEEDBACK_DAILY_LIMIT:'10'}});
 const {saveProfile}=h.load('lib/learning-service.ts');const {handleBridgeMessage}=h.load('lib/bridge/whatsapp-chat.ts');
 const {parseAnswer}=h.load('lib/practical.ts');const user='wa-feedback-flow',phone='919876540002',stamp=new Date().toISOString();
 await saveProfile(user,defaultProfile);
 h.db.prepare("INSERT INTO whatsapp_contacts(user_id,phone,state,language,verified_at,consent_at,updated_at) VALUES (?,?,'opted_in','en',?,?,?)").run(user,phone,stamp,stamp,stamp);
 const answer=parseAnswer(m.practical,require('./fixtures/course-samples.json').m1);
 h.db.prepare('INSERT OR REPLACE INTO whatsapp_drafts(user_id,mission_id,quiz,body,updated_at) VALUES (?,?,?,?,?)').run(user,'m1',m.answer,JSON.stringify({fields:answer.fields,reasoning:answer.reasoning,link:'',checks:[1,2,3,4,5],level:'beginner'}),stamp);
 let strong=false,calls=0;
 global.fetch=async()=>{calls++;return Response.json({choices:[{message:{content:JSON.stringify(review(strong))}}]})};
 let out=await handleBridgeMessage({wamid:'wa-formative-1',from:phone,text:'SUBMIT',type:'text'});
 assert.match(out.text,/Works:/);assert.match(out.text,/hot lunch/);assert.match(out.text,/Improve:/);assert.match(out.text,/Next action:/);
 assert.equal(h.db.prepare('SELECT COUNT(*) n FROM work WHERE user_id=?').get(user).n,0);
 const original=h.db.prepare('SELECT body FROM whatsapp_drafts WHERE user_id=?').get(user).body;
 const draft=JSON.parse(original);draft.reasoning+=' Audience revised to MG Road office workers after the test.';
 h.db.prepare('UPDATE whatsapp_drafts SET body=? WHERE user_id=?').run(JSON.stringify(draft),user);strong=true;
 out=await handleBridgeMessage({wamid:'wa-formative-2',from:phone,text:'SUBMIT',type:'text'});
 assert.match(out.text,/Works:/);assert.match(out.text,/Website synced/);assert.match(out.text,/Next challenge:/);
 assert.equal(h.db.prepare('SELECT COUNT(*) n FROM work WHERE user_id=?').get(user).n,1);
 assert.equal(calls,3,'save reuses the evaluated answer instead of charging twice');
});

 test('independent verification blocks a generous review of an unresolved defect',async()=>{
 h.reset({env:{OPENAI_API_KEY:'fake-independent-verification'}});const {reviewWork}=h.load('lib/ai-feedback.ts');let calls=0;
 global.fetch=async(url,options)=>{calls++;const prompt=JSON.parse(options.body).messages[0].content;let result=review(true);if(prompt.includes('FINAL CORRECTNESS VERIFICATION'))result={answerAssessment:{onTopic:true,correct:false,reason:'Your client shows Booking saved before the server response.'},practicalTest:{created:true,performed:true,reported:false,note:'The forced failure still displays success; the fix is only planned.'}};return Response.json({choices:[{message:{content:JSON.stringify(result)}}]})};
 const r=await reviewWork('m1',require('./fixtures/course-samples.json').m1,'en');assert.equal(calls,2);assert.equal(reviewAccepted(r),false);assert.equal(r.answerAssessment.correct,false);assert.match(r.nextStep,/before the server/);assert.match(r.blockingIssue,/before the server/);assert.ok(r.checks.every(c=>c.met),'keep partial strengths while the independent correctness gate blocks completion');const path=learningPath(defaultProfile,[],'adaptive',false,[{mission_id:'m1',review:r,created_at:new Date().toISOString()}]);assert.match(path.focus.instruction,/before the server/);assert.equal(path.skills.audience?.demonstrated,false);
 });
 test('language preference follows Kannada script and explicit Kanglish work',()=>{const {feedbackLanguage}=h.load('lib/ai-feedback.ts');assert.equal(feedbackLanguage('en','ನಾನು ಬುಕಿಂಗ್ ಸರ್ವರ್ ಪರೀಕ್ಷೆ ಮಾಡಿದೆ ಮತ್ತು ಫಲಿತಾಂಶವನ್ನು ಬರೆದಿದ್ದೇನೆ'),'Kannada');assert.match(feedbackLanguage('en','Kanglish: nanu server test maadide. Nanna success message aadmele barutte.'),/Kanglish/);assert.equal(feedbackLanguage('en','I ran the server and recorded the result.'),'English')});
