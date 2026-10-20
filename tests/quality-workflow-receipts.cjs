const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{createHmac}=require('node:crypto');
test('both WhatsApp send branches record only accepted final replies with paired learner identity',()=>{
 const w=JSON.parse(fs.readFileSync('n8n/workflows/whatslearn-mentor-connected.json','utf8'));
 for(const kind of ['Reply','Tutor Reply']){
  const prep=w.nodes.find(n=>n.name==='Prepare '+kind+' Receipt');assert.ok(prep);
  const m={from:'919900001111',wamid:'in.1',text:'Explain this'};
  const prepared=new Function('$input','$',prep.parameters.jsCode)({all:()=>[{json:{text:'Final reply',reply:'Final tutor reply'}}]},()=>({itemMatching:()=>({json:m})}));
  assert.equal(prepared[0].json.qualityReceipt.from,m.from);
  const signer=w.nodes.find(n=>n.name==='Sign '+kind+' Receipt');assert.ok(signer);
  const secret='synthetic-quality-secret-over-32-characters';
  const lookup=name=>name==='Resolve Settings'?{first:()=>({json:{cfg:{baseUrl:'https://whatslearn.example.test',bridgeSecret:secret}}})}:{itemMatching:()=>prepared[0]};
  const run=input=>new Function('$input','$',signer.parameters.jsCode)({all:()=>input},lookup);
  assert.deepEqual(run([{json:{error:'not accepted'}}]),[]);
  const [out]=run([{json:{messages:[{id:'wamid.actual'}]}}]);const p=JSON.parse(out.json.body);
  assert.equal(p.messageId,'wamid.actual');assert.equal(p.from,m.from);assert.equal(p.answer,kind==='Reply'?'Final reply':'Final tutor reply');
  assert.equal(out.json.signature,createHmac('sha256',secret).update(out.json.ts+'\n'+out.json.nonce+'\nPOST\n/api/bridge/whatsapp/quality\n'+out.json.body).digest('hex'));
  assert.equal(w.connections['Send '+kind].main[0][0].node,signer.name);
  const logger=w.nodes.find(n=>n.name==='Record '+kind+' Receipt');assert.equal(logger.onError,'continueRegularOutput');
 }
});
