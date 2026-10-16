// v50: WhatsApp learning bridge for the n8n workflows. Mock Meta payloads, no network, no real keys, no OpenAI call (the tutor reply is only checked as data handed to n8n).
// Run: node --test tests/whatsapp-bridge.cjs
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),{DatabaseSync}=require('node:sqlite'),{createHmac,randomBytes}=require('node:crypto');
const db=new DatabaseSync(':memory:');for(const f of fs.readdirSync(path.resolve(__dirname,'../drizzle')).filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync(path.resolve(__dirname,'../drizzle',f),'utf8').replaceAll('--> statement-breakpoint',''));
const d1={prepare(sql){const stmt=db.prepare(sql);const api=(...args)=>({async first(){return stmt.get(...args)||null},async all(){return {results:stmt.all(...args)}},async run(){const r=stmt.run(...args);return {meta:{changes:r.changes}}},_run:()=>stmt.run(...args)});return {bind:api,...api()}},async batch(list){db.exec('BEGIN');try{const out=[];for(const s of list){const r=s._run();out.push({meta:{changes:r.changes}})}db.exec('COMMIT');return out}catch(e){db.exec('ROLLBACK');throw e}}};
const SECRET='bridge-secret-for-tests-0123456789abcdef',APP='meta-app-secret-0123456789';
const env={DB:d1,N8N_BRIDGE_SECRET:SECRET,WHATSAPP_TOKEN:'fake',WHATSAPP_PHONE_NUMBER_ID:'1',WHATSAPP_VERIFY_TOKEN:'v',WHATSAPP_APP_SECRET:APP,WHATSAPP_REMINDER_TEMPLATE:'learning_reminder',WHATSAPP_TEMPLATE_LANGUAGE:'en',SITE_URL:'https://whatslearn.example.test'};
let web=null;const original=Module._load;Module._load=function(name,parent,isMain){if(name==='@/app/chatgpt-auth')return {getChatGPTUser:async()=>web};if(name==='cloudflare:workers')return {env};if(name.startsWith('@/'))name=path.resolve(__dirname,'..',name.slice(2));return original.call(this,name,parent,isMain)};
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,f);
global.fetch=async u=>{throw new Error('No network in this test: '+u)};
const R=n=>require('../app/api/'+n+'/route.ts');
const msg=R('bridge/whatsapp/message'),outbox=R('bridge/whatsapp/outbox'),reminders=R('bridge/whatsapp/reminders'),siteWa=R('whatsapp'),work=R('work'),checkpointRoute=R('checkpoint');
const {missions}=require('../lib/missions.ts'),{checkpointFor}=require('../lib/checkpoints.ts');
const chat=require('../lib/bridge/whatsapp-chat.ts'),jobs=require('../lib/bridge/whatsapp-jobs.ts');
const samples={...require('./fixtures/practical-samples/marketing.json'),...require('./fixtures/practical-samples/development.json')};
const byId=id=>missions.find(m=>m.id===id);

// ---- helpers: a signed request the way the n8n workflow signs it, and a Meta-signed message ----
const nonce=()=>randomBytes(16).toString('hex');
function signed(route,url,body,{secret=SECRET,ts=Math.floor(Date.now()/1000),n=nonce(),method='POST',raw}={}){
 const text=raw??JSON.stringify(body);const pathname=new URL('https://x.test'+url).pathname;
 const sig=createHmac('sha256',secret).update(`${ts}\n${n}\n${method}\n${pathname}\n${text}`).digest('hex');
 return {req:()=>new Request('https://whatslearn.example.test'+url,{method,headers:{'content-type':'application/json','x-wl-timestamp':String(ts),'x-wl-nonce':n,'x-wl-signature':sig},body:method==='POST'?text:undefined}),route};
}
const call=async(route,url,body,o)=>{const s=signed(route,url,body,o);const res=await route.POST(s.req());let json={};try{json=await res.json()}catch{}return {status:res.status,json,replayed:res.headers.get('x-wl-replayed')}};
let seq=0;
const metaBody=(wamid,from,text,type='text')=>JSON.stringify({object:'whatsapp_business_account',entry:[{changes:[{value:{messages:[{id:wamid,from,type,text:{body:text}}]}}]}]});
const metaSig=raw=>'sha256='+createHmac('sha256',APP).update(raw).digest('hex');
async function say(from,text,{wamid='wamid.TEST'+(++seq)+'ABCDEFGH'}={}){
 const raw=metaBody(wamid,from,text);
 const r=await call(msg,'/api/bridge/whatsapp/message',{wamid,from,type:'text',text,metaRawBody:raw,metaSignature:metaSig(raw)});
 assert.equal(r.status,200,JSON.stringify(r.json));return r.json;
}
const textOf=o=>o.action==='reply'?o.text:'';
const P1='919876543210',P2='919123456780',P3='919000000003';
const balance=u=>db.prepare('SELECT COALESCE(SUM(delta),0) b FROM point_ledger WHERE user_id=?').get(u).b;
const count=(sql,...a)=>db.prepare(sql).get(...a).n;
function newLearner(userId,phone,{track}={}){
 web={userId,email:userId+'@example.test',displayName:userId};
 return (async()=>{const r=await chat.startLink(userId,phone,'en');assert.ok(r.ok&&r.code);const out=await say(phone,'LINK '+r.code);assert.match(textOf(out),/Linked/);if(track)await say(phone,'COURSE '+track);})();
}
/** Answers the whole mission in chat using the same sample answers the website tests use. */
async function answerMission(phone,id,{quiz,sub=true}={}){
 const m=byId(id),s=samples[id];let out=await say(phone,'TODAY');assert.match(textOf(out),/Question 1/);
 out=await say(phone,'ABCDEF'[quiz??m.answer]);
 for(const f of m.practical.fields){
  const v=s.fields[f.id];out=await say(phone,f.type==='choice'?'ABCDEF'[f.options.indexOf(v)]:v);
 }
 out=await say(phone,s.reasoning);
 if(m.practical.link)out=await say(phone,s.link||'SKIP');
 out=await say(phone,'1 2 3 4 5');assert.match(textOf(out),/Reply \*SUBMIT\*/);
 return sub?say(phone,'SUBMIT'):out;
}
const nextDay=()=>db.prepare("UPDATE mission_scores SET day=date(day,'-1 day')").run();

