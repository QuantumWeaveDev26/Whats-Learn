// v45: the mascot stands upright in the page flow, has one pose per page, and celebrates only after confirmed successes.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const src=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');
const m=src('components/whatslearn/mascot.tsx'),css=src('app/globals.css'),page=src('app/learn/workspace.tsx');
test('page poses: home, journey, skill paths, mission, mini challenge, membership, settings, companion, quiet for sign-in and legal',()=>{
 for(const [p,pose] of [['/','hello'],['/learn','come'],['/find-my-path','paths'],['/membership','point'],['/settings','tune'],['/companion','chat']])assert.ok(new RegExp(`['"]${p.replace('/','\\/')}['"]|startsWith\\('${p}'\\)`).test(m)&&m.includes(`'${pose}'`),p);
 assert.match(m,/dialog==='checkpoint'\?'think':dialog==='mission'\?'calm'/);assert.match(m,/return 'quiet'/);
 for(const c of ['wave-arm','beckon-arm','idea-arm','rest-arm','pupils','point-arm','dial','typing','thought'])assert.ok(css.includes('.mascot .'+c)||css.includes(c),c);
});
test('upright, in the flow: no negative margin onto a card border, no fixed or absolute placement, glasses gone',()=>{
 const block=css.slice(css.indexOf('.mascot-host{display:flex'),css.indexOf('@keyframes mascot-wave')).split('\n').filter(l=>!l.includes('mascot-say::before')&&!l.includes('mascot-sr')).join('\n');
 assert.ok(!/margin[^;}]*-\d/.test(block),'no negative margins');assert.ok(!/position:(fixed)/.test(block));assert.ok(!/r="5.6"|M58.6 35h2.8/.test(m),'glasses are gone');assert.ok(!/M44 28c0-9 7-15/.test(m),'plain round head, no hair');assert.ok(!/viewBox="0 0 180 64"/.test(m),'the old lying drawing is gone');
});
test('celebration only after a confirmed success; failed attempts change nothing; reduced motion is still',()=>{
 assert.match(page,/if\(r\.passed\)mascotMoment\('checkpoint'\)/);assert.match(page,/if\(d\.passed\)mascotMoment\('checkpoint'\)/);
 assert.ok(!/mascotMoment/.test(src('components/whatslearn/checkpoint.tsx')));
 const motion=css.indexOf('@media (prefers-reduced-motion:no-preference)',css.indexOf('.mascot-host{display:flex'));assert.ok(motion>0);assert.ok(!/animation\s*:/.test(css.slice(css.indexOf('.mascot-host{display:flex'),motion)));
});
test('always alive: idle loop, head tilt, blink and a periodic bigger gesture, all inside the motion-allowed block',()=>{
 const start=css.indexOf('.mascot .sway{');assert.ok(start>0);const motion=css.lastIndexOf('@media (prefers-reduced-motion:no-preference){',start);const end=css.indexOf('\n}\n',start);assert.ok(motion>0&&motion<start&&end>start);
 const inside=css.slice(motion,end);for(const n of ['mascot-sway','mascot-tilt','mascot-blink','mascot-rest','mascot-wave','mascot-beckon','mascot-nod','mascot-idea','mascot-chin'])assert.ok(inside.includes(n),n);
 assert.match(m,/className="pupils"/);assert.match(m,/className="head"/);assert.ok(!/<audio|new Audio/.test(m));
});
test('v48: character only. No caption, label or speech bubble; decorative; hover and tap react without touching success rules',()=>{
 assert.ok(!/mascot-say|LINE\b|<p className="mascot/.test(m),'no bubble or caption in the component');assert.ok(!/mascot-say/.test(css));assert.ok(!/<text|<title|<desc/.test(m),'no text inside the drawing');
 assert.match(m,/onPointerEnter/);assert.match(m,/pointerType==='mouse'/);assert.match(m,/pointerType!=='mouse'/);assert.ok(!/tabIndex|onClick|role="button"/.test(m),'not a tab stop or button');assert.match(m,/if\(react\)return/,'a success pose is never interrupted');
 const inside=css.slice(css.lastIndexOf('@media (prefers-reduced-motion:no-preference){',css.indexOf('mascot-hop')),css.indexOf('@keyframes mascot-hop'));assert.ok(/data-play=bounce/.test(inside)&&/data-play=wave/.test(inside)&&/data-play=blink/.test(inside),'reactions only when motion is allowed');
 for(const k of ['mascot-hop','mascot-hello','mascot-lids','mascot-nod2']){const b=css.match(new RegExp('@keyframes '+k+'\\{0%,100%\\{transform:(none|rotate\\(0\\)|scaleY\\(1\\))\\}'));assert.ok(b,k+' starts and ends at rest, so it returns smoothly')}
});
test('v49: poses follow the sheet, one body shape per pose family, still no text',()=>{
 for(const k of ["case 'hello'","case 'quiet'","case 'come'","case 'paths'","case 'calm'","case 'think'","case 'point'","case 'tune'","case 'chat'","case 'cheer'"])assert.ok(m.includes(k),k);
 assert.match(m,/function Legs/);assert.match(m,/<Phone/);assert.ok(/pose==='quiet'\)return/.test(m),'seated calm pose for sign-in and legal pages');assert.ok(!/WAVES=new Set<Pose>\(\[[^\]]*'quiet'/.test(m),'seated pose has no free arm to wave');
});
