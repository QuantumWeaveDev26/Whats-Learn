const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const files=['n8n/workflows/whatslearn-all-in-one.json','n8n/workflows/whatslearn-mentor-connected.json'];
for(const file of files){
 test(file+' routes every entry using existing trigger names',()=>{
  const w=JSON.parse(fs.readFileSync(file,'utf8')),names=new Set(w.nodes.map(n=>n.name));
  const route=w.nodes.find(n=>n.name==='Which Part Is Running?');
  const expected=['Meta Webhook GET (verify)','Meta Webhook POST (messages)','Every 2 Minutes','Due Reminders Every 2 Minutes'];
  assert.equal(route.parameters.rules.values.length,expected.length);
  for(const [i,name] of expected.entries()){
   assert.ok(names.has(name),name+' must exist');
   const expression=route.parameters.rules.values[i].conditions.conditions[0].leftValue;
   assert.ok(expression.includes(JSON.stringify(name)),name+' must route to branch '+i);
  }
  for(const n of w.nodes){
   for(const match of JSON.stringify(n.parameters).matchAll(/\$\(\\"([^"\\]+)\\"\)/g)){
    assert.ok(names.has(match[1]),n.name+' references missing node '+match[1]);
   }
  }
  for(const name of expected)assert.equal(w.connections[name].main[0][0].node,'My Settings (edit here)');
  assert.equal(w.nodes.find(n=>n.name==='Refuse Challenge').parameters.options.responseCode,403);
  assert.equal(w.nodes.find(n=>n.name==='Reject Bad Signature').parameters.options.responseCode,401);
 });
}
test('workflow generators preserve the reminder trigger name',()=>{
 for(const file of ['n8n/gen_merged.py','n8n/gen_sdk.py']){
  const source=fs.readFileSync(file,'utf8');
  assert.ok(source.includes('Due Reminders Every 2 Minutes'));
  assert.ok(!source.includes('Hourly At 7 Past'));
 }
});
