const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const resolve=new Function('$input','$',fs.readFileSync('n8n/code/wa-resolve-intent.js','utf8'));
const context=new Function('$input','$',fs.readFileSync('n8n/code/wa-bridge-reply-context.js','utf8'));
const item=json=>({json}),snapshot=name=>item({action:'reply',text:`Hey ${name}! 👋\nCourse: AI Full-Stack Development\nLanguage: English · 15 min/day`});
function routed(text,kind,track=null){const rows=resolve({all:()=>[item({output:JSON.stringify({kind,track})})]},name=>({all:()=>name==='One Item Per Message'?[item({text,wamid:'m1',from:'919990000087'})]:[snapshot('Pavana')]}));return rows[0].json;}
test('semantic intents map to bounded website actions while explicit commands and actual work stay unchanged',()=>{
 for(const [text,kind,expected] of [['Where were we yesterday?','continue','TODAY'],['I wanna learn','learn','LEARN'],['Ready to hand this in','save','SAVE'],['that went over my head','clarify','PROFILE'],['Tell me about myself','profile','PROFILE'],['Wia','question','PROFILE']])assert.equal(routed(text,kind).bridgeText,expected);
 for(const text of ['STOP','LINK ABCDEFGH','ANSWER my source code','COURSE 2','SAVE'])assert.equal(routed(text,'question').bridgeText,text);
 assert.equal(routed('pause my task','keep-draft').bridgeText,'PROFILE');assert.equal(routed('save my work','save').bridgeText,'SAVE');assert.equal(routed('resume my task','continue').bridgeText,'TODAY');
 assert.equal(routed('I wrote this artifact and tested the result.','answer').bridgeText,'I wrote this artifact and tested the result.');assert.equal(routed('Switch me over','course','attacker-choice').bridgeText,'COURSE');
});
test('question recovery uses only the same learner’s current signed facts; it never completes a task',()=>{
 const request={mentorIntent:'question',learnerQuestion:'Wia',profileSnapshot:snapshot('Pavana').json.text};
 const out=context({all:()=>[item({action:'reply',text:'Your progress'})]},()=>({all:()=>[item(request)]}))[0].json;
 assert.equal(out.action,'tutor');assert.equal(out.question,'Wia');assert.equal(out.material.name,'Pavana');assert.match(out.material.verifiedProfile,/Pavana/);assert.doesNotMatch(JSON.stringify(out),/saved:true|completed:true/);
});
test('unlinked/opted-out contacts never become authenticated tutor requests',()=>{
 const request={mentorIntent:'profile',profileSnapshot:'Welcome. Link your account first.'};
 for(const response of [{action:'none'},{action:'reply',text:'Link your account first.'}])assert.deepEqual(context({all:()=>[item(response)]},()=>({all:()=>[item(request)]}))[0].json,response);
});
test('task saves and actual validation feedback are sent unchanged',()=>{
 const request={mentorIntent:'save',profileSnapshot:snapshot('Pavana').json.text};const response={action:'reply',text:'Your answer is not complete yet.'};assert.deepEqual(context({all:()=>[item(response)]},()=>({all:()=>[item(request)]}))[0].json,response);
});

test('wanting to learn explains the current lesson even when a finished draft is waiting',()=>{
 const request={mentorIntent:'learn',learnerQuestion:'I want to learn',profileSnapshot:snapshot('Pavana').json.text,profileContext:{currentTask:{title:'Build a booking page',idea:'Only confirm after saving.'}}};
 const out=context({all:()=>[item({action:'reply',text:'Draft ready. SAVE or EDIT.'})]},()=>({all:()=>[item(request)]}))[0].json;
 assert.equal(out.action,'tutor');assert.equal(out.question,'I want to learn');assert.equal(out.maxWords,35);assert.equal(out.material.mentorIntent,'learn');assert.match(out.material.currentTask.idea,/Only confirm/);
});

