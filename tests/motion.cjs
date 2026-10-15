// v46: card hover, focus and press states and scroll reveals are restrained and safe: transform and shadow only, reduced motion respected, content never hidden by CSS alone.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const src=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');const css=src('app/motion.css'),rv=src('components/whatslearn/reveal.tsx'),lay=src('app/layout.tsx');
test('wired in the root layout; no new dependency',()=>{assert.match(lay,/import '\.\/motion\.css'/);assert.match(lay,/<Reveal\/>/);const pkg=JSON.parse(src('package.json'));assert.ok(!Object.keys({...pkg.dependencies}).some(k=>/framer|gsap|aos|motion|lenis|scrollreveal/i.test(k)))});
test('hover is a small lift only for fine pointers; focus ring and pressed state do not depend on hover',()=>{
 assert.match(css,/@media \(hover:hover\) and \(pointer:fine\)/);assert.match(css,/translateY\(-2px\)/);assert.ok(!/translateY\(-(?:[4-9]|\d\d)px\)/.test(css),'lift never more than 3px');
 assert.match(css,/:focus-within\{box-shadow:0 0 0 3px #fff,0 0 0 6px #177349\}/);assert.match(css,/:active\{transform:scale\(\.985\)/);
 const hov=css.match(/@media \(hover:hover\) and \(pointer:fine\)\{([\s\S]*?)\n\}/)[1];const props=[...hov.matchAll(/\{([^}]*)\}/g)].flatMap(m=>m[1].split(';').map(d=>d.split(':')[0].trim()).filter(Boolean));assert.deepEqual([...new Set(props)].sort(),['box-shadow','transform'],'hover changes only transform and shadow, so nothing reflows');
});
test('reveal: hidden only under no-preference motion, only when script marked the block, never on the first screen; reduced motion shows everything at once',()=>{
 assert.match(css,/@media \(prefers-reduced-motion:no-preference\)\{\s*\.wl-reveal\{opacity:0/);assert.ok(!/^\.wl-reveal\{opacity:0/m.test(css),'not hidden outside the motion media query');
 assert.match(css,/@media \(prefers-reduced-motion:reduce\)\{[\s\S]*\.wl-reveal\{opacity:1;transform:none\}/);
 assert.match(rv,/prefers-reduced-motion: reduce/);assert.match(rv,/r\.top<innerHeight\*1\.0\)return/,'first screen is never hidden');assert.ok(!/scroll(Y|To|By)|wheel|preventDefault|parallax/i.test(rv.replace(/No scroll handling, no parallax[^\n]*/,'')),'no scroll hijacking');
 assert.match(rv,/Math\.min\(i,5\)\*70/,'stagger is short and capped');assert.match(rv,/classList\.remove\('wl-reveal','wl-in'\)/,'classes are removed after the reveal');
});
