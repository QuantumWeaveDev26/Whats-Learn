const test=require('node:test'),assert=require('node:assert/strict');
const h=require('./helpers/harness.cjs');
const ai=h.load('lib/ai-feedback.ts'),copy=h.load('lib/chat-copy.ts');
function provider(replies){h.reset({env:{OPENAI_API_KEY:'synthetic-repair-key'}});const requests=[];global.fetch=async(url,o)=>{assert.equal(String(url),'https://api.openai.com/v1/chat/completions');requests.push(JSON.parse(o.body));return Response.json({choices:[{message:{content:replies[Math.min(requests.length-1,replies.length-1)]}}]})};return requests;}
const question='What is the difference between a customer and an audience? Explain in English with one simple lunch-service example.';

test('the observed invented-draft opening is repaired as an AI answer, preserving the actual question and context',async()=>{
 const requests=provider(['Your draft explains the difference well! A customer buys lunch. An audience sees the offer.','A customer buys lunch. Your audience includes office workers you want to reach, including existing customers.']);
 const context={name:'Learner',draft:'',recentConversation:{question:'Explain lunch offers',answer:'Start with who needs lunch.'}};
 const out=await ai.answerMentor(question,'en',context);
 assert.equal(requests.length,2);assert.equal(out.answer,'A customer buys lunch. Your audience includes office workers you want to reach, including existing customers.');
 const repair=JSON.parse(requests[1].messages[1].content);
 assert.equal(repair.question,question);assert.deepEqual(repair.account,context);assert.match(repair.candidateAnswer,/Your draft explains/);assert.equal(Object.hasOwn(repair,'draft'),false);
 assert.match(requests[1].messages[0].content,/NOT learner work or a submission/);
 assert.equal(h.db.prepare('SELECT COUNT(*) n FROM work').get().n,0);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM ai_feedback_usage').get().n,0);
});

test('an overlong answer is rewritten under the cap without discarding recent conversation',async()=>{
 const requests=provider(['A useful answer has many words. '.repeat(12),'A customer buys lunch; the audience is everyone who sees your offer.']);
 const out=await ai.answerMentor('Explain that in two sentences.','en',{recentConversation:{question,answer:'A customer buys the meal.'}});
 assert.equal(requests.length,2);assert.ok(out.answer.split(/\s+/).length<=35);assert.match(requests[1].messages[1].content,/A customer buys the meal/);
});

for(const [label,reply] of [['unsupported assessment','Your draft is correct. Keep going.'],['overlong','This answer has no complete sentence boundary '.repeat(10)],['mixed script','Use an example. ನಂತರ వివరాలు.']])test('a repair that remains '+label+' is not displayed or saved',async()=>{
 const requests=provider(['Your draft looks strong! A customer buys lunch.',reply]);
 await assert.rejects(()=>ai.answerMentor(question,'en',{}),e=>e.status===502);
 assert.equal(requests.length,2);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM work').get().n,0);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM mission_scores').get().n,0);
});

test('repair failure does not expose the original unsupported assessment',async()=>{
 let calls=0;provider([]);global.fetch=async()=>{if(++calls===2)throw Error('synthetic outage');return Response.json({choices:[{message:{content:'Your fix correctly ensures the booking is saved.'}}]})};
 await assert.rejects(()=>ai.answerMentor('What does save mean?','en',{}),e=>e.status===502);assert.equal(calls,2);
});

test('a useful direct answer needs no repair, no repeated name and no grading call',async()=>{
 const requests=provider(['An audience sees your offer; a customer buys it.']);
 assert.equal((await ai.answerMentor(question,'en',{name:'Learner',draft:''})).answer,'An audience sees your offer; a customer buys it.');assert.equal(requests.length,1);
});

test('a shortening outage preserves complete useful sentences within the cap',async()=>{
 let calls=0;provider([]);global.fetch=async()=>{if(++calls===2)return Response.json({error:'busy'},{status:503});return Response.json({choices:[{message:{content:'An API lets two apps exchange information. A cricket scoreboard asks a server for the score. '+('Keep the screen in sync with the latest result. '.repeat(10))}}]})};
 const {answer}=await ai.answerMentor('What is an API?','en',{});assert.match(answer,/scoreboard/);assert.ok(answer.split(/\s+/u).length<=35);assert.match(answer,/[.!?]$/);
 assert.equal(copy.completeMentorExcerpt('```js\n'+('line '.repeat(100))+'```',35),null);
 assert.doesNotMatch(copy.completeMentorExcerpt('Build a small page first. 1. '+('an unfinished long step '.repeat(30)),10),/1\.$/);
});

test('ordinary advice and genuine saved-account facts are not confused with unsupported grading',()=>{
 for(const text of ['Your code should wait for the response.','Your draft has three saved parts.','Your work is saved in My Creations.'])assert.equal(copy.unrequestedMentorAssessment(text),false,text);
 for(const text of ['Your draft explains the difference well!','Your answer is correct.','Your fix correctly ensures only one message.','Your draft looks strong!'])assert.equal(copy.unrequestedMentorAssessment(text),true,text);
});


test('definition questions preserve accuracy, overlapping groups and the requested example',async()=>{
 const requests=provider(['A customer buys lunch. Your audience is the group you want to reach, including existing customers. An office worker can see your lunch offer and also buy it.']);
 const out=await ai.answerMentor(question,'en',{});assert.match(out.answer,/including existing customers/);const system=requests[0].messages[0].content;assert.match(system,/Categories can overlap/);assert.match(system,/a marketing audience is the intended group/);assert.match(system,/any example the question requests/);assert.match(system,/under 55 words/);
});


test('the live audience exclusion is repaired against a checked reference without another model request',async()=>{
 const bad="A customer is someone who buys your lunch. An audience is a group of people who see your ads but haven’t bought yet. Customers pay; audiences might pay later.";
 const requests=provider([bad]);const out=await ai.answerMentor(question,'en',{});assert.match(out.answer,/can include existing customers/);assert.match(out.answer,/lunch service/);assert.doesNotMatch(out.answer,/haven.t bought/);assert.equal(requests.length,1);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM work').get().n,0);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM ai_feedback_usage').get().n,0);
});
test('the checked reference does not replace unrelated questions, correct overlap explanations or selected-language output',()=>{
 const repair=h.load('lib/mentor-reference.ts').checkedDefinitionAnswer;const answer='Some of the audience have not bought; the audience also includes existing customers.';assert.equal(repair(question,answer,'English'),answer);assert.equal(repair('How do I turn an audience into customers?','Give a clear offer and useful next step.','English'),'Give a clear offer and useful next step.');assert.equal(repair(question,'A customer buys. An audience has not bought.','Kannada'),'A customer buys. An audience has not bought.');
});
