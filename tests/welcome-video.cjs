const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=f=>fs.readFileSync(path.join(process.cwd(),f),'utf8');

test('home has a muted low-visibility background video and no mascot',()=>{
 const home=src('app/page.tsx');
 const hero=src('components/whatslearn/visual-start.tsx');
 const layout=src('app/layout.tsx');
 const css=src('app/globals.css');
 assert.match(home,/home-bg-video/);
 assert.match(home,/autoPlay muted loop playsInline/);
 assert.doesNotMatch(hero,/hero-video-inline/);
 assert.match(css,/\.home-bg-video\{[\s\S]*opacity:\.42/);
 assert.doesNotMatch(layout,/Mascot/);
 assert.ok(fs.existsSync(path.join(process.cwd(),'public','videos','whatslearn-welcome.mp4')));
});

