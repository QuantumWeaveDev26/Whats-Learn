const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('the connected workflow template preserves the published meaning-based route without private settings',()=>{
 const w=JSON.parse(fs.readFileSync('n8n/workflows/whatslearn-mentor-connected.json','utf8'));assert.equal(w.active,false);
 const node=name=>w.nodes.find(n=>n.name===name);
 for(const [name,file] of [['Resolve Learner Intent','wa-resolve-intent.js'],['Use Fresh Mentor Context','wa-bridge-reply-context.js'],['Build Tutor Request','wa-build-connected-tutor.js']])assert.equal(node(name).parameters.jsCode.replaceAll("\r\n","\n").trim(),fs.readFileSync('n8n/code/'+file,'utf8').replaceAll('\r\n','\n').trim());
 assert.equal(w.connections['Standalone Mode?'].main[1][0].node,'Sign Mentor Profile');assert.equal(w.connections['WhatsLearn Handles Message'].main[0][0].node,'Use Fresh Mentor Context');
 assert.ok(w.connections['WhatsLearn OpenAI Chat Model'].ai_languageModel[0].some(c=>c.node==='Understand Learner Message'));
 const prompt=node('WhatsLearn Chat Agent').parameters.options.systemMessage;assert.match(prompt,/real-world example/);assert.match(prompt,/Stay calm/);assert.match(prompt,/Fresh saved facts override/);assert.match(prompt,/Never claim work was saved/);
 for(const a of node('My Settings (edit here)').parameters.assignments.assignments)if(a.name!=='baseUrl')assert.match(a.value,/^PASTE_/);
 assert.ok(w.nodes.every(n=>!n.credentials));assert.doesNotMatch(JSON.stringify(w),/EAA[A-Za-z0-9]{20}|sk-[A-Za-z0-9]{20}/);
});
