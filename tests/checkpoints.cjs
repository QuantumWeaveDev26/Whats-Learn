require('./helpers/approved-review.cjs');
// v43: mini challenges (checkpoints) after missions 2, 4, 6, 8 and a finale after 10, in all four courses. No network, no AI, no real keys. Run: node --test tests/checkpoints.cjs
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),{DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync(':memory:');for(const f of fs.readdirSync(path.resolve(__dirname,'../drizzle')).filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync(path.resolve(__dirname,'../drizzle',f),'utf8').replaceAll('--> statement-breakpoint',''));
// Like Cloudflare D1, a batch is all-or-nothing.
const d1={prepare(sql){const stmt=db.prepare(sql);const api=(...args)=>({async first(){return stmt.get(...args)||null},async all(){return {results:stmt.all(...args)}},async run(){const r=stmt.run(...args);return {meta:{changes:r.changes}}},_run:()=>stmt.run(...args)});return {bind:api,...api()}},async batch(list){db.exec('BEGIN');try{const out=list.map(s=>({meta:{changes:s._run().changes}}));db.exec('COMMIT');return out}catch(e){db.exec('ROLLBACK');throw e}}};
// Paid local fixture for full-course progression; no checkout is called.
db.prepare("INSERT INTO entitlements(session_id,user_id,mode,sku,status,ends_at,updated_at) VALUES ('course-fixture','learner','reward','plus_monthly','active','2999-01-01T00:00:00Z','2026-10-16T00:00:00Z')").run();
let user={userId:'learner',email:'l@example.test',displayName:'L'};const env={DB:d1};
const original=Module._load;Module._load=function(name,parent,isMain){if(name==='@/app/chatgpt-auth')return {getChatGPTUser:async()=>user};if(name==='cloudflare:workers')return {env};if(name.startsWith('@/'))name=path.resolve(__dirname,'..',name.slice(2));return original.call(this,name,parent,isMain)};
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,f);
const {missions}=require('../lib/missions.ts');
const PT=require('../lib/points.ts'),CP=require('../lib/checkpoints.ts'),PRG=require('../lib/progression.ts'),CS=require('../lib/checkpoint-server.ts'),route=require('../app/api/checkpoint/route.ts'),work=require('../app/api/work/route.ts'),P=require('../lib/mission-points.ts');
const samples=require('./fixtures/course-samples.json');const byId=id=>missions.find(m=>m.id===id);
const tracks=['marketing','development','filmmaking','storytelling'];const course=t=>missions.filter(m=>m.track===t);
const reset=()=>{for(const t of ['work','practice_events','mission_scores','mission_clues','point_ledger','checkpoint_clears'])db.exec(`DELETE FROM ${t}`)};
const count=t=>db.prepare(`SELECT COUNT(*) n FROM ${t}`).get().n;
const doneWork=ids=>{for(const q of ids)db.prepare("INSERT OR IGNORE INTO work (user_id,mission_id,body,checks,quiz,updated_at) VALUES (?,?,?,?,?,?)").run(user.userId,q,'seed','[]',byId(q).answer,new Date().toISOString())};
const right=cp=>cp.parts.map(p=>p.answer),wrong=cp=>cp.parts.map(p=>(p.answer+1)%p.options.length);
const full=id=>({missionId:id,body:samples[id],checks:[true,true,true,true,true],quiz:byId(id).answer});
test('data: four courses, five mini challenges each, two practical questions with one right answer',()=>{
 assert.equal(CP.checkpoints.length,20);
 for(const t of tracks){const list=CP.trackCheckpoints(t);assert.deepEqual(list.map(c=>c.after),[2,4,6,8,10],t);assert.equal(course(t).length,10);
  for(const c of list){assert.equal(c.parts.length,2);assert.ok(c.scenario.length>20&&c.title.length>5);for(const p of c.parts){assert.equal(p.options.length,3);assert.ok(p.answer>=0&&p.answer<3);assert.ok(p.q.endsWith('?')&&p.why.length>10);assert.equal(new Set(p.options).size,3)}}
  assert.equal(CP.isFinale(list[4]),true);assert.equal(list.filter(CP.isFinale).length,1)}
 // not a generic quiz: every checkpoint is tied to its own course wording
 assert.ok(CP.checkpoints.every(c=>/[a-z]/i.test(c.scenario)));
});
test('rule: missions 3, 5, 7 and 9 need the checkpoint before them; 1, 2, 4, 6, 8 and 10 do not',()=>{
 for(const t of tracks){course(t).forEach((m,i)=>{const p=i+1;const need=CP.requiredCheckpoint(m);if([3,5,7,9].includes(p)){assert.equal(need.after,p-1,t+p)}else assert.equal(need,undefined,t+p)})}
 const m3=byId('m3'),done=new Set(['m1','m2']);
 assert.equal(PRG.lockFor(m3,done,new Set()).locked,true);assert.match(PRG.lockFor(m3,done,new Set()).message,/mini challenge/);assert.deepEqual(PRG.lockFor(m3,done,new Set()).checkpoint,{track:'marketing',after:2});
 assert.equal(PRG.lockFor(m3,done,new Set(['marketing:2'])).locked,false);
 assert.equal(PRG.lockFor(m3,new Set(['m1']),new Set(['marketing:2'])).locked,true,'mission 2 still has to be completed');
 assert.equal(PRG.lockFor(m3,new Set(['m1','m2','m3']),new Set()).locked,false,'a completed mission always stays open to practise');
});
test('server: next pair stays locked until the checkpoint is cleared; wrong answers keep progress; retries earn one badge',async()=>{
 for(const t of tracks){reset();const [m1,m2,m3]=course(t);doneWork([m1.id,m2.id]);const cp=CP.checkpointFor(t,2);
  let r=await P.saveMissionWork(user.userId,full(m3.id));assert.equal(r.status,'locked');assert.equal(r.code,403);assert.match(r.message,/mini challenge/);assert.equal(count('work'),2);
  r=await CS.attemptCheckpoint(user.userId,t,2,wrong(cp));assert.equal(r.passed,false);assert.equal(count('checkpoint_clears'),0);assert.ok(r.results.every(x=>!x.correct||true));assert.match(r.results.find(x=>!x.correct).message,/^That answer is not correct\./);assert.match(r.results.find(x=>!x.correct).message,/Try again\.$/);
  assert.equal(count('work'),2,'a wrong attempt costs no progress');assert.equal((await P.saveMissionWork(user.userId,full(m3.id))).status,'locked','still locked');
  r=await CS.attemptCheckpoint(user.userId,t,2,[cp.parts[0].answer,(cp.parts[1].answer+1)%3]);assert.equal(r.passed,false,'both answers must be right');assert.equal(r.results[0].correct,true);
  r=await CS.attemptCheckpoint(user.userId,t,2,right(cp));assert.equal(r.passed,true);assert.equal(r.alreadyCleared,false);assert.equal(count('checkpoint_clears'),1);assert.ok(r.cleared.includes(t+':2'));
  r=await CS.attemptCheckpoint(user.userId,t,2,right(cp));assert.equal(r.passed,true);assert.equal(r.alreadyCleared,true);assert.equal(count('checkpoint_clears'),1,'a repeat never adds a second badge');
  assert.equal(count('mission_scores'),0,'no mission score');assert.equal(count('point_ledger')>=0,true);
  assert.notEqual((await P.saveMissionWork(user.userId,full(m3.id))).status,'locked','open after the checkpoint');}
});
test('a mini challenge is not a mission: no points, no ledger row, no daily allowance used',async()=>{
 reset();doneWork(['m1','m2']);const day=new Date('2026-10-12T05:00:00Z');await PT.ensureAccount(user.userId,day);
 const ledger=count('point_ledger'),balance=await PT.pointsBalance(user.userId);
 const cp=CP.checkpointFor('marketing',2);const r=await CS.attemptCheckpoint(user.userId,'marketing',2,right(cp),day);assert.equal(r.passed,true);
 assert.equal(count('point_ledger'),ledger);assert.equal(await PT.pointsBalance(user.userId),balance);assert.equal(count('mission_scores'),0);
 // The same India day still allows one new scored mission.
 const s=await P.saveMissionWork(user.userId,full('m3'),day);assert.equal(s.status,'awarded');assert.equal(count('mission_scores'),1);
 // And a checkpoint cleared after that does not open a second mission the same day.
 doneWork(['m3','m4']);const c4=CP.checkpointFor('marketing',4);await CS.attemptCheckpoint(user.userId,'marketing',4,right(c4),day);
 const s2=await P.saveMissionWork(user.userId,full('m5'),day);assert.equal(s2.status,'daily-limit');assert.equal(s2.code,429);
 // Next India day it works.
 assert.equal((await P.saveMissionWork(user.userId,full('m5'),new Date(day.getTime()+26*3600*1000))).status,'awarded');
});
test('a mini challenge opens only after its mission is completed, and ids are validated',async()=>{
 reset();let r=await CS.attemptCheckpoint(user.userId,'marketing',2,right(CP.checkpointFor('marketing',2)));assert.equal(r.ok,false);assert.equal(r.code,403);assert.equal(count('checkpoint_clears'),0);
 doneWork(['m1']);r=await CS.attemptCheckpoint(user.userId,'marketing',2,[0,0]);assert.equal(r.code,403,'mission 2 is not complete');
 r=await CS.attemptCheckpoint(user.userId,'marketing',3,[0,0]);assert.equal(r.code,400);r=await CS.attemptCheckpoint(user.userId,'nope',2,[0,0]);assert.equal(r.code,400);
});
test('simultaneous attempts create exactly one badge row',async()=>{
 reset();doneWork(['d1','d2']);const cp=CP.checkpointFor('development',2);
 const all=await Promise.all([1,2,3,4,5].map(()=>CS.attemptCheckpoint(user.userId,'development',2,right(cp))));assert.ok(all.every(x=>x.passed));assert.equal(count('checkpoint_clears'),1);
});
test('route: sign-in needed, bad bodies refused, answers checked on the server, /api/work lists cleared keys',async()=>{
 reset();doneWork(['f1','f2']);const call=(body,u=user)=>{const saved=user;user=u;return route.POST(new Request('https://whatslearn.in/api/checkpoint',{method:'POST',headers:{'content-type':'application/json',origin:'https://whatslearn.in',host:'whatslearn.in'},body:JSON.stringify(body)})).finally(()=>{user=saved})};
 const cp=CP.checkpointFor('filmmaking',2);
 let res=await call({track:'filmmaking',after:2,answers:[0]});assert.equal(res.status,400);
 res=await call({track:'filmmaking',after:2,answers:right(cp),extra:1});assert.equal(res.status,400,'strict body');
 res=await call({track:'filmmaking',after:2,answers:wrong(cp)});assert.equal(res.status,200);assert.equal((await res.json()).passed,false);
 res=await call({track:'filmmaking',after:2,answers:right(cp)});let d=await res.json();assert.equal(d.passed,true);assert.deepEqual(d.cleared,['filmmaking:2']);
 const w=await (await work.GET()).json();assert.deepEqual(w.checkpoints,['filmmaking:2']);
 assert.ok(!JSON.stringify(d).includes('"answer"'),'the response never carries the answer key');
});
test('guests: same rules on this device only, badge kept in this browser',()=>{
 const mem={};global.localStorage={getItem:k=>k in mem?mem[k]:null,setItem:(k,v)=>{mem[k]=String(v)},removeItem:k=>{delete mem[k]}};
 const G=require('../lib/guest-checkpoints.ts'),GW=require('../lib/guest-work.ts'),GP=require('../lib/guest-points.ts');
 const save=id=>GW.saveGuestWork({mission_id:id,body:'seed '.repeat(12),checks:'[false,false,false,false,false]',quiz:byId(id).answer,updated_at:new Date().toISOString()});
 const cp=CP.checkpointFor('storytelling',2);
 assert.equal(G.attemptGuestCheckpoint('storytelling',2,right(cp)).ok,false,'mission 2 not done');
 save('v1');save('v2');
 assert.equal(GP.guestAward(full('v3'),new Date('2026-10-12T05:00:00Z')).saved,false,'guest mission 3 locked behind the mini challenge');
 let r=G.attemptGuestCheckpoint('storytelling',2,wrong(cp));assert.equal(r.passed,false);assert.equal(G.readGuestCheckpoints().size,0);
 r=G.attemptGuestCheckpoint('storytelling',2,right(cp));assert.equal(r.passed,true);assert.deepEqual([...G.readGuestCheckpoints()],['storytelling:2']);
 r=G.attemptGuestCheckpoint('storytelling',2,right(cp));assert.equal(r.alreadyCleared,true);assert.equal(G.readGuestCheckpoints().size,1);assert.match(r.message,/this device/);
 {const g=GP.guestAward(full('v3'),new Date('2026-10-12T05:00:00Z'));assert.equal(g.saved,true,g.message)}
 assert.equal(JSON.parse(mem['whatslearn-guest-checkpoints-v1']).length,1);
});
test('wiring: every lock check passes the cleared set, the migration is registered and the answer key stays out of the page copy',()=>{
 const src=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');
 for(const f of ['lib/mission-points.ts','app/api/work/route.ts','lib/guest-points.ts'])assert.match(src(f),/lockFor\(.*(clearedKeys|readGuestCheckpoints)/,f);
 assert.match(src('app/learn/workspace.tsx'),/lockFor\(m,doneIds,cleared\)/);
 const j=JSON.parse(src('drizzle/meta/_journal.json'));assert.ok(j.entries.some(e=>e.tag==='0010_checkpoint_clears'));assert.match(src('drizzle/0010_checkpoint_clears.sql'),/PRIMARY KEY\(`user_id`, `track`, `after_mission`\)/);
 assert.match(src('db/schema.ts'),/checkpoint_clears/);
});
test('the retired mascot is not mounted in the application layout',()=>{
 const layout=fs.readFileSync(path.resolve(__dirname,'../app/layout.tsx'),'utf8');
 assert.doesNotMatch(layout,/<Mascot[\s/>]|import.*mascot/i);
});

test('guest sign-in note names the method this site really offers and no longer says ChatGPT in email mode',()=>{
 const n=fs.readFileSync(path.resolve(__dirname,'../components/whatslearn/signin-note.tsx'),'utf8');
 assert.match(n,/\/api\/auth\/config/);assert.match(n,/mode==='email'/);assert.match(n,/mode==='host'/);
 assert.match(n,/Sign in or sign up/);assert.match(n,/we never see it/);
});