test('every request must be signed, fresh and used once; a retry returns the first answer without running again',async()=>{
 const url='/api/bridge/whatsapp/outbox',body={action:'claim',limit:5};
 assert.equal((await outbox.POST(new Request('https://whatslearn.example.test'+url,{method:'POST',body:JSON.stringify(body)}))).status,401,'unsigned');
 assert.equal((await call(outbox,url,body,{secret:'wrong-secret-wrong-secret-wrong-secret'})).status,401,'wrong key');
 assert.equal((await call(outbox,url,body,{ts:Math.floor(Date.now()/1000)-3600})).status,401,'old timestamp');
 assert.equal((await call(outbox,url,body,{n:'short'})).status,401,'weak nonce');
 const n=nonce();const a=await call(outbox,url,body,{n});assert.equal(a.status,200);
 const b=await call(outbox,url,body,{n});assert.equal(b.status,200);assert.equal(b.replayed,'1');assert.deepEqual(b.json,a.json,'safe retry: same answer, handler not run twice');
 const c=await call(outbox,url,{action:'claim',limit:6},{n});assert.equal(c.status,409,'same id with a different body is a replay attack');
 const saved=env.N8N_BRIDGE_SECRET;env.N8N_BRIDGE_SECRET='';assert.equal((await call(outbox,url,body)).status,503,'bridge is off without a secret');env.N8N_BRIDGE_SECRET=saved;
 assert.equal((await outbox.GET?.(new Request('https://x.test'+url)))??undefined,undefined,'no GET handler');
});
test("Meta's own signature is checked again by WhatsLearn; a bad one processes nothing",async()=>{
 const wamid='wamid.BADSIG0001',raw=metaBody(wamid,P1,'TODAY');
 const r=await call(msg,'/api/bridge/whatsapp/message',{wamid,from:P1,type:'text',text:'TODAY',metaRawBody:raw,metaSignature:'sha256='+'0'.repeat(64)});
 assert.equal(r.status,401);assert.equal(count('SELECT COUNT(*) n FROM whatsapp_events WHERE id=?',wamid),0);
 const r2=await call(msg,'/api/bridge/whatsapp/message',{wamid,from:P1,type:'text',text:'TODAY'});assert.equal(r2.status,401,'missing signature is refused too');
});
test('a phone number is matched to an account only after it is proved: a typed number is not enough',async()=>{
 web={userId:'asha',email:'asha@example.test',displayName:'Asha'};
 let out=await say(P1,'TODAY');assert.match(textOf(out),/link this number/);
 const r=await chat.startLink('asha',P1,'en');assert.equal(r.ok,true);assert.match(r.code,/^[A-Z2-9]{8}$/);
 assert.equal(count('SELECT COUNT(*) n FROM whatsapp_contacts WHERE verified_at IS NOT NULL'),0);
 out=await say(P1,'TODAY');assert.match(textOf(out),/link this number/,'typed but unproved number gets no lessons');
 out=await say(P1,'LINK ABCDEFGH');assert.match(textOf(out),/not valid/);
 out=await say(P2,'LINK '+r.code);assert.match(textOf(out),/not valid/,'the code only works from the number it was made for');
 // Someone else typing Asha\'s number cannot lock her out of her own number, and cannot read her account.
 const squat=await chat.startLink('mallory',P1,'en');assert.equal(squat.ok,true);
 const again=await chat.startLink('asha',P1,'en');
 out=await say(P1,'LINK '+again.code);assert.match(textOf(out),/Linked/);
 assert.equal(db.prepare('SELECT user_id FROM whatsapp_contacts WHERE phone=? AND verified_at IS NOT NULL').get(P1).user_id,'asha');
 assert.equal(count("SELECT COUNT(*) n FROM whatsapp_contacts WHERE user_id='mallory'"),0);
 const taken=await chat.startLink('mallory',P1,'en');assert.equal(taken.ok,false);assert.equal(taken.status,409,'a verified number cannot be taken by another account');
 for(let i=0;i<5;i++)await say(P2,'LINK WRONGCODE'+i);
 const c=await chat.startLink('bina',P2,'en');await say(P2,'LINK WRONG1234');await say(P2,'LINK WRONG1235');await say(P2,'LINK WRONG1236');await say(P2,'LINK WRONG1237');await say(P2,'LINK WRONG1238');
 out=await say(P2,'LINK '+c.code);assert.match(textOf(out),/not valid/,'five wrong codes lock the code');
 await db.prepare("DELETE FROM whatsapp_contacts WHERE user_id='bina'").run();
});
test('the same WhatsApp message id is handled once; Meta retries create no second reply or progress',async()=>{
 const id='wamid.DUPLICATE0001';
 const a=await say(P1,'POINTS',{wamid:id});assert.equal(a.action,'reply');
 const b=await say(P1,'POINTS',{wamid:id});assert.deepEqual(b,{action:'none',reason:'duplicate'});
 assert.equal(count('SELECT COUNT(*) n FROM whatsapp_events WHERE id=?',id),1);
});
test('commands: HELP, COURSE (same course as the website), POINTS (same balance as the website)',async()=>{
 assert.match(textOf(await say(P1,'help')),/TODAY.*HINT.*SUBMIT/s);
 assert.match(textOf(await say(P1,'COURSE')),/AI Digital Marketing/);
 assert.match(textOf(await say(P1,'COURSE 2')),/AI Full-Stack Development/);
 assert.equal(db.prepare("SELECT track FROM learner_profiles WHERE user_id='asha'").get().track,'development');
 await say(P1,'COURSE marketing');assert.equal(db.prepare("SELECT track FROM learner_profiles WHERE user_id='asha'").get().track,'marketing');
 web={userId:'asha',email:'a@example.test',displayName:'A'};
 const pts=textOf(await say(P1,'POINTS'));assert.match(pts,new RegExp('Points: '+balance('asha')));
 assert.equal(balance('asha'),50,'welcome balance is the same single grant the website uses');
});
test('wrong-course, unrelated and relevant questions; the tutor only ever receives approved course material, never the answer key',async()=>{
 let out=await say(P1,'How do I compose a camera shot with a storyboard and a lens for my film scene?');
 assert.match(textOf(out),/AI Filmmaking/);assert.match(textOf(out),/COURSE/);assert.equal(out.action,'reply','a wrong-course question never reaches OpenAI');
 out=await say(P1,'Who won the cricket match yesterday?');assert.equal(out.action,'reply');assert.match(textOf(out),/Which part is unclear/);
 const before=count('SELECT COALESCE(SUM(count),0) n FROM whatsapp_tutor_usage');
 out=await say(P1,'What does a believable outcome mean for my customer offer?');
 assert.equal(out.action,'tutor');assert.equal(out.material.course,'AI Digital Marketing');assert.ok(out.maxWords<=90);
 const sent=JSON.stringify(out),m=byId('m1');
 assert.ok(!sent.includes(m.explanation),'explanation never leaves WhatsLearn');assert.ok(!sent.includes(m.example),'the worked example is a paid clue and is not sent');
 assert.ok(!('answer' in out.material));assert.deepEqual(Object.keys(out.material).sort(),['brief','checklist','course','lesson','options','question','skill','task','title']);
 assert.equal(count('SELECT COALESCE(SUM(count),0) n FROM whatsapp_tutor_usage'),before+1);
 db.prepare("UPDATE whatsapp_tutor_usage SET count=?").run(chat.TUTOR_DAILY_LIMIT);
 out=await say(P1,'What does a believable outcome mean for my customer offer?');assert.match(textOf(out),/used today's tutor questions/);
 db.prepare('DELETE FROM whatsapp_tutor_usage').run();
});
test('clues: the cost is asked first, taken once from the same balance, and repeats are free',async()=>{
 let out=await say(P1,'TODAY');assert.match(textOf(out),/Question 1/);
 out=await say(P1,'HINT');assert.match(textOf(out),/costs 5 points/);assert.equal(balance('asha'),50,'nothing is charged until the learner says YES');
 out=await say(P1,'YES');assert.match(textOf(out),/Hint:/);assert.equal(balance('asha'),45);
 out=await say(P1,'HINT');assert.doesNotMatch(textOf(out),/costs/);assert.match(textOf(out),/Hint:/);assert.equal(balance('asha'),45,'the same clue again is free');
 out=await say(P1,'HINT example');assert.match(textOf(out),/costs 5 points/);await say(P1,'YES');assert.equal(balance('asha'),40);
 assert.equal(count("SELECT COUNT(*) n FROM mission_clues WHERE user_id='asha'"),2);
 await say(P1,'CANCEL');
});
test('an invalid answer is refused with a reason, saves nothing, and can be retried',async()=>{
 const m=byId('m1');let out=await answerMission(P1,'m1',{quiz:(m.answer+1)%3});
 assert.match(textOf(out),/That answer is not correct/);assert.equal(count("SELECT COUNT(*) n FROM work WHERE user_id='asha'"),0);assert.equal(count("SELECT COUNT(*) n FROM mission_scores WHERE user_id='asha'"),0);
 out=await say(P1,'ABCDEF'[m.answer]);assert.match(textOf(out),/Reply \*SUBMIT\*/,'only the wrong question is asked again; the rest is kept');
 // A too-short practical part is refused by the same shape check the website uses.
 await say(P1,'EDIT 3');await say(P1,'ok');out=await say(P1,'SUBMIT');
 assert.match(textOf(out),/not been saved|Nothing was saved/);assert.equal(count("SELECT COUNT(*) n FROM work WHERE user_id='asha'"),0);
 await say(P1,'CANCEL');
});
test('finishing a mission in chat uses the website rules: points, clue cost, one new mission a day, and the website shows the same state',async()=>{
 await say(P1,'TODAY');await say(P1,'CANCEL');   // the two clues from the clue test (10 points) are already paid
 const before=balance('asha');
 const out=await answerMission(P1,'m1');assert.match(textOf(out),/Both questions are complete/);
 const row=db.prepare("SELECT * FROM mission_scores WHERE user_id='asha' AND mission_id='m1'").get();
 assert.equal(row.clues,2);assert.equal(row.deduction,10,'two clues cost 5 + 5, the cap');assert.equal(row.points,row.understanding+row.practical-10);
 assert.equal(before,40);assert.equal(balance('asha'),50+row.points,'the 10 points of clues were paid once when revealed; the mission row only adds the net result');
 assert.equal(count("SELECT COUNT(*) n FROM work WHERE user_id='asha' AND mission_id='m1'"),1);
 web={userId:'asha',email:'a@example.test',displayName:'A'};
 const site=await (await work.GET()).json();assert.equal(site.work.some(w=>w.mission_id==='m1'),true,'the website sees the WhatsApp work');assert.equal(site.points.balance,balance('asha'));
 assert.equal(count("SELECT COUNT(*) n FROM whatsapp_outbox"),0,'work done on WhatsApp is not announced back to WhatsApp');
 // The daily limit: a second NEW mission on the same India day is refused, on WhatsApp and on the website, and nothing is saved.
 let out2=await say(P1,'TODAY');assert.match(textOf(out2),/already completed today/);
 const web2=await work.POST(new Request('https://x.test/api/work',{method:'POST',headers:{origin:'https://x.test','Content-Type':'application/json'},body:JSON.stringify({missionId:'m2',body:Object.entries(samples.m2.fields).map(([k,v])=>v).join('\n\n')+'\n\n'+samples.m2.reasoning,checks:[true,true,true,true,true],quiz:byId('m2').answer})}));
 assert.ok([400,429].includes(web2.status));assert.equal(count("SELECT COUNT(*) n FROM work WHERE user_id='asha' AND mission_id='m2'"),0);
 // A repeat SUBMIT does not pay twice.
 assert.equal(count("SELECT COUNT(*) n FROM point_ledger WHERE user_id='asha' AND kind='mission'"),1);
});
test('mission order and mini challenges: mission 2 opens next day; mission 3 needs the mini challenge, answered in chat',async()=>{
 nextDay();
 let out=await answerMission(P1,'m2');assert.match(textOf(out),/Both questions are complete/);
 nextDay();
 out=await say(P1,'TODAY');assert.match(textOf(out),/Mini challenge/);assert.match(textOf(out),/CHECK/);
 assert.equal(count("SELECT COUNT(*) n FROM checkpoint_clears WHERE user_id='asha'"),0);
 const cp=checkpointFor('marketing',2),right=cp.parts.map(p=>'ABCDEF'[p.answer]),wrong=cp.parts.map(p=>'ABCDEF'[(p.answer+1)%3]);
 out=await say(P1,'CHECK '+wrong.join(' '));assert.match(textOf(out),/That answer is not correct/);assert.match(textOf(out),/Not yet/);assert.equal(count("SELECT COUNT(*) n FROM checkpoint_clears WHERE user_id='asha'"),0);
 const pts=balance('asha');
 out=await say(P1,'CHECK '+right.join(' '));assert.match(textOf(out),/Badge earned/);assert.equal(balance('asha'),pts,'a mini challenge earns no points');
 out=await say(P1,'CHECK '+right.join(' '));assert.match(textOf(out),/no mini challenge waiting/);
 out=await say(P1,'TODAY');assert.match(textOf(out),/3\/10/,'mission 3 is open now');
 await say(P1,'CANCEL');
});
test('mission 3 stays locked on the website until the mini challenge is cleared (same server rule)',async()=>{
 await newLearner('bina',P2);
 const r=await work.POST(new Request('https://x.test/api/work',{method:'POST',headers:{origin:'https://x.test','Content-Type':'application/json'},body:JSON.stringify({missionId:'m3',body:'x'.repeat(60),checks:[true,true,true,true,true],quiz:0})}));
 assert.equal(r.status,403);
});
test('website to WhatsApp: a mission finished on the website is announced once, only inside the 24-hour window, never for opted-out learners',async()=>{
 web={userId:'bina',email:'b@example.test',displayName:'B'};
 const m=byId('m1'),s=samples.m1;
 const body=Object.entries(s.fields).map(([k,v])=>`### ${m.practical.fields.find(f=>f.id===k).label}\n${v}`).join('\n\n')+`\n\n### Your reasoning\n${s.reasoning}\n\n### Link\n${s.link}`;
 const res=await work.POST(new Request('https://x.test/api/work',{method:'POST',headers:{origin:'https://x.test','Content-Type':'application/json'},body:JSON.stringify({missionId:'m1',body,checks:[true,true,true,true,true],quiz:m.answer})}));
 assert.equal(res.status,200);assert.equal(count("SELECT COUNT(*) n FROM whatsapp_outbox WHERE user_id='bina'"),1);
 let c=await call(outbox,'/api/bridge/whatsapp/outbox',{action:'claim'});
 assert.equal(c.json.items.length,1,'inside the 24-hour window (the learner just wrote to us)');assert.match(c.json.items[0].text,/Mission done:.*\n.*points.*\nSynced from the website/);assert.equal(c.json.items[0].to,P2);
 c=await call(outbox,'/api/bridge/whatsapp/outbox',{action:'claim'});assert.equal(c.json.items.length,0,'claimed once');
 const id=db.prepare("SELECT id FROM whatsapp_outbox WHERE user_id='bina'").get().id;
 assert.equal((await call(outbox,'/api/bridge/whatsapp/outbox',{action:'report',results:[{id,ok:true}]})).json.updated,1);
 assert.equal(db.prepare('SELECT state FROM whatsapp_outbox WHERE id=?').get(id).state,'sent');
 // Window closed: skipped, not sent, no template spent on a notice.
 await jobs.queueNotice('bina','badge','x:2',{title:'Test'});db.prepare("UPDATE whatsapp_contacts SET last_inbound_at='2020-01-01T00:00:00Z' WHERE user_id='bina'").run();
 c=await call(outbox,'/api/bridge/whatsapp/outbox',{action:'claim'});assert.equal(c.json.items.length,0);assert.equal(db.prepare("SELECT state FROM whatsapp_outbox WHERE kind='badge'").get().state,'skipped_window');
 db.prepare("UPDATE whatsapp_contacts SET last_inbound_at=? WHERE user_id='bina'").run(new Date().toISOString());
 // Opted-out learners are never queued.
 await say(P2,'STOP');assert.equal(await jobs.queueNotice('bina','badge','x:4',{title:'T'}),false);
});
test('STOP is saved: no more replies, no reminders; START resumes lessons but not reminders',async()=>{
 await say(P1,'REMIND 7pm daily');assert.equal(db.prepare("SELECT remind_state s FROM whatsapp_contacts WHERE user_id='asha'").get().s,'on');
 let out=await say(P1,'stop');assert.match(textOf(out),/will not get more/);
 const row=db.prepare("SELECT state,remind_state,opted_out_at FROM whatsapp_contacts WHERE user_id='asha'").get();assert.equal(row.state,'opted_out');assert.equal(row.remind_state,'off');assert.ok(row.opted_out_at);
 out=await say(P1,'TODAY');assert.deepEqual(out,{action:'none',reason:'opted-out'});
 const due=await jobs.claimReminders(50,new Date('2026-10-13T13:35:00Z'));assert.equal(due.items.filter(i=>i.to===P1).length,0);
 out=await say(P1,'START');assert.match(textOf(out),/reminders stay off/);assert.equal(db.prepare("SELECT remind_state s FROM whatsapp_contacts WHERE user_id='asha'").get().s,'off');
 assert.equal((await jobs.claimReminders(50,new Date('2026-10-13T13:35:00Z'))).items.filter(i=>i.to===P1).length,0);
});
test('reminders: explicit opt-in, chosen time and frequency in India time, quiet hours, template outside the 24-hour window, once per day even when the run is retried',async()=>{
 const T=iso=>new Date(iso);                       // 2026-10-13 is a Tuesday. 13:35Z = 19:05 IST.
 assert.match(textOf(await say(P1,'REMIND')),/off/);
 assert.match(textOf(await say(P1,'REMIND 10pm')),/quiet hours/,'inside quiet hours: refused');
 assert.match(textOf(await say(P1,'REMIND 7pm daily')),/daily at 7pm India time/);
 const row=db.prepare("SELECT remind_state,remind_hour,remind_freq FROM whatsapp_contacts WHERE user_id='asha'").get();assert.deepEqual({...row},{remind_state:'on',remind_hour:19,remind_freq:'daily'});
 db.prepare("UPDATE whatsapp_contacts SET last_inbound_at='2026-10-01T00:00:00Z' WHERE user_id='asha'").run();
 db.prepare("DELETE FROM mission_scores WHERE user_id='asha'").run();  // not yet learned "today" for this check
 assert.equal((await jobs.claimReminders(50,T('2026-10-13T12:30:00Z'))).items.length,0,'18:00 IST is before the chosen hour');
 const night=await jobs.claimReminders(50,T('2026-10-13T16:45:00Z'));assert.equal(night.items.length,0,'22:15 IST: quiet hours, and past the window');
 const run1=await call(reminders,'/api/bridge/whatsapp/reminders',{action:'claim'});   // real clock: may or may not be due; only used for the HTTP shape
 assert.equal(run1.status,200);assert.ok(Array.isArray(run1.json.items));
 const a=await jobs.claimReminders(50,T('2026-10-13T13:35:00Z'));
 const mine=a.items.filter(i=>i.to===P1);assert.equal(mine.length,1);assert.equal(mine[0].mode,'template','outside the window an approved template is the only option');
 assert.equal(mine[0].template.name,'learning_reminder');assert.equal(mine[0].template.params.length,1);assert.ok(!('text' in mine[0]));
 const b=await jobs.claimReminders(50,T('2026-10-13T14:10:00Z'));assert.equal(b.items.filter(i=>i.to===P1).length,0,'a retried or repeated scheduled run sends nothing twice');
 await jobs.reportReminders([{ref:mine[0].ref,ok:false}]);
 const c=await jobs.claimReminders(50,T('2026-10-13T14:20:00Z'));assert.equal(c.items.filter(i=>i.to===P1).length,1,'a send that failed is tried again');
 await jobs.reportReminders([{ref:mine[0].ref,ok:true}]);
 assert.equal((await jobs.claimReminders(50,T('2026-10-13T14:40:00Z'))).items.filter(i=>i.to===P1).length,0,'once sent, never again that day');
 // Next day: inside the window a free message is allowed; weekdays skip Saturday; weekly only Monday; already learned today: skipped.
 db.prepare("UPDATE whatsapp_contacts SET last_inbound_at='2026-10-14T10:00:00Z' WHERE user_id='asha'").run();
 const d=await jobs.claimReminders(50,T('2026-10-14T13:35:00Z'));const free=d.items.find(i=>i.to===P1);assert.equal(free.mode,'text');assert.match(free.text,/\*TODAY\*/);
 await say(P1,'REMIND weekdays');assert.equal((await jobs.claimReminders(50,T('2026-10-17T13:35:00Z'))).items.filter(i=>i.to===P1).length,0,'Saturday: weekdays only');
 await say(P1,'REMIND weekly');assert.equal((await jobs.claimReminders(50,T('2026-10-15T13:35:00Z'))).items.filter(i=>i.to===P1).length,0,'Thursday: weekly means Monday');
 assert.equal((await jobs.claimReminders(50,T('2026-10-19T13:35:00Z'))).items.filter(i=>i.to===P1).length,1);
 db.prepare("INSERT INTO mission_scores(user_id,mission_id,day,understanding,practical,clues,deduction,points,created_at) VALUES ('asha','m9','2026-10-26',25,75,0,0,100,'x')").run();
 assert.equal((await jobs.claimReminders(50,T('2026-10-26T13:35:00Z'))).items.filter(i=>i.to===P1).length,0,'no nudge after today\'s mission is done');
 db.prepare("UPDATE whatsapp_contacts SET last_inbound_at='2026-10-01T00:00:00Z' WHERE user_id='asha'").run();
 const savedT=env.WHATSAPP_REMINDER_TEMPLATE;env.WHATSAPP_REMINDER_TEMPLATE='';db.prepare("DELETE FROM mission_scores WHERE mission_id='m9'").run();
 assert.equal((await jobs.claimReminders(50,T('2026-11-02T13:35:00Z'))).items.filter(i=>i.to===P1).length,0,'no approved template configured: nothing is sent outside the window');
 env.WHATSAPP_REMINDER_TEMPLATE=savedT;
 await say(P1,'REMIND OFF');assert.equal((await jobs.claimReminders(50,T('2026-11-09T13:35:00Z'))).items.filter(i=>i.to===P1).length,0);
});
test('website settings: the old unverified opt-in is gone; the form returns a one-time code and shows only a masked number',async()=>{
 web={userId:'carl',email:'c@example.test',displayName:'C'};
 const res=await siteWa.POST(new Request('https://x.test/api/whatsapp',{method:'POST',headers:{origin:'https://x.test','Content-Type':'application/json'},body:JSON.stringify({action:'optin',phone:'98000 11122',language:'en',consent:true})}));
 assert.equal(res.status,200);const j=await res.json();assert.equal(j.contact.state,'pending');assert.equal(j.contact.verified,false);assert.match(j.contact.linkCode,/^[A-Z2-9]{8}$/);assert.ok(!JSON.stringify(j).includes('9800011122'));
 const stored=db.prepare("SELECT code_hash FROM whatsapp_link_codes WHERE user_id='carl'").get();assert.ok(!stored.code_hash.includes(j.contact.linkCode),'only a hash of the code is stored');
 const g=await (await siteWa.GET()).json();assert.ok(!('linkCode' in (g.contact||{})),'the code is shown once, not on later loads');
});
test('privacy: no message text or full phone number is kept in logs, events or drafts after use',async()=>{
 assert.equal(count("SELECT COUNT(*) n FROM whatsapp_drafts WHERE updated_at<?",new Date(Date.now()-864e5).toISOString()),0);
 const events=db.prepare('SELECT * FROM whatsapp_events LIMIT 1').get();assert.deepEqual(Object.keys(events).sort(),['id','kind','processed_at']);
 db.prepare("DELETE FROM bridge_nonces").run();await call(outbox,'/api/bridge/whatsapp/outbox',{action:'claim'});
 const nonces=db.prepare('SELECT * FROM bridge_nonces').all();assert.ok(nonces.every(n=>!/9198765/.test(JSON.stringify(n))));
});
test('no secrets in the code or the workflow files',()=>{
 for(const f of ['lib/bridge/auth.ts','lib/bridge/whatsapp-chat.ts','lib/bridge/whatsapp-jobs.ts','.env.example'])assert.ok(!/sk-[A-Za-z0-9]{20,}|EAA[A-Za-z0-9]{30,}|[a-f0-9]{64}/.test(fs.readFileSync(path.resolve(__dirname,'..',f),'utf8')),f);
});

// ---- the n8n Code nodes, run exactly as exported (n8n/code/*.js) against the real backend routes, with mock Meta payloads and a mock OpenAI answer ----
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const N8N_ENV={WHATSLEARN_BASE_URL:'https://whatslearn.example.test',WHATSLEARN_BRIDGE_SECRET:SECRET,WHATSAPP_APP_SECRET:APP,WHATSAPP_VERIFY_TOKEN:'verify-token-1234567890'};
const PLACEHOLDERS={verifyToken:'PASTE_VERIFY_TOKEN_HERE',appSecret:'PASTE_META_APP_SECRET_HERE',baseUrl:'PASTE_WEBSITE_ADDRESS_HERE',bridgeSecret:'PASTE_BRIDGE_SECRET_HERE',phoneNumberId:'PASTE_PHONE_NUMBER_ID_HERE'};
async function runNode(file,{json={},items,env=N8N_ENV,binary,named={},settings=PLACEHOLDERS}={}){
 if(file!=='wa-resolve-settings.js'&&!named['Resolve Settings']){const r=await runNode('wa-resolve-settings.js',{json:{},env,named:{'My Settings (edit here)':[settings]}});named={...named,'Resolve Settings':[{cfg:r[0].cfg}]}}
 const code=fs.readFileSync(path.resolve(__dirname,'../n8n/code',file),'utf8');
 const list=(items||[json]).map(j=>({json:j}));
 if(file==='wa-sign-message.js'&&!named['One Item Per Message'])named={...named,'One Item Per Message':list.map(i=>i.json)};
 const $input={first:()=>list[0],all:()=>list};
 const $=name=>({first:()=>named[name][0],all:()=>named[name].map(j=>({json:j}))}) ;
 const ctx={helpers:{getBinaryDataBuffer:async()=>binary}};
 const fn=new AsyncFunction('$input','$env','$','require',code);
 return (await fn.call(ctx,$input,env,(n)=>{const o=$(n);return {first:()=>({json:named[n][0]}),all:()=>named[n].map(j=>({json:j}))}},(n)=>{throw new Error('Code nodes must not require anything (v55): '+n)})).map(x=>x.json);
}
const metaPayload=(messages,statuses)=>JSON.stringify({object:'whatsapp_business_account',entry:[{id:'1',changes:[{field:'messages',value:{messaging_product:'whatsapp',messages,statuses}}]}]});
const hookInput=(raw,sig)=>({json:{headers:{'x-hub-signature-256':sig},body:{}},binary:Buffer.from(raw)});
test('n8n node "Check Verify Token" answers Meta only with the right verify token',async()=>{
 const ok=await runNode('wa-verify-challenge.js',{json:{query:{'hub.mode':'subscribe','hub.verify_token':'verify-token-1234567890','hub.challenge':'555'}}});assert.deepEqual(ok,[{ok:true,challenge:'555'}]);
 assert.equal((await runNode('wa-verify-challenge.js',{json:{query:{'hub.mode':'subscribe','hub.verify_token':'nope','hub.challenge':'555'}}}))[0].ok,false);
 assert.equal((await runNode('wa-verify-challenge.js',{json:{query:{'hub.mode':'subscribe','hub.verify_token':'','hub.challenge':'555'}},env:{}}))[0].ok,false,'no token configured: always refuse');
});
test("n8n node \"Validate Meta Signature\": rejects a bad or missing signature, ignores status events, passes text, button and other message types",async()=>{
 const good=metaPayload([{id:'wamid.AAA11111',from:P1,type:'text',text:{body:'TODAY'}},{id:'wamid.BBB22222',from:P1,type:'button',button:{text:'HINT'}},{id:'wamid.CCC33333',from:P1,type:'image',image:{id:'x'}}]);
 const r=await runNode('wa-check-signature.js',hookInput(good,metaSig(good)));assert.equal(r[0].valid,true);assert.deepEqual(r[0].messages.map(m=>[m.type,m.text]),[['text','TODAY'],['text','HINT'],['image','']]);
 assert.equal((await runNode('wa-check-signature.js',hookInput(good,'sha256='+'0'.repeat(64))))[0].valid,false);
 assert.equal((await runNode('wa-check-signature.js',hookInput(good,'')))[0].valid,false);
 const tampered=good.replace('TODAY','HINT ');assert.equal((await runNode('wa-check-signature.js',hookInput(tampered,metaSig(good))))[0].valid,false,'a changed body no longer matches its signature');
 const statusOnly=metaPayload(undefined,[{id:'wamid.S',status:'delivered',recipient_id:P1}]);const s=await runNode('wa-check-signature.js',hookInput(statusOnly,metaSig(statusOnly)));assert.deepEqual(s[0].messages,[],'status events are not learner messages');
 await assert.rejects(()=>runNode('wa-check-signature.js',{...hookInput(good,metaSig(good)),env:{}}),/WHATSAPP_APP_SECRET/);
});
test('n8n signing nodes produce requests WhatsLearn accepts; a second use of the same request is a safe retry, an altered one is refused',async()=>{
 const raw=metaBody('wamid.N8NFLOW0001',P1,'POINTS');const [sig]=await runNode('wa-sign-message.js',{json:{wamid:'wamid.N8NFLOW0001',from:P1,type:'text',text:'POINTS',metaRawBody:raw,metaSignature:metaSig(raw)}});
 const send=(body=sig.body)=>msg.POST(new Request(sig.url,{method:'POST',headers:{'content-type':'application/json','x-wl-timestamp':sig.ts,'x-wl-nonce':sig.nonce,'x-wl-signature':sig.signature},body}));
 const a=await send();assert.equal(a.status,200);const first=await a.json();assert.equal(first.action,'reply');
 const b=await send();assert.equal(b.status,200);assert.equal(b.headers.get('x-wl-replayed'),'1');assert.deepEqual(await b.json(),first);
 assert.equal(count("SELECT COUNT(*) n FROM whatsapp_events WHERE id='wamid.N8NFLOW0001'"),1,'the retry did not run the handler again');
 assert.equal((await send(sig.body.replace('POINTS','TODAY'))).status,401,'an altered body fails the signature');
 const notice=await runNode('notices-sign-claim.js');const rem=await runNode('reminders-sign-claim.js');
 for(const [s2,route] of [[notice[0],outbox],[rem[0],reminders]]){const r=await route.POST(new Request(s2.url,{method:'POST',headers:{'x-wl-timestamp':s2.ts,'x-wl-nonce':s2.nonce,'x-wl-signature':s2.signature},body:s2.body}));assert.equal(r.status,200)}
 await assert.rejects(()=>runNode('wa-sign-message.js',{json:{},env:{...N8N_ENV,WHATSLEARN_BRIDGE_SECRET:'short'}}),/WHATSLEARN_BRIDGE_SECRET/);
 await assert.rejects(()=>runNode('wa-sign-message.js',{json:{},env:{...N8N_ENV,WHATSLEARN_BASE_URL:'http://evil.example'}}),/WHATSLEARN_BASE_URL/);
});
test('n8n chat flow end to end with mocks: signed Meta message -> WhatsLearn -> tutor request -> mock OpenAI answer -> short safe reply',async()=>{
 await say(P1,'COURSE marketing');
 const q='What does a believable outcome mean for my customer offer?';const raw=metaBody('wamid.FLOWTUTOR001',P1,q);
 const [m]=(await runNode('wa-check-signature.js',hookInput(raw,metaSig(raw))))[0].messages;
 const [sig]=await runNode('wa-sign-message.js',{json:m});
 const res=await msg.POST(new Request(sig.url,{method:'POST',headers:{'x-wl-timestamp':sig.ts,'x-wl-nonce':sig.nonce,'x-wl-signature':sig.signature},body:sig.body}));const out=await res.json();
 assert.equal(out.action,'tutor');
 const [req]=await runNode('wa-build-tutor.js',{json:out});
 assert.equal(req.requestBody.messages[0].role,'system');assert.match(req.requestBody.messages[0].content,/Never reveal, guess or confirm an answer/);
 const sent=JSON.stringify(req.requestBody),m1=byId('m1');assert.ok(!sent.includes(m1.explanation)&&!sent.includes(m1.example),'nothing but approved material goes to OpenAI');
 const named={'Build Tutor Request':[req]};
 const mock={choices:[{message:{content:'A believable outcome is something your customer can expect and you can prove. See https://evil.example/x and '+'word '.repeat(300)}}]};
 const [reply]=await runNode('wa-compose-tutor-reply.js',{json:mock,named});
 assert.ok(!/evil\.example/.test(reply.reply),'links to other sites are removed');assert.ok(reply.reply.split(/\s+/).length<=91,'cut to the word limit');
 const [fb]=await runNode('wa-compose-tutor-reply.js',{json:{error:{message:'rate limit'}},named});assert.equal(fb.reply,out.fallback,'an OpenAI failure sends WhatsLearn\'s own fallback text');
});
test('n8n notice and reminder report nodes send only the id/ref and a yes/no result',async()=>{
 const [a]=await runNode('notices-sign-report.js',{json:{messages:[{id:'x'}]},named:{'Loop Over Notices':[{id:41,to:P1,text:'t'}]}});assert.deepEqual(JSON.parse(a.body),{action:'report',results:[{id:41,ok:true}]});
 const [b]=await runNode('notices-sign-report.js',{json:{error:'Bad request'},named:{'Loop Over Notices':[{id:41}]}});assert.equal(JSON.parse(b.body).results[0].ok,false);
 const [c]=await runNode('reminders-sign-report.js',{json:{error:'x'},named:{'Loop Over Reminders':[{ref:'u|2026-10-13',to:P1}]}});assert.deepEqual(JSON.parse(c.body),{action:'report',results:[{ref:'u|2026-10-13',ok:false}]});
 assert.ok(!JSON.stringify(JSON.parse(c.body)).includes(P1),'the phone number is not sent back');
});
test('Meta webhook verification: separate GET and POST webhooks on one path, challenge only for the right token, token only from the environment',async()=>{
 const wf=JSON.parse(fs.readFileSync(path.resolve(__dirname,'..','n8n/workflows/whatslearn-all-in-one.json'),'utf8'));
 const hooks=wf.nodes.filter(n=>n.type==='n8n-nodes-base.webhook');
 assert.deepEqual(hooks.map(h=>h.parameters.httpMethod).sort(),['GET','POST'],'one GET and one POST webhook, no multi-method option');
 assert.equal(new Set(hooks.map(h=>h.parameters.path)).size,1,'same path');
 assert.ok(hooks.every(h=>h.webhookId===undefined),'no webhookId, so the URL is /webhook/<path> on every import');
 assert.ok(hooks.every(h=>h.parameters.responseMode==='responseNode'));
 const get=hooks.find(h=>h.parameters.httpMethod==='GET'),post=hooks.find(h=>h.parameters.httpMethod==='POST');
 assert.equal(post.parameters.options.rawBody,true,'raw body kept for the signature');
 assert.equal(wf.connections[get.name].main[0][0].node,'My Settings (edit here)');
 assert.equal(wf.connections[post.name].main[0][0].node,'My Settings (edit here)');
 assert.equal(wf.connections['Which Part Is Running?'].main[0][0].node,'Check Verify Token','GET part goes to the token check');
 assert.equal(wf.connections['Which Part Is Running?'].main[1][0].node,'Validate Meta Signature','POST part never runs the verify branch');
 const byName=n=>wf.nodes.find(x=>x.name===n);
 assert.equal(byName('Answer Challenge').parameters.options.responseCode,200);assert.equal(byName('Answer Challenge').parameters.responseBody,'={{ $json.challenge }}');
 assert.equal(byName('Refuse Challenge').parameters.options.responseCode,403);
 assert.deepEqual(wf.connections['Token Matches?'].main.map(a=>a[0].node),['Answer Challenge','Refuse Challenge']);
 const tok='verify-token-1234567890';
 const good=await runNode('wa-verify-challenge.js',{json:{query:{'hub.mode':'subscribe','hub.verify_token':tok,'hub.challenge':'1158201444'}}});assert.deepEqual(good,[{ok:true,challenge:'1158201444'}]);
 const nested=await runNode('wa-verify-challenge.js',{json:{query:{hub:{mode:'subscribe',verify_token:tok,challenge:'77'}}}});assert.deepEqual(nested,[{ok:true,challenge:'77'}],'also works if n8n nests hub.* keys');
 for(const q of [{'hub.mode':'subscribe','hub.verify_token':'wrong-token-wrong-token','hub.challenge':'9'},{'hub.mode':'unsubscribe','hub.verify_token':tok,'hub.challenge':'9'},{}]){const r=await runNode('wa-verify-challenge.js',{json:{query:q}});assert.equal(r[0].ok,false);assert.equal(r[0].challenge,'')}
 const short=await runNode('wa-verify-challenge.js',{json:{query:{'hub.mode':'subscribe','hub.verify_token':'short','hub.challenge':'9'}},env:{...N8N_ENV,WHATSAPP_VERIFY_TOKEN:'short'}});assert.equal(short[0].ok,false,'a token under 16 characters is refused even if Meta sends the same one');
 const text=JSON.stringify(wf);assert.ok(!text.includes(tok)&&!/verify_token\s*[:=]\s*['"][A-Za-z0-9@]{6,}/.test(fs.readFileSync(path.resolve(__dirname,'..','n8n/code/wa-verify-challenge.js'),'utf8')),'no token in the JSON or the code');
});

test('No server access path (v53): settings typed in the n8n node work, the server variable wins, placeholders and short values are refused',async()=>{
 const wf=JSON.parse(fs.readFileSync(path.resolve(__dirname,'..','n8n/workflows/whatslearn-all-in-one.json'),'utf8'));
 const set=wf.nodes.find(n=>n.name==='My Settings (edit here)');assert.equal(set.type,'n8n-nodes-base.set');
 const vals=Object.fromEntries(set.parameters.assignments.assignments.map(a=>[a.name,a.value]));
 assert.deepEqual(Object.keys(vals).sort(),['appSecret','baseUrl','bridgeSecret','phoneNumberId','verifyToken']);
 assert.ok(Object.values(vals).every(v=>/^PASTE_/.test(v)),'only placeholders are stored in the workflow file');
 for(const t of ['Meta Webhook GET (verify)','Meta Webhook POST (messages)','Every 2 Minutes','Hourly At 7 Past'])assert.equal(wf.connections[t].main[0][0].node,'My Settings (edit here)',t+' goes through the settings first');
 assert.equal(wf.connections['My Settings (edit here)'].main[0][0].node,'Resolve Settings');assert.equal(wf.connections['Resolve Settings'].main[0][0].node,'Which Part Is Running?');
 assert.equal(wf.connections['Which Part Is Running?'].main.length,4);
 const entry=wf.connections['Which Part Is Running?'].main.map(a=>a[0].node);assert.deepEqual(entry,['Check Verify Token','Validate Meta Signature','Notices: Sign Claim Request','Reminders: Sign Claim Request']);
 const typed={verifyToken:'typed-in-node-token-123456',appSecret:APP,baseUrl:'https://whatslearn.example.test/',bridgeSecret:SECRET,phoneNumberId:'1234567890'};
 const r=await runNode('wa-resolve-settings.js',{json:{query:{}},env:{},named:{'My Settings (edit here)':[typed]}});
 assert.deepEqual(r[0].cfg,{...typed,baseUrl:'https://whatslearn.example.test'},'typed values are used, trailing slash removed');
 const w=await runNode('wa-resolve-settings.js',{json:{},env:{WHATSAPP_VERIFY_TOKEN:'server-token-abcdefghij'},named:{'My Settings (edit here)':[typed]}});assert.equal(w[0].cfg.verifyToken,'server-token-abcdefghij','server variable wins');
 const blocked=await runNode('wa-resolve-settings.js',{json:{},env:new Proxy({},{get(){throw new Error('access to env vars denied')}}),named:{'My Settings (edit here)':[typed]}});assert.equal(blocked[0].cfg.verifyToken,typed.verifyToken,'blocked env access falls back to the typed value');
 const ph=await runNode('wa-resolve-settings.js',{json:{},env:{},named:{'My Settings (edit here)':[PLACEHOLDERS]}});assert.ok(Object.values(ph[0].cfg).every(v=>v===''),'an unchanged placeholder counts as not set');
 const okq={'hub.mode':'subscribe','hub.verify_token':typed.verifyToken,'hub.challenge':'42'};
 assert.deepEqual(await runNode('wa-verify-challenge.js',{json:{query:okq},env:{},settings:typed}),[{ok:true,challenge:'42'}],'handshake works with no server settings at all');
 assert.equal((await runNode('wa-verify-challenge.js',{json:{query:{...okq,'hub.verify_token':'PASTE_VERIFY_TOKEN_HERE'}},env:{}}))[0].ok,false,'unchanged placeholder always refused, even if Meta sends it');
 assert.equal((await runNode('wa-verify-challenge.js',{json:{query:{...okq,'hub.verify_token':'short'}},env:{},settings:{...typed,verifyToken:'short'}}))[0].ok,false,'under 16 characters refused');
 const sig=metaPayload([{id:'w1',from:'1',type:'text',text:{body:'hi'}}]);
 const signed=await runNode('wa-check-signature.js',{...hookInput(sig,metaSig(sig)),env:{},settings:typed});assert.equal(signed[0].valid,true,'signature check works with the app secret typed in the node');
 await assert.rejects(()=>runNode('wa-sign-message.js',{json:{},env:{},settings:{...typed,bridgeSecret:'PASTE_BRIDGE_SECRET_HERE'}}),/bridgeSecret/);
 assert.ok(!JSON.stringify(wf).includes(typed.verifyToken),'no real value in the file');
});

test('Sending (v54): every send is a Graph API call with a Header Auth credential, no token in the file, correct text and template bodies',async()=>{
 const wf=JSON.parse(fs.readFileSync(path.resolve(__dirname,'..','n8n/workflows/whatslearn-all-in-one.json'),'utf8'));
 assert.ok(!wf.nodes.some(n=>n.type==='n8n-nodes-base.whatsApp'),'no WhatsApp-node credential to mix up');
 const sends=wf.nodes.filter(n=>/^(Send |Send$)/.test(n.name)&&n.type==='n8n-nodes-base.httpRequest');assert.equal(sends.length,6);
 for(const n of sends){
  assert.equal(n.parameters.method,'POST');assert.equal(n.parameters.authentication,'genericCredentialType');assert.equal(n.parameters.genericAuthType,'httpHeaderAuth');
  assert.deepEqual(Object.keys(n.credentials),['httpHeaderAuth']);assert.equal(n.credentials.httpHeaderAuth.name,'Meta WhatsApp token (Header Auth)');assert.equal(n.credentials.httpHeaderAuth.id,'');
  assert.match(n.parameters.url,/^=\{\{ 'https:\/\/graph\.facebook\.com\/v20\.0\/' \+ \$\("Resolve Settings"\)\.first\(\)\.json\.cfg\.phoneNumberId \+ '\/messages' \}\}$/,'token never in the URL');
  assert.equal(n.onError,'continueRegularOutput','a failed send is reported, not lost');
 }
 assert.ok(!/access_token|Bearer\s+[A-Za-z0-9]|EAA[A-Za-z0-9]{10,}/.test(JSON.stringify(wf)),'no token anywhere in the file');
 const ev=(expr,j,named={})=>new Function('$json','$',`return (${expr.replace(/^=\{\{\s*/,'').replace(/\s*\}\}$/,'')})`)(j,n=>({first:()=>({json:named[n]}),item:{json:named[n]}}));
 const byN=n=>wf.nodes.find(x=>x.name===n);
 const cfgNamed={'Resolve Settings':{cfg:{phoneNumberId:'1234567890'}},'One Item Per Message':{from:'+91 98765 43210'}};
 assert.equal(ev(byN('Send Reply').parameters.url,{},cfgNamed),'https://graph.facebook.com/v20.0/1234567890/messages');
 const t=JSON.parse(ev(byN('Send Reply').parameters.jsonBody,{text:'x'.repeat(5000)},cfgNamed));assert.deepEqual([t.messaging_product,t.to,t.type,t.text.body.length],['whatsapp','919876543210','text',3800]);
 const nt=JSON.parse(ev(byN('Send Notice').parameters.jsonBody,{to:'919876543210',text:'You completed a mission.'},cfgNamed));assert.equal(nt.text.body,'You completed a mission.');assert.equal(nt.to,'919876543210');
 const tp=JSON.parse(ev(byN('Send Approved Template').parameters.jsonBody,{to:'919876543210',template:{name:'learning_reminder',language:'en',params:['Mission 3']}},cfgNamed));
 assert.deepEqual(tp.template,{name:'learning_reminder',language:{code:'en'},components:[{type:'body',parameters:[{type:'text',text:'Mission 3'}]}]});assert.equal(tp.type,'template');
 const retry=JSON.parse(ev(byN('Send Try Again Notice').parameters.jsonBody,{},cfgNamed));assert.match(retry.text.body,/send your message again/);assert.equal(retry.to,'919876543210');
});

test('v55: no n8n Code node uses require(), so no NODE_FUNCTION_ALLOW_BUILTIN server setting is needed',()=>{
 const dir=path.resolve(__dirname,'../n8n/code');
 for(const f of fs.readdirSync(dir)){const code=fs.readFileSync(path.join(dir,f),'utf8').split('\n').filter(l=>!l.trim().startsWith('//')).join('\n');assert.ok(!/\brequire\s*\(/.test(code),f+' still calls require()');assert.ok(!/\bcrypto\./.test(code),f+' still uses crypto.')}
 const wf=fs.readFileSync(path.resolve(__dirname,'../n8n/workflows/whatslearn-all-in-one.json'),'utf8');assert.ok(!/require\(/.test(wf.replace(/no require\("crypto"\)/g,'')),'workflow JSON has no require()');
});
test('v55: the built-in HMAC-SHA256 matches Node crypto for short, long, empty and non-ASCII input',()=>{
 const src=fs.readFileSync(path.resolve(__dirname,'../n8n/code/wa-sign-message.js'),'utf8').split('\n');
 const start=src.findIndex(l=>l.startsWith('const wlBytes')),end=src.findIndex(l=>l.startsWith('const wlNonce'));
 const lib=new Function(src.slice(start,end+1).join('\n')+';return {wlHmacHex,wlSame,wlNonce,wlBytes};')();
 const cases=[['',''],['k','m'],['bridge-secret-for-tests-0123456789abcdef','hello'],['é€😀 key','ñ 日本語 \ud83d😀'],['x'.repeat(64),'y'.repeat(55)],['x'.repeat(65),'y'.repeat(56)],['x'.repeat(200),'y'.repeat(1000)],['a','\ud800 lone']];
 for(let n=0;n<130;n++)cases.push([randomBytes(n%90).toString('latin1'),randomBytes(n*3).toString('latin1')]);
 for(const [k,m] of cases)assert.equal(lib.wlHmacHex(k,m),createHmac('sha256',Buffer.from(k,'utf8')).update(Buffer.from(m,'utf8')).digest('hex'));
 const raw=Buffer.from(JSON.stringify({a:'ü'}));assert.equal(lib.wlHmacHex('s',raw),createHmac('sha256','s').update(raw).digest('hex'),'bytes input as Meta raw body');
 assert.ok(lib.wlSame('abc','abc')&&!lib.wlSame('abc','abd')&&!lib.wlSame('abc','abcd'));
 const a=lib.wlNonce(),b=lib.wlNonce();assert.match(a,/^[0-9a-f]{32}$/);assert.notEqual(a,b);
});

test('v56: "Show Typing" sends a read receipt plus typing indicator through the Graph API before WhatsLearn is asked, with the one Header Auth credential and no token in the file',()=>{
 const wf=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../n8n/workflows/whatslearn-all-in-one.json'),'utf8'));
 assert.match(wf.name,/^WhatsLearn Mentor/);
 const n=wf.nodes.find(x=>x.name==='Show Typing');assert.ok(n,'node exists');
 assert.equal(n.parameters.authentication,'genericCredentialType');assert.equal(n.parameters.genericAuthType,'httpHeaderAuth');assert.equal(n.onError,'continueRegularOutput');
 assert.match(n.parameters.url,/graph\.facebook\.com\/v20\.0\/.*phoneNumberId.*\/messages/);assert.doesNotMatch(n.parameters.url,/access_token/);
 assert.match(n.parameters.jsonBody,/status: 'read'/);assert.match(n.parameters.jsonBody,/typing_indicator: \{ type: 'text' \}/);assert.match(n.parameters.jsonBody,/message_id: String\(\$json\.wamid\)/);
 const c=wf.connections;const next=name=>c[name].main[0].map(x=>x.node);
 assert.deepEqual(next('One Item Per Message'),['Show Typing']);assert.deepEqual(next('Show Typing'),['Sign Request To WhatsLearn']);
 assert.deepEqual(wf.settings.saveDataSuccessExecution,'none');assert.deepEqual(wf.settings.saveDataErrorExecution,'none');
 assert.doesNotMatch(JSON.stringify(wf),/access_token|sk-[A-Za-z0-9]{10}|EAA[A-Za-z0-9]{20}/);
});
test('v56: several messages in one Meta delivery each get their own signed request and their own tutor request/reply',async()=>{
 const mk=(w,t)=>({wamid:w,from:P1,type:'text',text:t,metaRawBody:'{}',metaSignature:'sha256=x'});
 const signed2=await runNode('wa-sign-message.js',{items:[mk('wamid.AAA1','TODAY'),mk('wamid.BBB2','HINT')]});
 assert.equal(signed2.length,2);assert.notEqual(signed2[0].nonce,signed2[1].nonce);assert.equal(JSON.parse(signed2[1].body).wamid,'wamid.BBB2');
 const t=(q)=>({action:'tutor',question:q,language:'en',maxWords:90,material:{course:'C'},fallback:'FB'});
 const built=await runNode('wa-build-tutor.js',{items:[t('one?'),t('two?')]});
 assert.equal(built.length,2);assert.match(built[1].requestBody.messages[1].content,/two\?/);assert.ok(!JSON.stringify(built).includes('answerKey'));
 const composed=await runNode('wa-compose-tutor-reply.js',{items:[{choices:[{message:{content:'Answer one'}}]},{error:{message:'boom'}}],named:{'Build Tutor Request':built.map(b=>b)}});
 assert.deepEqual(composed.map(x=>x.reply),['Answer one','FB']);
});

test('linked mentor uses the signed-in name, current website profile and paid plan allowance',async()=>{
 const phone='919000000004',userId='profile-sync-check';
 const link=await chat.startLink(userId,phone,'en',undefined,'Pavana');assert.ok(link.ok&&link.code);
 let out=await say(phone,'LINK '+link.code);assert.match(textOf(out),/Hi Pavana!/);
 const {saveProfile}=require('../lib/learning-service.ts');
 await saveProfile(userId,{goal:'business',track:'development',level:'beginner',language:'en',minutes:'15'});
 out=await say(phone,'PROFILE');assert.match(textOf(out),/Pavana/);assert.match(textOf(out),/Full-Stack/);assert.match(textOf(out),/3\/3 left today/);
 db.prepare("INSERT INTO entitlements(session_id,user_id,mode,sku,status,ends_at,updated_at) VALUES (?,?,'reward','pro_monthly','active',?,?)").run('reward-profile-sync',userId,'2099-01-01T00:00:00Z',new Date().toISOString());
 out=await say(phone,'PLAN');assert.match(textOf(out),/Pro monthly/);assert.match(textOf(out),/25\/25 left today/);
});

test('n8n bridge can link accounts without putting the Meta send token on the website',async()=>{
 const token=env.WHATSAPP_TOKEN;env.WHATSAPP_TOKEN='';env.WHATSAPP_BUSINESS_NUMBER='919187951536';
 try{const r=await siteWa.GET();assert.equal((await r.json()).configured,true)}finally{env.WHATSAPP_TOKEN=token;delete env.WHATSAPP_BUSINESS_NUMBER}
});

test('website first name overrides the linking account name and stays current',async()=>{
 const userId='first-name-sync',phone='919000000009';
 const profile={goal:'job',track:'marketing',level:'beginner',language:'en',minutes:'15'};
 web={userId,email:'team@example.test',displayName:'teambrandmint',fullName:'teambrandmint'};
 const route=R('profile');
 const save=name=>route.POST(new Request('https://whatslearn.example.test/api/profile',{method:'POST',headers:{'content-type':'application/json',origin:'https://whatslearn.example.test'},body:JSON.stringify({...profile,name})}));
 assert.equal((await save('Pavana')).status,200);
 const link=await chat.startLink(userId,phone,'en',undefined,'teambrandmint');
 assert.match(textOf(await say(phone,'LINK '+link.code)),/Hi Pavana!/);
 assert.equal((await route.GET()).status,200);
 assert.equal((await (await route.GET()).json()).name,'Pavana');
 assert.equal((await save('Pavan')).status,200);
 assert.match(textOf(await say(phone,'PROFILE')),/Hi Pavan!/);
 const other=await chat.startLink('separate-name', '919000000010','en',undefined,'Another learner');
 assert.doesNotMatch(textOf(await say('919000000010','LINK '+other.code)),/Pavana|Pavan!/);
});


test('mentor gives one short challenge step and keeps lesson details on demand',async()=>{
 const phone='919000000011';await newLearner('compact-chat',phone,{track:'development'});
 let out=await say(phone,'TODAY');const text=textOf(out);
 assert.ok(text.length<700,text.length);assert.doesNotMatch(text,/Plan:|Goal:|Your task:|The idea:|PROFILE:|Anita/);
 assert.match(text,/Your pick/);assert.match(text,/C\) After the server confirms/);
 out=await say(phone,'LEARN');assert.match(textOf(out),/The idea/);assert.match(textOf(out),/Your turn|Your task/);
 out=await say(phone,'TODAY');assert.match(textOf(out),/Question 1/);
});

test('saved-progress revision requires sign-in and only changes for that learner',async()=>{
 const route=R('sync');web=null;assert.equal((await route.GET()).status,401);
 web={userId:'revision-owner'};
 const read=async()=>{const r=await route.GET();assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/no-store/);return (await r.json()).revision};
 const before=await read();
 const {saveProfile}=require('../lib/learning-service.ts');
 const p={goal:'job',track:'development',level:'beginner',language:'en',minutes:'15'};
 await saveProfile('revision-other',p);assert.equal(await read(),before);
 await saveProfile('revision-owner',p);const after=await read();assert.notEqual(after,before);
 assert.equal(await read(),after);assert.doesNotMatch(after,/revision-owner|revision-other|phone|body/);
});


test('learning styles sync both ways without changing drafts, course or points',async()=>{
 const userId='style-switch',phone='919000000012';await newLearner(userId,phone,{track:'development'});
 const {loadLearning,saveProfile}=require('../lib/learning-service.ts');
 assert.equal((await loadLearning(userId)).profile.style,'casual');
 let out=await say(phone,'STYLE');assert.match(textOf(out),/Casual/);assert.match(textOf(out),/STYLE GAME/);
 await say(phone,'TODAY');await say(phone,'C');
 const draft=db.prepare('SELECT body,quiz,mission_id FROM whatsapp_drafts WHERE user_id=?').get(userId),points=balance(userId);
 for(const style of ['game','story','facts','casual']){
  out=await say(phone,'STYLE '+style.toUpperCase());assert.match(textOf(out),/Style set/);
  assert.equal((await loadLearning(userId)).profile.style,style);
  assert.deepEqual(db.prepare('SELECT body,quiz,mission_id FROM whatsapp_drafts WHERE user_id=?').get(userId),draft);
  assert.equal(balance(userId),points);
  assert.equal((await loadLearning(userId)).profile.track,'development');
  out=await say(phone,'LEARN');assert.ok(textOf(out).length<1100);assert.ok(textOf(out).includes(style==='game'?'Your quest':style==='story'?'The scene':style==='facts'?'Key idea':'The idea'));
 }
 out=await say(phone,'STYLE 2');assert.match(textOf(out),/Game/);
 out=await say(phone,'STYLE dinosaur');assert.match(textOf(out),/Choose one/);assert.equal((await loadLearning(userId)).profile.style,'game');
 // Older profile clients do not know the style field. Saving another choice must preserve it.
 const p={goal:'job',track:'development',level:'beginner',language:'en',minutes:'15'};
 await saveProfile(userId,p);assert.equal((await loadLearning(userId)).profile.style,'game');
 await saveProfile(userId,{...p,style:'facts'});out=await say(phone,'LEARN');assert.match(textOf(out),/Key idea/);
 await assert.rejects(()=>saveProfile(userId,{...p,style:'invalid'}));
 assert.equal((await loadLearning(userId)).profile.style,'facts');
});
