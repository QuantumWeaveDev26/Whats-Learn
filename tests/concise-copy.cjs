const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=file=>fs.readFileSync(path.resolve(__dirname,'..',file),'utf8');
test('homepage answers stay short and course duration stays visible',()=>{
 const home=read('app/page.tsx'),hero=read('components/whatslearn/visual-start.tsx');
 const answers=[...home.matchAll(/\{q:'[^']+',a:'([^']+)'\}/g)].map(m=>m[1]);assert.equal(answers.length,5);
 for(const answer of answers)assert.ok(answer.split(/\s+/).length<=36,answer);
 assert.match(hero,/10-day foundation courses/);assert.match(hero,/first 3 per course free/);assert.match(hero,/One new mission a day/);
});
test('optional guidance stays available without taking over the main view',()=>{
 const workspace=read('app/learn/workspace.tsx'),membership=read('components/whatslearn/membership.tsx'),outcome=read('components/whatslearn/mission-outcome.tsx');
 assert.match(workspace,/<details className="dashboard-sidequest"><summary>Optional/);
 assert.match(workspace,/<details className="path-reason"><summary>/);
 assert.match(membership,/<details className="pricing-terms"><summary>Plan limits & billing details/);
 assert.match(membership,/Unused requests do not roll over/);assert.match(membership,/Cancel future renewals anytime/);
 assert.match(outcome,/Submit your work, actual test results and one improvement/);assert.match(outcome,/AI does not run your project or witness your test/);
});
