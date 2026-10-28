const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');const h=require('./helpers/harness.cjs');
const d=h.load('components/whatslearn-app/games-data.ts');
test('app games: two per course with unique ids',()=>{const ids=d.games.map(g=>g.id);assert.equal(new Set(ids).size,8);for(const t of ['marketing','development','filmmaking','storytelling'])assert.equal(d.games.filter(g=>g.track===t).length,2)});
test('app games: every answer key points at real content',()=>{
 for(const p of d.hookFeed)assert.equal(typeof p.strong,'boolean');assert.ok(d.hookFeed.some(p=>p.strong)&&d.hookFeed.some(p=>!p.strong));
 for(const r of d.budgetRounds){assert.equal(r.ideal.length,d.channels.length);assert.equal(r.ideal.reduce((a,b)=>a+b,0),100)}
 for(const r of d.bugRounds)assert.ok(r.bug>=0&&r.bug<r.lines.length,r.title);
 for(const r of [...d.flowRounds.map(x=>x.steps),...d.shotRounds.map(x=>x.frames)])assert.equal(new Set(r).size,r.length);
 for(const n of d.shotQuiz)assert.ok(d.shotTypes[n]);
 for(const r of d.captionRounds){assert.ok(r.best>=0&&r.best<r.options.length);assert.equal(new Set(r.options).size,r.options.length)}
});
test('app games: challenge links only accept known games and clamp the score',()=>{const s=fs.readFileSync('components/whatslearn-app/app.tsx','utf8');assert.match(s,/games\.some\(x=>x\.id===g\)/);assert.match(s,/Math\.max\(0,Math\.min\(100/)});
