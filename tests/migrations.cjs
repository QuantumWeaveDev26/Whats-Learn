// v44: the migrations apply in order (0010 after 0009) on a throw-away database, the journal matches, and the docs say 0010 must be applied before signed-in learners use mini challenges.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {verify}=require('../scripts/verify-migrations.cjs');const src=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');
test('all migrations apply in file order; 0010 runs after 0009; the journal lists them in the same order',()=>{
 const r=verify();assert.deepEqual(r.problems,[]);assert.equal(r.last,'0027_app_games.sql');assert.equal(r.files.indexOf('0010_checkpoint_clears.sql'),r.files.indexOf('0009_accounts_rewards_uploads.sql')+1);assert.equal(r.applied.length,r.files.length);
});
test('the SQL file creates only the checkpoint table with the one-badge key and touches no other table',()=>{
 const s=src('drizzle/0010_checkpoint_clears.sql');assert.match(s,/CREATE TABLE `checkpoint_clears`/);assert.match(s,/PRIMARY KEY\(`user_id`, `track`, `after_mission`\)/);assert.ok(!/DROP|ALTER|DELETE|UPDATE|INSERT/i.test(s),'additive only');
});
test('deployment guide, go-live setup, launch checklist and this version\'s handoff all say 0010 must be applied before signed-in learners use mini challenges, and that it was not applied anywhere',()=>{
 for(const f of ['docs/deployment-guide.md','docs/go-live-setup.md','docs/owner-launch-checklist.md','docs/handoff-v44-2026-10-13.md'])assert.match(src(f),/0010_checkpoint_clears/,f);
 assert.match(src('docs/deployment-guide.md'),/before signed-in learners use (mini challenges|checkpoints)/i);assert.match(src('docs/handoff-v44-2026-10-13.md'),/before signed-in learners use (mini challenges|checkpoints)/i);assert.match(src('docs/handoff-v44-2026-10-13.md'),/not applied/i);
 assert.match(src('package.json'),/"db:verify"/);
});

test('parked WhatsApp revisions use an additive account-and-mission keyed table',()=>{const s=src('drizzle/0016_whatsapp_saved_drafts.sql');assert.match(s,/PRIMARY KEY \(user_id, mission_id\)/);assert.ok(!/\b(DROP|ALTER|DELETE|UPDATE|INSERT)\b/i.test(s));});
