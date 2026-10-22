const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const h=require('./helpers/harness.cjs'),{accountKey}=h.load('lib/auth/account-key.ts');
test('code draft requests reject a stale account marker before reading, writing or executing',async()=>{
 const Module=require('node:module'),prior=Module._load;Module._load=function(n,p,i){if(n==='@/app/chatgpt-auth')return {getChatGPTUser:async()=>({userId:'current'})};return prior.call(this,n,p,i)};
 const route=h.load('app/api/code-runner/route.ts');h.reset();for(const method of ['GET','PUT','POST']){const r=await route[method](h.req('/api/code-runner?missionId=d1',{method,headers:{'x-whatslearn-account':accountKey('old')},body:method==='GET'?undefined:{missionId:'d1',source:'2+2',mode:'javascript'}}));assert.equal(r.status,409)}Module._load=prior;
});
test('optional tools stay deferred, keep drafts mounted on close, and active localization waits for its pack',()=>{
 const deferred=fs.readFileSync('components/whatslearn/deferred-panel.tsx','utf8'),workspace=fs.readFileSync('app/learn/workspace.tsx','utf8'),coach=fs.readFileSync('components/whatslearn/practice-coach.tsx','utf8');assert.match(deferred,/if\(.*open.*\).*setOpened\(true\)/);assert.ok(!deferred.includes('setOpened(false)'));assert.match(coach,/import\('\.\/developer-tools'\)/);assert.match(workspace,/if\(!lessonLanguageState.ready\)return;setActive/);assert.match(workspace,/path.nextMissionId,lessonLanguageState.ready/);assert.match(workspace,/open=\{!!active&&lessonLanguageState.ready\}/);
});
test('client pack build transform excludes server rendering and loads languages on demand',()=>{
 const plugin=fs.readFileSync('build/language-packs-plugin.ts','utf8'),client=fs.readFileSync('lib/translations/client.ts','utf8');assert.match(plugin,/environment.name!=='client'/);assert.equal((client.match(/=>import\('/g)||[]).length,20);assert.match(client,/pending\.get\(language\)/);assert.match(client,/finally\(\(\)=>pending.delete\(language\)\)/);
});
