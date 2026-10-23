const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const h=require('./helpers/harness.cjs'),samples=require('./fixtures/course-samples.json');

test('mission completion has one prominent continuation and a quiet creations action',()=>{
 const s=fs.readFileSync('app/learn/workspace.tsx','utf8');
 const completion=s.slice(s.indexOf('<div className="next-play">'),s.indexOf('<div className="next-play">')+1000);
 assert.match(completion,/\?'Improve My Answer':'Continue Learning'/);
 assert.equal((completion.match(/className="primary"/g)||[]).length,1);
 assert.match(completion,/className="text-button".*?>See My Creations/);
 assert.doesNotMatch(completion,/className="outline"/);
});
test('membership describes review allowances separately from ordinary mentor questions',()=>{
 const s=fs.readFileSync('components/whatslearn/membership.tsx','utf8');
 assert.doesNotMatch(s,/questions or reviews|AI requests\/day/);
 assert.match(s,/Mentor questions have no daily question limit/);
 for(const copy of ['3 AI reviews/day after sign-in','10 AI reviews per day','25 AI reviews per day','five AI reviews per day','First 3 missions in each of four courses'])assert.ok(s.includes(copy));
 assert.match(s,/AI review allowances reset daily at midnight India time/);
 assert.match(s,/English fallback is labelled/);
});
test('WhatsApp handoff explains optional use, shared work, feedback and the return path',()=>{
 const s=fs.readFileSync('app/companion/page.tsx','utf8');
 for(const copy of ['Add WhatsApp if you prefer','linked course, drafts and accepted missions sync','Get feedback where you submit','Check the save status before switching','Return to My Journey'])assert.ok(s.includes(copy));
 assert.match(s,/the link sends nothing automatically/);
});
test('portfolio sharing remains a deliberate private download',()=>{
 const s=fs.readFileSync('app/learn/workspace.tsx','utf8');
 assert.match(s,/Export downloads a private text file\. Nothing is published/);
 assert.match(s,/a\.download='WhatsLearn-My-Work\.txt'/);
});

for(const [language,name,answer] of [['en','English','Start with one small task.'],['kn','Kannada','ಮೊದಲು ಒಂದು ಸಣ್ಣ ಕೆಲಸ ಮಾಡಿ.'],['te','Telugu','ముందుగా ఒక చిన్న పని చేయండి.']]){
 test(name+' mentor replies reject a mixed Kannada/Telugu draft before display',async()=>{
  h.reset({env:{OPENAI_API_KEY:'synthetic-language-test'}});let calls=0;
  global.fetch=async(url,o)=>{assert.equal(String(url),'https://api.openai.com/v1/chat/completions');const payload=JSON.parse(o.body);assert.ok(payload.messages[0].content.includes(name));return Response.json({choices:[{message:{content:++calls===1?'Try one step. ನಂತರ వివరాలు.':answer}}]})};
  const result=await h.load('lib/ai-feedback.ts').answerMentor('How can I begin?',language,{profile:{language},recentConversation:{answer:'ಹಳೆಯది పాతది'}});
  assert.equal(result.answer,answer);assert.equal(calls,2);
  assert.equal(h.db.prepare('SELECT COUNT(*) n FROM ai_feedback_usage').get().n,0,'ordinary questions do not consume reviews');
 });
}
for(const id of ['m1','d1','f1','v1'])test(id+' feedback checks the assigned task and rejects incorrect work despite model praise',async()=>{
 h.reset({env:{OPENAI_API_KEY:'synthetic-review-test'}});const {missions}=h.load('lib/missions.ts'),m=missions.find(x=>x.id===id);let calls=0;
 global.fetch=async(url,o)=>{assert.equal(String(url),'https://api.openai.com/v1/chat/completions');calls++;const system=JSON.parse(o.body).messages[0].content;assert.ok(system.includes(m.title));assert.match(system,/Relevant keywords are not evidence of correctness/);assert.match(system,/one specific missing part or correction/);return Response.json({choices:[{message:{content:JSON.stringify({answerAssessment:{onTopic:true,correct:false,reason:'A required part of the current task is incorrect.'},summary:'Correct the required part.',strengths:['Excellent work!'],checks:m.checks.map(item=>({item,met:true,note:'Unsupported model praise.'})),practicalTest:{created:true,performed:true,reported:true,note:'Unsupported model claim.'},nextStep:'Correct one required part, then try it again.',example:'Use one specific detail from the actual trial.'})}}]})};
 const result=await h.load('lib/ai-feedback.ts').reviewWork(id,samples[id],'en');
 assert.equal(result.answerAssessment.correct,false);assert.deepEqual(result.strengths,[]);assert.equal(h.load('lib/review-summary.ts').reviewAccepted(result),false);assert.equal(calls,1);
 assert.equal(h.db.prepare('SELECT COUNT(*) n FROM work').get().n,0);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM mission_scores').get().n,0);
});

test('mission numbering and mobile dismissal controls have clear sizing',()=>{
 const workspace=fs.readFileSync('app/learn/workspace.tsx','utf8');assert.match(workspace,/String\(current.indexOf\(next\)\+1\).padStart\(2,'0'\)/);assert.ok(workspace.includes('<span> / {current.length}</span>'));
 assert.match(fs.readFileSync('components/ui/dialog.tsx','utf8'),/inline-flex size-11 items-center justify-center/);
 assert.match(fs.readFileSync('components/whatslearn/website-tour.css','utf8'),/\.mission-tour-help>button.text-button\{min-height:44px/);
});
