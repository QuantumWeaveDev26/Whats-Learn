const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),Module=require('node:module');
const h=require('./helpers/harness.cjs');const original=Module._load;
Module._load=function(name,parent,isMain){if(name==='@/app/chatgpt-auth')return {getChatGPTUser:async()=>({userId:'new-account',email:'new@example.test'})};return original.call(this,name,parent,isMain)};
const session=h.load('app/api/style-session/route.ts'),practice=h.load('app/api/style-interaction/route.ts');
test('a stale concept draft or answer cannot be applied to a different signed-in account',async()=>{
 h.reset();let calls=0;global.fetch=async()=>{calls++;throw Error('No provider call expected')};
 for(const action of ['draft','turn','restart']){const result=await h.call(session,'/api/style-session',{headers:{'x-whatslearn-account':'old-account'},body:{missionId:'m1',action,answer:'An answer from a different account.'}});assert.equal(result.status,409);assert.match(result.json.error,/account changed/)}
 const get=await session.GET(h.req('/api/style-session?missionId=m1',{method:'GET',headers:{'x-whatslearn-account':'old-account'}}));assert.equal(get.status,409);
 const checked=await h.call(practice,'/api/style-interaction',{headers:{'x-whatslearn-account':'old-account'},body:{missionId:'m1',answer:'An answer from a different account.'}});assert.equal(checked.status,409);assert.equal(calls,0);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM learning_sessions').get().n,0);
});
test('practice allowance exposes the same opaque identity used to guard requests',async()=>{
 h.reset();const data=await practice.GET().then(r=>r.json());assert.equal(data.accountKey,h.load('lib/auth/account-key.ts').accountKey('new-account'));assert.ok(data.scope.startsWith(data.accountKey));assert.equal(data.signInRequired,undefined);
});
test('practice UI resets on account scope changes, guards old responses, and does not suggest Kannada in English sessions',()=>{
 const source=fs.readFileSync('components/whatslearn/style-interaction.tsx','utf8');assert.match(source,/style,budget.scope\]/);assert.match(source,/'x-whatslearn-account':budget.accountKey/);assert.match(source,/sessionVersion.current!==version/);assert.match(source,/language==='en'\?'One sentence, in your own words.'/);assert.match(source,/Practice progress synced to your account/);
});
