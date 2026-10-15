const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
test('learning page resolves account state before the first render',()=>{
 const page=read('app/learn/page.tsx');assert.match(page,/await getChatGPTUser\(/);assert.match(page,/initialGuest=\{!user\}/);
 const client=read('app/learn/workspace.tsx');assert.match(client,/useState\(initialGuest\)/);assert.match(client,/initialSignedIn=\{!initialGuest\}/);
});
test('points strip reserves the same height while loading and loaded',()=>{
 assert.match(read('app/globals.css'),/\.points-chip\{[^}]*min-height:44px/);
});
test('starter progress exposes a valid named progressbar',()=>{
 const source=read('components/whatslearn/visual-start.tsx');assert.match(source,/className="visual-progress" role="progressbar"/);assert.match(source,/aria-valuemax=\{3\}/);assert.match(source,/aria-valuenow=/);
});
