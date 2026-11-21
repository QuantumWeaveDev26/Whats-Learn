const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('installed app uses dedicated symbol-only assets without changing its install identity',()=>{
 const manifest=JSON.parse(fs.readFileSync('public/app.webmanifest','utf8'));
 assert.equal(manifest.id,'/app');assert.equal(manifest.start_url,'/app');assert.equal(manifest.scope,'/app');
 for(const icon of manifest.icons){assert.match(icon.src,/app-launch-mark/);const bytes=fs.readFileSync('public'+icon.src);assert.equal(bytes.readUInt32BE(16),Number(icon.sizes.split('x')[0]));assert.equal(bytes.readUInt32BE(20),Number(icon.sizes.split('x')[1]))}
 assert.ok(manifest.icons.some(i=>i.purpose==='maskable'));
 const intro=fs.readFileSync('components/whatslearn-app/intro.tsx','utf8');assert.match(intro,/wla-splash-mark/);assert.match(intro,/From chat to change/);
});
