const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const h=require('./helpers/harness.cjs');
const read=file=>fs.readFileSync(file,'utf8');

test('the homepage gives one recommended free starting journey and a tangible example',()=>{
 const hero=read('components/whatslearn/visual-start.tsx'),home=read('app/page.tsx');
 assert.match(hero,/Start with a free challenge\. Then choose your course/);
 assert.match(hero,/starterExamples\[track\]\.after/);assert.match(hero,/Illustrative example/);
 assert.match(home,/href="#start" className="pill-button ink-button">Try the free starter/);
 assert.match(home,/href="#start" className="pill-button ink-button">Try my free challenge/);
});
test('starter practice is distinguished from course work without changing scoring',()=>{
 const hero=read('components/whatslearn/visual-start.tsx');
 assert.match(hero,/starter is separate from the 10 course tasks/);
 assert.match(hero,/does not increase your completed course missions/);
 assert.match(read('components/whatslearn/starter-workbench.tsx'),/Optional: plan your answer visually/);
 assert.doesNotMatch(hero,/Pick your spark|THE STARTER LAB|FIRST SPARK/);
});
test('plain onboarding words preserve editable journey choices and language handoff',()=>{
 const wizard=read('app/find-my-path/page.tsx');
 assert.match(wizard,/Choose how you prefer to learn/);assert.doesNotMatch(wizard,/Pick your vibe/);
 assert.match(wizard,/q.get\('language'\)/);assert.match(wizard,/rememberLanguage\(profile.language\)/);
 const guest=read('components/whatslearn/guest-starter-preview.tsx');
 assert.match(guest,/find-my-path\?track=/);assert.match(guest,/encodeURIComponent\(language\)/);
});
test('all four course outcomes are visible before expanding the course',()=>{
 const {programmes}=h.load('lib/programmes.ts');assert.equal(programmes.length,4);
 for(const p of programmes)assert.ok(p.finishedOutcome.length>25,p.id);
 const explorer=read('components/whatslearn/programme-explorer.tsx');
 assert.ok(explorer.indexOf('Create: {p.finishedOutcome}')<explorer.indexOf('selected===p.id&&'));
 assert.match(explorer,/FIRST 3 TASKS FREE/);
});
test('learning, human support and account assistance have distinct accessible destinations',()=>{
 const home=read('app/page.tsx');
 assert.match(home,/Account &amp; plan support/);assert.match(home,/Set up the learning mentor/);
 assert.match(home,/WhatsApp learning is optional/);
 assert.match(home,/href="\/support">Help/);
 assert.match(read('components/whatslearn/account-shell.tsx'),/href="\/support">Help/);
});
test('membership explains free access and paid continuation without changing pricing',()=>{
 const membership=read('components/whatslearn/membership.tsx');
 assert.match(membership,/first 3 tasks in each course free/);assert.match(membership,/tasks 4–10/);
 assert.match(membership,/saved work stays in My Creations when paid access ends/);
 assert.match(membership,/Selecting a plan shows its price and terms before payment/);
 for(const amount of [499,999,149])assert.ok(membership.includes(String(amount)));
});
test('saved work remains directly available in the learner dashboard',()=>{
 const workspace=read('app/learn/workspace.tsx');
 assert.match(workspace,/TabsTrigger[^>]*value="portfolio"[^>]*>.*?My Creations/);
 assert.match(workspace,/Your saved submissions/);
});
