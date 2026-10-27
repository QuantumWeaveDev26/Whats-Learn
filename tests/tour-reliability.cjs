const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');const h=require('./helpers/harness.cjs');let tour;try{tour=h.load('lib/tour-target.ts')}catch{tour={}}
function fixture(){const frames=new Map(),timers=new Map(),events=new Map();let id=0,mutation,resize;global.MutationObserver=class{constructor(cb){mutation=cb}observe(){}disconnect(){}};global.ResizeObserver=class{constructor(cb){resize=cb}observe(){}disconnect(){}};global.document={body:{}};global.window={addEventListener:(n,f)=>events.set(n,f),removeEventListener:n=>events.delete(n),setTimeout:cb=>{timers.set(++id,cb);return id},clearTimeout:i=>timers.delete(i)};global.requestAnimationFrame=cb=>{frames.set(++id,cb);return id};global.cancelAnimationFrame=i=>frames.delete(i);global.getComputedStyle=()=>({visibility:'visible',display:'block'});return {frames,timers,events,flush(){const run=[...frames.values()];frames.clear();run.forEach(f=>f())},mutate(){mutation?.()},resize(){resize?.()},timeout(){const run=[...timers.values()];timers.clear();run.forEach(f=>f())}};}
const element=(width=100,height=50)=>({isConnected:true,tagName:'SECTION',parentElement:null,getBoundingClientRect:()=>({left:10,top:20,width,height,right:10+width,bottom:20+height})});
test('tour waits for both destination route and visible target before enabling the step',()=>{assert.equal(typeof tour.observeTourTarget,'function');const f=fixture();let route=false,target=element(0,0),ready=0;const w=tour.observeTourTarget({find:()=>target,routeReady:()=>route,onTarget:()=>ready++,onWaiting:()=>{},onMissing:()=>{}});assert.equal(ready,0);route=true;f.mutate();f.flush();assert.equal(ready,0);target=element();f.resize();f.flush();assert.equal(ready,1);w.dispose();});
test('a detached target is reacquired; missing target times out with retry and later recovers',()=>{assert.equal(typeof tour.observeTourTarget,'function');const f=fixture();let target=element(),firsts=[],missing=0;const w=tour.observeTourTarget({find:()=>target,routeReady:()=>true,onTarget:(_e,first)=>firsts.push(first),onWaiting:()=>{},onMissing:()=>missing++});assert.deepEqual(firsts,[true]);target.isConnected=false;target=null;f.mutate();f.flush();f.timeout();assert.equal(missing,1);w.retry();target=element();f.mutate();f.flush();assert.deepEqual(firsts,[true,true]);w.dispose();assert.equal(f.frames.size,0);assert.equal(f.timers.size,0);assert.equal(f.events.size,0);});
test('tour uses client navigation, visible view markers and no fixed startup delay or hard reload',()=>{const s=fs.readFileSync('components/whatslearn/website-tour.tsx','utf8');assert.doesNotMatch(s,/window.location.assign|setTimeout\(locate,120\)/);assert.match(s,/useRouter/);assert.match(s,/router.push\(/);assert.match(s,/router.prefetch\(/);assert.match(s,/whatslearn-tour-view/);assert.match(s,/disabled=\{phase==='moving'\}/);assert.match(fs.readFileSync('app/learn/workspace.tsx','utf8'),/data-tour-view=\{view\}/);});
test('tour launcher is bold and transitions respect reduced-motion preference',()=>{const s=fs.readFileSync('components/whatslearn/website-tour.css','utf8');assert.match(s,/font-weight:var\(--floating-action-font-weight\)/);assert.match(s,/background:var\(--floating-action-bg\)/);const shared=fs.readFileSync('app/globals.css','utf8');assert.match(shared,/--floating-action-bg:#087a4b/);assert.match(shared,/--floating-action-font-weight:700/);assert.match(shared,/--floating-action-font-size:14px/);assert.match(s,/height:var\(--floating-action-height\)/);assert.match(s,/bottom:calc\(var\(--floating-action-bottom\) \+ var\(--floating-action-height\) \+ 12px\)/);assert.match(s,/transition:left/);assert.match(s,/prefers-reduced-motion:reduce/);});

const {tourLayout}=h.load('lib/tour-layout.ts');
function box(left,top,width,height){return {left,top,width,height,right:left+width,bottom:top+height}}
test('small portrait tours scroll highlighted content above their cards',()=>{
 for(const [width,height,cardHeight,targetHeight] of [[320,568,260,166],[390,844,245,219],[320,568,260,222]]){
  const initial=box(20,400,width-40,targetHeight),a=tourLayout(initial,{width,height},cardHeight);
  const visible=tourLayout(box(initial.left,initial.top-a.scrollDelta,initial.width,initial.height),{width,height},cardHeight);
  assert.ok(visible.spotlight);assert.ok(visible.spotlight.top+visible.spotlight.height<=visible.card.top-20);
  assert.ok(visible.card.top>=16);assert.ok(visible.card.top+cardHeight<=height-16);
 }
});
test('landscape tour uses space beside the highlighted controls',()=>{
 const initial=box(414,-605,364,194),a=tourLayout(initial,{width:844,height:390},233);
 const visible=tourLayout(box(initial.left,initial.top-a.scrollDelta,364,194),{width:844,height:390},233);
 assert.equal(a.card.left,16);assert.ok(visible.spotlight.left>=a.card.left+360+20);assert.ok(visible.spotlight.top>=16);
});
test('oversize targets are clipped to the visible region without covering the card',()=>{
 const a=tourLayout(box(0,16,320,900),{width:320,height:568},260);
 assert.ok(a.spotlight);assert.ok(a.spotlight.top+a.spotlight.height<=a.card.top-20);
 assert.ok(a.spotlight.left+a.spotlight.width<=304);
});

test('launchers share their height and stack above the same bottom-right anchor',()=>{
 const shared=fs.readFileSync('app/globals.css','utf8'),css=fs.readFileSync('components/whatslearn/website-tour.css','utf8');
 assert.match(shared,/--floating-action-height:68px/);assert.match(shared,/--floating-action-height:52px/);
 assert.match(shared,/\.whatsapp-mentor-widget\{height:var\(--floating-action-height\);bottom:var\(--floating-action-bottom\)\}/);
 assert.match(css,/height:var\(--floating-action-height\)/);assert.match(css,/bottom:calc\(var\(--floating-action-bottom\) \+ var\(--floating-action-height\) \+ 12px\)/);assert.match(shared,/whatsapp-mentor-widget:hover\{transform:none/);assert.match(css,/website-tour-launch:hover\{transform:none/);
});
