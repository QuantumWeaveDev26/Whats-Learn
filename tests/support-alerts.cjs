const test=require('node:test'),assert=require('node:assert/strict');
const h=require('./helpers/harness.cjs'),q=h.load('lib/quality/store.ts'),a=h.load('lib/quality/alerts.ts');
const configure=()=>Object.assign(h.env,{SUPPORT_ALERT_WEBHOOK_URL:'https://staff.example.test/alert',SUPPORT_ALERT_WEBHOOK_TOKEN:'s'.repeat(40)});
const support=()=>q.createSupportRequest('a',{category:'learning',description:'Private learner concern',idempotencyKey:'support-alert-synthetic-0001'});
test('support and report alerts are durable and idempotent without sending learner text',async()=>{
 h.reset();const first=await support();await support();assert.equal(h.db.prepare('SELECT COUNT(*) n FROM quality_alerts').get().n,1);
 const reply=await q.recordReply('a',{channel:'web',question:'Private question',answer:'Private answer'});await q.createReport('a',{replyId:reply.id,reason:'wrong_answer',idempotencyKey:'report-alert-synthetic-0001'});
 let calls=0;global.fetch=async()=>{calls++;throw Error()};assert.deepEqual(await a.dispatchAlerts(),{configured:false,accepted:0});assert.equal(calls,0);
 configure();global.fetch=async(url,opts)=>{calls++;assert.equal(url,'https://staff.example.test/alert');const body=JSON.parse(opts.body);assert.equal(opts.redirect,'error');assert.equal(opts.headers['Idempotency-Key'],body.eventId);assert.ok(!opts.body.includes('Private'));assert.ok(!opts.body.includes('description'));return new Response('',{status:202})};
 await a.dispatchAlerts();assert.equal(calls,1);assert.equal(h.db.prepare("SELECT COUNT(*) n FROM quality_alerts WHERE state='accepted'").get().n,1);await a.dispatchAlerts();assert.equal(calls,2);await a.dispatchAlerts();assert.equal(calls,2);assert.ok(first.id);
});
test('transport failures retry the same event and leases prevent duplicate dispatch',async()=>{
 h.reset();configure();await support();const at=new Date(),ids=[];global.fetch=async(_url,o)=>{ids.push(JSON.parse(o.body).eventId);throw Error('network')};await a.dispatchAlerts(at);await a.dispatchAlerts(at);assert.equal(ids.length,1);await a.dispatchAlerts(new Date(at.getTime()+301000));assert.equal(ids.length,2);assert.equal(ids[0],ids[1]);
 h.db.exec("UPDATE quality_alerts SET state='sending',lease_until=9999999999,next_at=0");await a.dispatchAlerts(new Date(at.getTime()+602000));assert.equal(ids.length,2);
});
test('service status has no credentials and account erasure removes pending alerts',async()=>{
 h.reset();configure();await support();await a.servicePulse('notices',new Date('2026-10-22T10:00:00Z'));const status=await a.alertStatus();assert.equal(status.pulses.notices,'2026-10-22T10:00:00.000Z');assert.ok(!JSON.stringify(status).includes('staff.example'));assert.ok(!JSON.stringify(status).includes('s'.repeat(40)));await h.load('lib/account-delete.ts').deleteAccountData('a');assert.equal(h.db.prepare('SELECT COUNT(*) n FROM quality_alerts').get().n,0);
});
test('only explicit manual retry reopens exhausted failed alerts',async()=>{
 h.reset();configure();await support();h.db.exec("UPDATE quality_alerts SET state='failed',attempts=5,next_at=9999999999");let calls=0;global.fetch=async()=>{calls++;return new Response('',{status:202})};await a.dispatchAlerts();assert.equal(calls,0);await a.retryFailedAlerts();await a.dispatchAlerts();assert.equal(calls,1);assert.equal(h.db.prepare('SELECT state FROM quality_alerts').get().state,'accepted');
});

test('a crashed fifth attempt becomes retryable after its lease expires',async()=>{
 h.reset();configure();await support();h.db.exec("UPDATE quality_alerts SET state='sending',attempts=5,lease_until=0");let calls=0;global.fetch=async()=>{calls++;return new Response('',{status:202})};await a.dispatchAlerts();assert.equal(calls,0);assert.equal(h.db.prepare('SELECT state FROM quality_alerts').get().state,'failed');await a.retryFailedAlerts();await a.dispatchAlerts();assert.equal(calls,1);
});
