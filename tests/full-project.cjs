const test=require('node:test'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const h=require('./helpers/harness.cjs'),p=h.load('lib/full-project.ts');
const project=()=>({missionId:'d1',requestKey:randomUUID(),script:'test',files:[{name:'package.json',source:JSON.stringify({scripts:{test:'node test.js'},dependencies:{'is-number':'7.0.0'}})},{name:'test.js',source:'console.log(42)'}]});
function configure(){h.reset();Object.assign(h.env,{FULL_PROJECT_SERVICE_URL:'https://executor.example.test/api/run',FULL_PROJECT_SERVICE_TOKEN:'s'.repeat(40),FULL_PROJECT_DAILY_LIMIT:'10'})}
test('full projects reject secrets, traversal, duplicate files, URL dependencies and oversized artifacts',()=>{
 for(const name of ['.env','src/config.env','../app.js','node_modules/a.js','a//b','a/./b','.git/config','package-lock.json']){const x=project();x.files.push({name,source:'secret'});assert.throws(()=>p.validateProject(x))}
 let x=project();x.files.push({...x.files[0]});assert.throws(()=>p.validateProject(x));x=project();x.files[0].source=JSON.stringify({scripts:{test:'node test.js'},dependencies:{bad:'https://host/pkg.tgz'}});assert.throws(()=>p.validateProject(x));x=project();x.files[1].source='x'.repeat(100001);assert.throws(()=>p.validateProject(x));x=project();assert.equal(p.validateProject(x),p.validateProject({...x,files:[...x.files].reverse()}));
});
test('missing provider configuration cannot trigger an external run',async()=>{h.reset();let calls=0;global.fetch=async()=>{calls++;throw Error()};await assert.rejects(()=>p.startProject('a',project()),e=>e.status===503);assert.equal(calls,0)});
test('run reservation is idempotent, account owned, capped and never completes a mission',async()=>{
 configure();let calls=0;global.fetch=async()=>{calls++;return Response.json({commandId:'cmd-1'})};const input=project(),first=await p.startProject('a',input);assert.equal(first.state,'running');assert.equal((await p.startProject('a',input)).id,first.id);assert.equal(calls,1);
 await assert.rejects(()=>p.startProject('a',project()),e=>e.status===429);await assert.rejects(()=>p.readProject('b',first.id),e=>e.status===404);await assert.rejects(()=>p.startProject('a',{...input,files:[input.files[0],{name:'test.js',source:'changed'}]}),e=>e.status===409);
 global.fetch=async()=>Response.json({state:'completed',exitCode:0,output:'Test passed'});const done=await p.readProject('a',first.id);assert.equal(done.state,'completed');assert.equal(done.assessed,false);assert.equal(done.courseCompleted,false);for(const table of ['work','mission_scores','point_ledger'])assert.equal(h.db.prepare('SELECT COUNT(*) n FROM '+table).get().n,0);
});
test('unknown start is held without a second charge and expires; daily cap is global',async()=>{
 configure();let calls=0;global.fetch=async()=>{calls++;throw Error()};const x=project(),at=new Date('2026-10-22T10:00:00Z'),job=await p.startProject('a',x,at);assert.equal(job.state,'unknown');await p.startProject('a',x,at);assert.equal(calls,1);await assert.rejects(()=>p.readProject('a',job.id,true,at),e=>e.status===409);assert.equal((await p.readProject('a',job.id,false,new Date(at.getTime()+121000))).state,'expired');h.env.FULL_PROJECT_DAILY_LIMIT='1';await assert.rejects(()=>p.startProject('b',project(),at),e=>e.status===429);
});
test('confirmed stop cannot be overwritten by a delayed running response',async()=>{
 configure();global.fetch=async()=>Response.json({commandId:'cmd'});const job=await p.startProject('a',project());let release;global.fetch=async(_url,o)=>JSON.parse(o.body).action==='stop'?Response.json({state:'stopped'}):new Promise(r=>{release=()=>r(Response.json({state:'running'}))});const polling=p.readProject('a',job.id);await new Promise(r=>setImmediate(r));assert.equal((await p.readProject('a',job.id,true)).state,'stopped');release();assert.equal((await polling).state,'stopped');
});
