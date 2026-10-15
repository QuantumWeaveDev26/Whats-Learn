// The free-membership reward for the highest title: off until the owner configures it, earned only by the real rule, one request per account,
// owner approval, no duplicate grants, and a separate account entitlement (not a payment). Run: node --test tests/rewards.cjs
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const H=require('./helpers/harness.cjs');
const cfg=H.load('lib/reward-config.ts'),R=H.load('lib/rewards.ts'),B=H.load('lib/billing/service.ts'),M=H.load('lib/missions.ts');
const route=H.load('app/api/rewards/route.ts'),admin=H.load('app/api/admin/rewards/route.ts');
const host=(id,email)=>H.setHeaders(new Headers({'oai-authenticated-user-id':id,'oai-authenticated-user-email':email}));
const day=n=>new Date(Date.UTC(2026,8,1+n)).toISOString().slice(0,10);
/** Seeds a learner who finished every mission of `track` on `days` consecutive days with `clues` clues in total. */
function seed(id,track,{days=10,clues=0,gap=false}={}){
 const ids=M.missions.filter(m=>m.track===track).map(m=>m.id);
 ids.forEach((m,i)=>{const d=day(i+(gap&&i>=5?1:0));H.db.prepare('INSERT INTO mission_scores (user_id,mission_id,day,understanding,practical,clues,deduction,points,created_at) VALUES (?,?,?,?,?,?,?,?,?)').run(id,m,d,25,75,i===0?clues:0,0,100,d);H.db.prepare("INSERT INTO work (user_id,mission_id,body,checks,quiz,updated_at) VALUES (?,?,?,?,?,?)").run(id,m,'my work','[]','0',d)});
}
const on=()=>H.reset({noProvider:true,env:{REWARD_PLAN:'plus_monthly',REWARD_DAYS:'30',BILLING_ADMIN_EMAIL:'owner@example.test'}});
test('the reward is OFF unless the owner sets a real plan and a length; a half-set or wrong value keeps it off',()=>{
 H.reset({noProvider:true});assert.equal(cfg.rewardConfig().enabled,false);
 H.reset({noProvider:true,env:{REWARD_PLAN:'plus_monthly'}});assert.equal(cfg.rewardConfig().enabled,false,'plan without a length');
 for(const bad of [{REWARD_PLAN:'free_forever',REWARD_DAYS:'30'},{REWARD_PLAN:'plus_monthly',REWARD_DAYS:'0'},{REWARD_PLAN:'plus_monthly',REWARD_DAYS:'999'},{REWARD_PLAN:'plus_monthly',REWARD_DAYS:'abc'}]){H.reset({noProvider:true,env:bad});assert.equal(cfg.rewardConfig().enabled,false,JSON.stringify(bad))}
 on();const c=cfg.rewardConfig();assert.equal(c.enabled,true);assert.equal(c.plan,'plus_monthly');assert.equal(c.days,30);
});
test('nothing can be claimed while the reward is off, even with the title earned',async()=>{
 H.reset({noProvider:true});seed('u1','marketing');const r=await R.claimReward('u1','u1@example.test');assert.equal(r.ok,false);assert.equal(r.status,503);
 assert.equal(H.db.prepare('SELECT COUNT(*) n FROM reward_claims').get().n,0);
});
test('only the highest title counts: clue use, an unfinished course or a broken day run does not qualify',async()=>{
 on();seed('clean','marketing');assert.ok(await R.earnedTopTitle('clean'));
 seed('clue','development',{clues:1});assert.equal(await R.earnedTopTitle('clue'),null,'a clue rules the title out (it earns the separate completion title)');
 seed('gap','filmmaking',{gap:true});assert.equal(await R.earnedTopTitle('gap'),null,'a missed day breaks the 10-day run');
 const ids=M.missions.filter(m=>m.track==='storytelling').map(m=>m.id).slice(0,9);ids.forEach((m,i)=>{H.db.prepare('INSERT INTO mission_scores VALUES (?,?,?,?,?,?,?,?,?)').run('part',m,day(i),25,75,0,0,100,'x');H.db.prepare("INSERT INTO work VALUES (?,?,?,?,?,?)").run('part',m,'w','[]','0','x')});
 assert.equal(await R.earnedTopTitle('part'),null,'9 of 10 missions is not enough');
 const r=await R.claimReward('gap','g@example.test');assert.equal(r.ok,false);assert.equal(r.status,403);
});
test('the claim: once per account; repeats and simultaneous requests create one row; the entitlement only appears after owner approval',async()=>{
 on();seed('u1','marketing');
 const all=await Promise.all([1,2,3,4,5].map(()=>R.claimReward('u1','u1@example.test')));
 assert.equal(all.filter(x=>x.created).length,1,'exactly one request is created');assert.equal(H.db.prepare('SELECT COUNT(*) n FROM reward_claims').get().n,1);
 assert.equal(H.db.prepare("SELECT status FROM reward_claims WHERE user_id='u1'").get().status,'pending');
 assert.equal(await B.activeEntitlement('u1'),null,'a request alone gives no membership');
 const a=await R.decideClaim('u1','approve');assert.equal(a.ok,true);const again=await R.decideClaim('u1','approve');assert.equal(again.status,409,'cannot be approved twice');
 const e=await B.activeEntitlement('u1');assert.equal(e.sku,'plus_monthly');assert.equal(e.mode,'reward');
 const days=(new Date(e.endsAt)-Date.now())/86400e3;assert.ok(days>29&&days<31,'30 days');
 assert.equal(H.db.prepare("SELECT COUNT(*) n FROM entitlements WHERE user_id='u1'").get().n,1);
 assert.equal((await R.claimReward('u1','u1@example.test')).created,false,'no second claim after it is granted');
 assert.equal(H.db.prepare('SELECT COUNT(*) n FROM billing_sessions').get().n,0,'a reward is not a fake payment');
});
test('decline and revoke; another account never receives the entitlement',async()=>{
 on();seed('a','marketing');seed('b','development');await R.claimReward('a','a@example.test');await R.claimReward('b','b@example.test');
 assert.equal((await R.decideClaim('b','decline')).ok,true);assert.equal(await B.activeEntitlement('b'),null);assert.equal((await R.decideClaim('b','approve')).status,409);
 await R.decideClaim('a','approve');assert.ok(await B.activeEntitlement('a'));assert.equal(await B.activeEntitlement('b'),null);
 assert.equal((await R.decideClaim('a','revoke')).ok,true);assert.equal(await B.activeEntitlement('a'),null);assert.equal((await R.decideClaim('a','revoke')).status,409);
 assert.equal((await R.decideClaim('nobody','approve')).status,404);
});
test('routes: signed-out 401; claim works for the owner of the title; the owner page is a 404 for everyone else',async()=>{
 on();seed('u1','marketing');
 H.setHeaders(new Headers());assert.equal((await H.call(route,'/api/rewards',{method:'GET'})).status,401);assert.equal((await H.call(route,'/api/rewards',{body:{}})).status,401);
 host('u1','u1@example.test');
 const st=await H.call(route,'/api/rewards',{method:'GET'});assert.deepEqual([st.json.enabled,st.json.state,!!st.json.earnedTitle],[true,'none',true]);
 assert.equal((await H.call(route,'/api/rewards',{body:{},origin:'https://evil.example'})).status,403);
 const c=await H.call(route,'/api/rewards',{body:{track:'forged',title:'forged'}});assert.equal(c.status,200);assert.equal(c.json.created,true);
 assert.equal(H.db.prepare("SELECT track FROM reward_claims WHERE user_id='u1'").get().track,'marketing','what the page sends is ignored');
 assert.equal((await H.call(route,'/api/rewards',{method:'GET'})).json.state,'pending');
 host('u2','u2@example.test');assert.equal((await H.call(route,'/api/rewards',{body:{}})).status,403,'someone without the title cannot claim');
 assert.equal((await H.call(admin,'/api/admin/rewards',{method:'GET'})).status,404);assert.equal((await H.call(admin,'/api/admin/rewards',{body:{userId:'u1',action:'approve'}})).status,404);
 assert.equal(H.db.prepare("SELECT status FROM reward_claims WHERE user_id='u1'").get().status,'pending');
 host('o','owner@example.test');const l=await H.call(admin,'/api/admin/rewards',{method:'GET'});assert.equal(l.json.claims.length,1);
 assert.equal((await H.call(admin,'/api/admin/rewards',{body:{userId:'u1',action:'approve'},origin:'https://evil.example'})).status,403);
 assert.equal((await H.call(admin,'/api/admin/rewards',{body:{userId:'u1',action:'approve'}})).status,200);
 assert.equal((await H.call(admin,'/api/admin/rewards',{body:{userId:'u1',action:'free'}})).status,400);
 host('u1','u1@example.test');assert.equal((await H.call(route,'/api/rewards',{method:'GET'})).json.state,'granted');
});
test('account deletion removes the claim; the reward is documented and defaults off in the example settings',()=>{
 const del=fs.readFileSync(path.join(H.ROOT,'lib/account-delete.ts'),'utf8');assert.match(del,/reward_claims/);
 const ex=fs.readFileSync(path.join(H.ROOT,'.env.example'),'utf8');if(/REWARD_PLAN/.test(ex))assert.match(ex,/^#?\s*REWARD_PLAN=\s*$/m);
});
