const test=require('node:test'),assert=require('node:assert/strict');
const h=require('./helpers/harness.cjs');
let q;try{q=h.load('lib/quality/store.ts')}catch{q={}}
const input={channel:'web',missionId:'m1',question:'How do I test this?',answer:'Run the success case and a failure case.'};
function clean(){h.reset();for(const table of ['quality_audit','quality_reports','quality_support','quality_events','quality_replies'])h.db.exec('DELETE FROM '+table)}
test('quality store exposes bounded persisted reply receipts',async()=>{assert.equal(typeof q.recordReply,'function');clean();const r=await q.recordReply('a',input);assert.ok(r.id);assert.equal(h.db.prepare('SELECT user_id FROM quality_replies WHERE id=?').get(r.id).user_id,'a')});
test('only an owned reply can be reported, retries return one record, and report snapshots survive receipt pruning',async()=>{
 assert.equal(typeof q.createReport,'function');clean();const reply=await q.recordReply('a',input),body={replyId:reply.id,reason:'wrong_answer',note:'Please check this.',idempotencyKey:'synthetic-key-0001'};
 await assert.rejects(()=>q.createReport('b',body),e=>e.status===404);
 const one=await q.createReport('a',body),two=await q.createReport('a',body);assert.equal(one.id,two.id);assert.equal(one.status,'received');assert.equal(h.db.prepare('SELECT COUNT(*) n FROM quality_reports').get().n,1);
 h.db.prepare('UPDATE quality_replies SET created_at=?').run(new Date(Date.now()-8*864e5).toISOString());await q.pruneQualityRecords(new Date());
 assert.equal(h.db.prepare('SELECT COUNT(*) n FROM quality_replies').get().n,0);assert.equal(h.db.prepare('SELECT answer_excerpt FROM quality_reports WHERE id=?').get(one.id).answer_excerpt,input.answer);
});
test('report and support limits are enforced before persistence',async()=>{
 assert.equal(typeof q.createSupportRequest,'function');clean();const reply=await q.recordReply('a',input);
 await assert.rejects(()=>q.createReport('a',{replyId:reply.id,reason:'invented',note:'',idempotencyKey:'synthetic-key-0002'}),e=>e.status===400);
 await assert.rejects(()=>q.createReport('a',{replyId:reply.id,reason:'too_long',note:'a'.repeat(501),idempotencyKey:'synthetic-key-0002'}),e=>e.status===400);
 await assert.rejects(()=>q.createSupportRequest('a',{category:'learning',description:'a'.repeat(2001),idempotencyKey:'synthetic-key-0003'}),e=>e.status===400);
 assert.equal(h.db.prepare('SELECT COUNT(*) n FROM quality_reports').get().n,0);
});
test('support requests validate attachment ownership and duplicate retries',async()=>{
 assert.equal(typeof q.createSupportRequest,'function');clean();const reply=await q.recordReply('a',input),report=await q.createReport('a',{replyId:reply.id,reason:'not_helpful',note:'',idempotencyKey:'synthetic-key-0004'});
 const body={category:'mentor',description:'I need a person to explain the task.',reportId:report.id,idempotencyKey:'synthetic-key-0005'};
 await assert.rejects(()=>q.createSupportRequest('b',body),e=>e.status===404);const a=await q.createSupportRequest('a',body),b=await q.createSupportRequest('a',body);assert.equal(a.id,b.id);
});
test('retention removes expired events and resolved cases; account erasure removes remaining owned quality records',async()=>{
 assert.equal(typeof q.pruneQualityRecords,'function');clean();const r=await q.recordReply('a',input),report=await q.createReport('a',{replyId:r.id,reason:'wrong_language',note:'',idempotencyKey:'synthetic-key-0006'});await q.createSupportRequest('a',{category:'learning',description:'I would like help.',idempotencyKey:'synthetic-key-0007'});
 const old=new Date(Date.now()-91*864e5).toISOString();h.db.prepare("UPDATE quality_reports SET status='resolved',resolved_at=? WHERE id=?").run(old,report.id);h.db.prepare("INSERT INTO quality_events(id,user_id,channel,category,correlation_id,created_at) VALUES ('e','a','web','evaluation_failed','correlation',?)").run(old);
 await q.pruneQualityRecords(new Date());assert.equal(h.db.prepare('SELECT COUNT(*) n FROM quality_reports').get().n,0);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM quality_events').get().n,0);
 await h.load('lib/account-delete.ts').deleteAccountData('a');assert.equal(h.db.prepare('SELECT COUNT(*) n FROM quality_support').get().n,0);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM quality_replies').get().n,0);
});
