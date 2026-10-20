const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('settings gates account writes until a successful profile read and accepts an empty server name',()=>{
 const s=fs.readFileSync('app/settings/page.tsx','utf8');
 assert.match(s,/accountState/);assert.match(s,/r\.status===401/);assert.match(s,/if\(!r\.ok\)throw/);
 assert.match(s,/typeof d\.name==='string'/);assert.doesNotMatch(s,/if\(d\?\.name\)/);
 assert.match(s,/accountState!=='ready'/);assert.match(s,/Retry account/);
});
