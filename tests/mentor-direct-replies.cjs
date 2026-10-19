const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const compose=new Function('$input','$',fs.readFileSync('n8n/code/wa-compose-connected-reply.js','utf8'));
function reply(question,text,maxWords=35,name='Pavana'){return compose({all:()=>[{json:{output:text}}]},()=>({all:()=>[{json:{input:question,maxWords,material:{name}}}]}))[0].json.reply;}
test('only a greeting message gets a greeting; follow-ups never force the name',()=>{
 assert.equal(reply('Hi','Hey Pavana! 👋 What’s on your mind?'),'Hey Pavana! 👋 What’s on your mind?');
 assert.equal(reply('What is AI','Hi Pavana! AI helps software recognise patterns.'),'AI helps software recognise patterns.');
 assert.equal(reply('Explain simply','Sure, Pavana! Try a shopping-list app.'),'Try a shopping-list app.');
 assert.equal(reply('How do I build','A shopping-list app has a screen and saved items.'),'A shopping-list app has a screen and saved items.');
 assert.equal(reply('What is AI','Hey Pavana! AI finds patterns.','35','Pavana'),'AI finds patterns.');
});
test('long answers stop at a complete thought instead of cutting words mid-sentence',()=>{
 const text='AI learns patterns from examples. Your phone uses it to recognise a face in a photo. '+('More unnecessary extra explanation goes here. '.repeat(10));
 const result=reply('What is AI',text,20);assert.match(result,/photo\.$/);assert.ok(result.split(/\s+/).length<=20);assert.doesNotMatch(result,/…$/);
});
test('names with regex punctuation cannot change greeting stripping rules',()=>{
 assert.equal(reply('Explain','Hey A. Rao! One simple example.',35,'A. Rao'),'One simple example.');
});
test('numbered steps do not end with a dangling ordinal or get collapsed into one paragraph',()=>{
 const out=reply('How to build a website','To build a website: 1. Make a screen. 2. Save its data. 3. Connect the two. 4.',80);
 assert.match(out,/\n1\) Make a screen/);assert.match(out,/\n3\) Connect the two\.$/);assert.doesNotMatch(out,/4[.)]\s*$/);
});
