const test=require('node:test'),assert=require('node:assert/strict'),Module=require('node:module'),{randomUUID}=require('node:crypto');
const h=require('./helpers/harness.cjs');let user=null;const original=Module._load;Module._load=function(n,p,i){if(n==='@/app/chatgpt-auth')return {getChatGPTUser:async()=>user};if(n==='@/lib/mission-access-server')return {canUseMission:async()=>true};return original.call(this,n,p,i)};
const api=h.load('app/api/full-project/route.ts'),{accountKey}=h.load('lib/auth/account-key.ts');
test('project API blocks guests, cross-site starts, stale identities and malformed input',async()=>{
 h.reset();assert.equal((await api.GET(h.req('/api/full-project',{method:'GET'}))).status,401);user={userId:'a'};
 assert.equal((await api.POST(h.req('/api/full-project',{origin:'https://other.test',body:{}}))).status,403);
 for(const method of ['GET','POST','DELETE'])assert.equal((await api[method](h.req('/api/full-project',{method,headers:{'x-whatslearn-account':accountKey('other')},body:method==='GET'?undefined:{}}))).status,409);
 assert.equal((await api.POST(h.req('/api/full-project',{body:{passed:true}}))).status,400);assert.equal((await api.GET(h.req('/api/full-project?id=invalid',{method:'GET'}))).status,400);
 const response=await api.GET(h.req('/api/full-project',{method:'GET'})),d=await response.json();assert.equal(d.available,false);assert.deepEqual(d.jobs,[]);assert.equal(response.headers.get('Cache-Control'),'private, no-store');
 assert.equal((await api.GET(h.req('/api/full-project?id='+randomUUID(),{method:'GET'}))).status,404);
});
