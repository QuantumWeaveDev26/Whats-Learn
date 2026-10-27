const test=require('node:test'),assert=require('node:assert/strict');
const h=require('./helpers/harness.cjs');
const service=h.load('lib/billing/service.ts');
function setup(){
 h.reset({env:{RAZORPAY_KEY_ID:'rzp_test_synthetic',RAZORPAY_KEY_SECRET:'fake-secret'}});
 h.db.exec('DELETE FROM billing_sessions; DELETE FROM billing_plans');
 h.db.prepare('INSERT INTO billing_plans(sku,provider_id,state,updated_at) VALUES (?,?,?,?)').run('plus_monthly:19900','plan_synthetic','ready','2026-10-27');
 const id='11111111-1111-4111-8111-111111111111';
 h.db.prepare('INSERT INTO billing_sessions(id,user_id,sku,kind,quantity,amount,state,created_at,updated_at,mode,provider_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(id,'learner','plus_monthly','subscription','1','19900','paused','2026-10-27','2026-10-27','test','sub_synthetic');
 return id;
}
test('paused subscription prevents another checkout before any provider request',async()=>{
 setup();let calls=0;global.fetch=async()=>{calls++;return Response.json({id:'sub_duplicate'})};
 await assert.rejects(()=>service.createCheckout('learner','plus_monthly',1),/already exists/);
 assert.equal(calls,0);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM billing_sessions').get().n,1);
});
test('pause preserves only the existing paid period and resumption uses the provider expiry',async()=>{
 const id=setup(),end=Math.floor(Date.now()/1000)+86400;
 h.db.prepare('INSERT INTO entitlements(session_id,user_id,mode,sku,status,ends_at,updated_at) VALUES (?,?,?,?,?,?,?)').run(id,'learner','test','plus_monthly','active',new Date(end*1000).toISOString(),'2026-10-27');
 let state='paused';global.fetch=async()=>Response.json({id:'sub_synthetic',plan_id:'plan_synthetic',quantity:1,status:state,current_end:end});
 assert.equal((await service.syncSession(await service.ownedSession('learner',id))).paidAccessActivated,true);
 assert.equal((await service.activeEntitlement('learner')).endsAt,new Date(end*1000).toISOString());
 h.db.prepare('DELETE FROM entitlements').run();
 assert.equal((await service.syncSession(await service.ownedSession('learner',id))).paidAccessActivated,false);
 assert.equal(await service.activeEntitlement('learner'),null);
 state='active';assert.equal((await service.syncSession(await service.ownedSession('learner',id))).paidAccessActivated,true);
 assert.equal((await service.activeEntitlement('learner')).endsAt,new Date(end*1000).toISOString());
});
