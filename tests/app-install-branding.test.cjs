const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('installed app uses dedicated symbol-only assets without changing its install identity',()=>{
 const manifest=JSON.parse(fs.readFileSync('public/app.webmanifest','utf8'));
 assert.deepEqual(manifest, require('../app/app/install-manifest/manifest.json'));
 assert.equal(manifest.id,'/app');assert.equal(manifest.start_url,'/app');assert.equal(manifest.scope,'/app');
 for(const icon of manifest.icons){assert.match(icon.src,/app-launch-mark/);const bytes=fs.readFileSync('public'+icon.src);assert.equal(bytes.readUInt32BE(16),Number(icon.sizes.split('x')[0]));assert.equal(bytes.readUInt32BE(20),Number(icon.sizes.split('x')[1]))}
 assert.ok(manifest.icons.some(i=>i.purpose==='maskable'));
 const intro=fs.readFileSync('components/whatslearn-app/intro.tsx','utf8');assert.match(intro,/wla-splash-mark/);assert.match(intro,/From chat to change/);
});

test('installed Android lets the system show the icon and renders only the tagline',async()=>{
 const {hooks,load,find,text}=require('./helpers/client-components.cjs');
 const previous=global.window;
 try {
  for(const [userAgent,installed,showMark] of [['Android',true,false],['Android',false,true],['iPhone',true,true]]){
   global.window={matchMedia:()=>({matches:installed}),navigator:{userAgent}};
   const h=hooks();
   try {
    const {Splash}=load('components/whatslearn-app/intro.tsx',h);
    const render=()=>{h.start();return Splash({onDone(){}})};
    render();
    await h.flush();
    const splash=render();
    assert.equal(!!find(splash,n=>n.props.className==='wla-splash-mark'),showMark);
    assert.match(text(splash),/From chat to change\./);
   } finally {h.unmount()}
  }
 } finally {global.window=previous}
});
