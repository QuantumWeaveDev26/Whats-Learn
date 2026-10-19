const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
test('the importable reply composer preserves a returning learner name even if AI omits it',async()=>{
 const code=fs.readFileSync('n8n/code/wa-compose-tutor-reply.js','utf8');
 const prior={maxWords:45,fallback:'Try again—your task is safe.',addressAs:'Pavana'};
 const $=n=>n==='Resolve Settings'?{first:()=>({json:{cfg:{baseUrl:'https://whatslearn.in'}}})}:{all:()=>[{json:prior}]};
 const run=result=>new AsyncFunction('$input','$',code)({all:()=>[{json:result}]},$);
 let out=await run({choices:[{message:{content:'Try one feature and test the failure case.'}}]});assert.match(out[0].json.reply,/^Pavana,/);
 out=await run({choices:[{message:{content:'Pavana, test the failure case first.'}}]});assert.equal((out[0].json.reply.match(/Pavana/g)||[]).length,1);
 prior.addressAs='Ram';out=await run({choices:[{message:{content:'A program needs one clear action.'}}]});assert.match(out[0].json.reply,/^Ram,/);
});
test('the live agent composer carries the same name and keeps account-link instructions intact',async()=>{
 const ops=JSON.parse(fs.readFileSync('docs/mentor-identity-workflow-fix.json','utf8')).operations;
 const code=ops.find(o=>o.nodeName==='Compose WhatsLearn Agent Reply').parameters.jsCode;
 const prior={maxWords:45,material:{addressAs:'Pavana'},fallback:'Try again.'};const $=()=>({all:()=>[{json:prior}]});
 let out=await new AsyncFunction('$input','$',code)({all:()=>[{json:{output:'A keyframe marks one position. Preview two positions to see the change.'}}]},$);
 assert.match(out[0].json.reply,/^Pavana,/);assert.ok(out[0].json.reply.split(/\s+/u).length<=46);
 prior.material.addressAs='Ram';out=await new AsyncFunction('$input','$',code)({all:()=>[{json:{output:'A program needs one clear action.'}}]},$);assert.match(out[0].json.reply,/^Ram,/);
 const polish=ops.find(o=>o.nodeName==='Polish WhatsLearn Chat Replies').parameters.jsCode;
 const original={action:'reply',text:'Welcome to WhatsLearn. Link your account at https://whatslearn.in/settings.'};
 const kept=await new AsyncFunction('$input',polish)({all:()=>[{json:original}]});assert.deepEqual(kept[0].json,original);
});
