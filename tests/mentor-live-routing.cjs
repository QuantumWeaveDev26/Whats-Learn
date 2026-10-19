const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const resolve=new Function('$input','$',fs.readFileSync('n8n/code/wa-resolve-intent.js','utf8'));
const context=new Function('$input','$',fs.readFileSync('n8n/code/wa-bridge-reply-context.js','utf8'));
const item=json=>({json}),snapshot=name=>item({action:'reply',text:`Hey ${name}! 👋\nCourse: AI Full-Stack Development\nLanguage: English · 15 min/day`});
function routed(text,kind,track=null){const rows=resolve({all:()=>[item({output:JSON.stringify({kind,track})})]},name=>({all:()=>name==='One Item Per Message'?[item({text,wamid:'m1',from:'919990000087'})]:[snapshot('Pavana')]}));return rows[0].json;}
test('semantic intents map to bounded website actions while explicit commands and actual work stay unchanged',()=>{
 for(const [text,kind,expected] of [['Where were we yesterday?','continue','TODAY'],['I wanna learn','continue','TODAY'],['Ready to hand this in','save','SAVE'],['that went over my head','clarify','LEARN'],['Tell me about myself','profile','PROFILE'],['Wia','question','PERFORMANCE']])assert.equal(routed(text,kind).bridgeText,expected);
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
test('a batch keeps names and sender context separate',()=>{
 const inputs=['A','B'].map((_,i)=>item({output:'{"kind":"profile"}'}));const messages=['A','B'].map(name=>item({text:'Tell me about myself',from:name}));const rows=resolve({all:()=>inputs},name=>({all:()=>name==='One Item Per Message'?messages:[snapshot('Pavana'),snapshot('Anita')]}));
 assert.match(rows[0].json.profileSnapshot,/Pavana/);assert.doesNotMatch(rows[0].json.profileSnapshot,/Anita/);assert.match(rows[1].json.profileSnapshot,/Anita/);
});
