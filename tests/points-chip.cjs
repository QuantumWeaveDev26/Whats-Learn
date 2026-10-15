const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const src=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');
test('points chip: every state has clear wording and no balance is hard-coded',()=>{
 const c=src('components/whatslearn/points-chip.tsx');
 assert.match(c,/Points: loading/);assert.match(c,/Points could not load/);assert.match(c,/Retry/);assert.match(c,/guest \{guestPoints===1/);assert.match(c,/this browser only/);
 assert.ok(!/\b50\b/.test(c),'the chip never hard-codes the starting amount');
 assert.match(c,/role="status"|aria-live/);
});
test('learn page feeds the chip from the server balance and shows a status on failure',()=>{
 const p=src('app/learn/page.tsx');
 assert.match(p,/<PointsChip state=\{pointsState\}/);assert.match(p,/typeof d\.points\?\.balance==='number'/);assert.match(p,/'error'/);assert.match(p,/'guest'/);
});
test('shortened copy: no leftover duplicate link sentence and key terms kept',()=>{
 for(const f of ['lib/practical/marketing.json','lib/practical/storytelling.json'])assert.ok(!/never opened by the site\.[^"]*never opened/i.test(src(f)));
 const m=src('components/whatslearn/membership.tsx');assert.match(m,/renew/i);
});