test('screenshot account requests never get a model-written status or completion claim',()=>{
 for(const [text,kind,command] of [["What's my point",'points','POINTS'],["Where's my journey in whatslearn",'journey','ROADMAP'],['Ok now I wanna finish my mission','continue','TODAY'],['Can i finish the task now','continue','TODAY']]){
  const request=routed(text,'question');assert.equal(request.mentorIntent,kind);assert.equal(request.bridgeText,command);
  const response={action:'reply',text:kind==='points'?'Points: 45':'Your current verified step.'};
  const out=context({all:()=>[item(response)]},()=>({all:()=>[item({...request,learnerQuestion:text})]}))[0].json;
  assert.equal(out.action,'reply');assert.ok(out.text.startsWith(response.text));assert.doesNotMatch(out.text,/looks strong|503|redeem|rewards/i);if(kind==='journey')assert.match(out.text,/https:\/\/whatslearn.in\/learn/);
 }
});

test('ordinary teaching excludes stale review and draft content, and how-to requests get room for complete steps',()=>{
 const request={mentorIntent:'question',learnerQuestion:'Can u explain how to build a fullstack website',profileSnapshot:snapshot('Pavana').json.text,profileContext:{draft:'Old booking bug',recentConversation:{answer:'Your fix is correct'},learning:{feedback:{summary:'Old 503 feedback'}}}};
 const out=context({all:()=>[item({action:'reply',text:'Account overview'})]},()=>({all:()=>[item(request)]}))[0].json;
 assert.equal(out.maxWords,80);assert.equal(out.material.learning,undefined);assert.equal(out.material.draft,undefined);assert.equal(out.material.recentConversation,undefined);assert.equal(out.material.currentServerReply,'');
});
test('a batch keeps names and sender context separate',()=>{
 const inputs=['A','B'].map((_,i)=>item({output:'{"kind":"profile"}'}));const messages=['A','B'].map(name=>item({text:'Tell me about myself',from:name}));const rows=resolve({all:()=>inputs},name=>({all:()=>name==='One Item Per Message'?messages:[snapshot('Pavana'),snapshot('Anita')]}));
 assert.match(rows[0].json.profileSnapshot,/Pavana/);assert.doesNotMatch(rows[0].json.profileSnapshot,/Anita/);assert.match(rows[1].json.profileSnapshot,/Anita/);
});
test('tone, emoji and pacing feedback cannot become practical submissions even when a classifier guesses answer',()=>{
 for(const text of ['I need to be learn different and genz style','Add some emojis too','Not too many just few is enough','But u rushing?']){
  const req=routed(text,'answer');assert.equal(req.mentorIntent,'preference',text);assert.equal(req.bridgeText,'PROFILE');
  const out=context({all:()=>[item({action:'reply',text:'Account data'})]},()=>({all:()=>[item({...req,learnerQuestion:text,profileContext:{currentTask:{title:'Booking'},currentPrompt:{text:'Old code'},draft:'Old draft',learning:{feedback:'Old 503'}}})]}))[0].json;
  assert.equal(out.action,'tutor');assert.equal(out.maxWords,25);assert.equal(out.material.currentTask,undefined);assert.equal(out.material.currentPrompt,undefined);assert.equal(out.material.learning,undefined);assert.equal(out.material.draft,undefined);assert.equal(out.material.currentServerReply,'');
 }
});
test('editing and asking for the actual question use website operations instead of resuming a ready draft',()=>{
 assert.equal(routed('I need to edit that','continue').bridgeText,'EDIT');assert.equal(routed('Tell me the qns','question').bridgeText,'QUESTION');assert.equal(routed('Can I do the task here?','continue').bridgeText,'QUESTION');
});
test('audience answers mentioning Gen Z or too many choices remain actual task answers',()=>{
 for(const text of ['My customers are Gen Z college students who need affordable meals.','Parents have too many steps before they can request a trial class.'])assert.equal(routed(text,'answer').mentorIntent,'answer');
});
