const test=require('node:test'),assert=require('node:assert/strict');
const h=require('./helpers/harness.cjs'),samples=require('./fixtures/course-samples.json');
test('review instructions acknowledge supplied evidence and avoid inventing new requirements for complete work',async()=>{
 h.reset({env:{OPENAI_API_KEY:'synthetic-evaluation-key'}});const {reviewWork}=h.load('lib/ai-feedback.ts'),{missions}=h.load('lib/missions.ts');let requests=[];
 global.fetch=async(url,options)=>{assert.equal(String(url),'https://api.openai.com/v1/chat/completions');requests.push(JSON.parse(options.body));return Response.json({choices:[{message:{content:JSON.stringify({answerAssessment:{onTopic:true,correct:true,reason:'The current task is answered.'},summary:'The submitted work meets the checks.',strengths:['Supplied artifact and actual test.'],checks:missions.find(m=>m.id==='m1').checks.map(item=>({item,met:true,note:'Supported by current work.'})),practicalTest:{created:true,performed:true,reported:true,note:'Artifact, test result and improvement supplied.'},nextStep:'Your work is ready to submit.'})}}]});};
 const review=await reviewWork('m1',samples.m1,'en');const instructions=requests[0].messages[0].content;
 assert.match(instructions,/Never ask for code, an artifact, test results, logs or a fix that the learner already supplied/);
 assert.match(instructions,/nextStep must simply say the work is ready to submit, in the selected language/);
 assert.match(instructions,/Do not claim it has already been saved or completed/);
 assert.match(instructions,/leave strengths empty/);
 assert.equal(review.nextStep,'Your work is ready to submit.');assert.equal(h.load('lib/review-summary.ts').reviewAccepted(review),true);assert.equal(requests.length,2,'independent correctness verification remains required');
});
for(const assessment of [{onTopic:false,correct:false,reason:'This answers a different task.'},{onTopic:true,correct:false,reason:'The current artifact still contains a blocking defect.'}])test('incorrect work cannot retain model praise: '+assessment.reason,async()=>{
 h.reset({env:{OPENAI_API_KEY:'synthetic-evaluation-key'}});const {reviewWork}=h.load('lib/ai-feedback.ts'),{missions}=h.load('lib/missions.ts');
 global.fetch=async()=>Response.json({choices:[{message:{content:JSON.stringify({answerAssessment:assessment,summary:assessment.reason,strengths:['Excellent work!'],checks:missions.find(m=>m.id==='m1').checks.map(item=>({item,met:true,note:'Model claim.'})),practicalTest:{created:true,performed:true,reported:true,note:'Model claim.'},nextStep:'Revise the assigned work.'})}}]});
 const review=await reviewWork('m1',samples.m1,'en');assert.deepEqual(review.strengths,[]);assert.equal(h.load('lib/review-summary.ts').feedbackSummary(review).worked,'');assert.equal(h.load('lib/review-summary.ts').reviewAccepted(review),false);if(!assessment.onTopic)assert.equal(review.checks.some(check=>check.met),false);
});
