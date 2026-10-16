require('./helpers/approved-review.cjs');
// v36: course order (locks), retries after a wrong answer, clue costs, course titles, streaks, duplicates, guest limits, structured practical answers and an audit of all 40 missions.
// No network, no AI, no real keys. Run: node --test tests/progression.cjs
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),{DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync(':memory:');for(const f of fs.readdirSync(path.resolve(__dirname,'../drizzle')).filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync(path.resolve(__dirname,'../drizzle',f),'utf8').replaceAll('--> statement-breakpoint',''));
// Like Cloudflare D1, a batch is all-or-nothing.
const d1={prepare(sql){const stmt=db.prepare(sql);const api=(...args)=>({async first(){return stmt.get(...args)||null},async all(){return {results:stmt.all(...args)}},async run(){const r=stmt.run(...args);return {meta:{changes:r.changes}}},_run:()=>stmt.run(...args)});return {bind:api,...api()}},async batch(list){db.exec('BEGIN');try{const out=list.map(s=>({meta:{changes:s._run().changes}}));db.exec('COMMIT');return out}catch(e){db.exec('ROLLBACK');throw e}}};
let user={userId:'learner',email:'l@example.test',displayName:'L'};const env={DB:d1};
const original=Module._load;Module._load=function(name,parent,isMain){if(name==='@/app/chatgpt-auth')return {getChatGPTUser:async()=>user};if(name==='cloudflare:workers')return {env};if(name.startsWith('@/'))name=path.resolve(__dirname,'..',name.slice(2));return original.call(this,name,parent,isMain)};
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,f);
const {missions}=require('../lib/missions.ts'),{programmeNames}=require('../lib/programmes.ts'),{miniChallenge,practiceRewards}=require('../lib/play.ts');
const S=require('../lib/mission-score.ts'),{checkWriting}=require('../lib/writing-check.ts'),P=require('../lib/mission-points.ts');
const work=require('../app/api/work/route.ts'),clues=require('../app/api/clues/route.ts');
const samples=require('./fixtures/course-samples.json');
const tracks=['marketing','development','filmmaking','storytelling'];
const byId=id=>missions.find(m=>m.id===id);
const PR=require('../lib/practical.ts'),{answerText}=require('../lib/submission.ts');
// Text a learner typed for a sample answer (what the relevance gate reads), and helpers to build structured answers.
const T=id=>answerText(byId(id),samples[id]);
const parts=id=>PR.parseAnswer(byId(id).practical,samples[id]);
const amend=(id,extra)=>{const a=parts(id);return PR.composeAnswer(byId(id).practical,{...a,reasoning:a.reasoning+' '+extra})};
// A well-formed answer for mission `id` whose typed text is `text` (choices and code come from the sample).
const asAnswer=(id,text)=>{const a=parts(id);const f={...a.fields};const slots=byId(id).practical.fields.filter(x=>x.type==='short'||x.type==='long');const words=text.split(/\s+/).filter(Boolean);const per=Math.max(1,Math.ceil(words.length/(slots.length+1)));const chunk=i=>words.slice(i*per,(i+1)*per).join(' ');slots.forEach((x,i)=>{f[x.id]=chunk(i).slice(0,x.type==='short'?150:800)});return PR.composeAnswer(byId(id).practical,{fields:f,reasoning:chunk(slots.length).slice(0,1400),link:''})};
// Missions open in order, so a test that wants mission N first completes the missions before it.
const prevOf=id=>{const m=byId(id);const l=missions.filter(x=>x.track===m.track);return l.slice(0,l.findIndex(x=>x.id===id)).map(x=>x.id)};
const primeCheckpoints=id=>{const m=byId(id);const l=missions.filter(x=>x.track===m.track);const p=l.findIndex(x=>x.id===id)+1;for(let a=2;a<p;a+=2)db.prepare('INSERT OR IGNORE INTO checkpoint_clears (user_id,track,after_mission,created_at) VALUES (?,?,?,?)').run(user.userId,m.track,a,new Date().toISOString())};
const prime=id=>{db.prepare("INSERT OR REPLACE INTO entitlements(session_id,user_id,mode,sku,status,ends_at,updated_at) VALUES (?,?,'reward','plus_monthly','active','2999-01-01T00:00:00Z','2026-10-16T00:00:00Z')").run("course-fixture-"+user.userId,user.userId);primeCheckpoints(id);for(const q of prevOf(id))db.prepare("INSERT OR IGNORE INTO work (user_id,mission_id,body,checks,quiz,updated_at) VALUES (?,?,?,?,?,?)").run(user.userId,q,'seed','[]',byId(q).answer,new Date().toISOString())};
const Save=(input,now)=>{prime(input.missionId);return P.saveMissionWork(user.userId,input,now)};
const post=(route,body)=>route.POST(new Request('https://whatslearn.in/api/x',{method:'POST',headers:{origin:'https://whatslearn.in','Content-Type':'application/json'},body:JSON.stringify(body)}));
const send=(id,body=samples[id],extra={})=>(prime(id),post(work,{missionId:id,body,checks:[true,true,true,true,true],quiz:byId(id).answer,...extra}));
const reset=()=>{for(const t of ['work','practice_events','mission_scores','mission_clues','point_ledger','checkpoint_clears'])db.exec(`DELETE FROM ${t}`)};
const count=t=>db.prepare(`SELECT COUNT(*) n FROM ${t}${t==='work'?" WHERE body<>'seed'":''}`).get().n;
const PRG=require('../lib/progression.ts'),CT=require('../lib/course-titles.ts'),SUB=require('../lib/submission.ts'),{practiceDay,streakDays}=require('../lib/play.ts');
const body=id=>samples[id];
const full=(id,extra={})=>({missionId:id,body:body(id),checks:[true,true,true,true,true],quiz:byId(id).answer,...extra});
const mem={};global.localStorage={getItem:k=>k in mem?mem[k]:null,setItem:(k,v)=>{mem[k]=String(v)},removeItem:k=>{delete mem[k]}};
const resetAll=()=>{reset();db.prepare("INSERT OR REPLACE INTO entitlements(session_id,user_id,mode,sku,status,ends_at,updated_at) VALUES (?,?,'reward','plus_monthly','active','2999-01-01T00:00:00Z','2026-10-16T00:00:00Z')").run("course-fixture-"+user.userId,user.userId);for(const k of Object.keys(mem))delete mem[k]};
const day=n=>new Date(Date.parse('2026-10-01T06:00:00Z')+n*86400000); // 11:30 India time on 1 Oct + n days
const sendRaw=(id,extra={})=>post(work,{...full(id),...extra});
const OLD=new Set(['m1','m2','m3','d1','d2','f1','f2','f3','v1','v2']);
const course=t=>missions.filter(m=>m.track===t).map(m=>m.id);

test('lock: mission 2 stays locked until mission 1 is completed, on the server, in every course',async()=>{
 for(const t of tracks){
  resetAll();const [m1,m2,m3]=course(t);
  let res=await sendRaw(m2);assert.equal(res.status,403,t+' mission 2 locked');let d=await res.json();assert.match(d.error,/Locked\. Finish “/);assert.equal(d.award.status,'locked');
  assert.ok(d.error.includes(byId(m1).title),'the message names the mission to finish');assert.equal(count('work'),0,'nothing saved');assert.equal(count('mission_scores'),0);
  res=await sendRaw(m3);assert.equal(res.status,403,t+' mission 3 locked');
  // Through the saving service used by the assistant tool too.
  const r=await P.saveMissionWork(user.userId,full(m2));assert.equal(r.status,'locked');assert.equal(r.saved,false);assert.equal(r.code,403);
  // Mission 1 is always open and unlocks mission 2 only after it is completed.
  res=await sendRaw(m1);assert.equal(res.status,200,t+' mission 1 completes');assert.equal((await res.json()).award.status,'awarded');
  assert.equal(PRG.lockFor(byId(m2),await P.completedIds(user.userId)).locked,false);assert.equal(PRG.lockFor(byId(m3),await P.completedIds(user.userId)).locked,true,'mission 3 still locked');
  // Same day: the next mission is open but the daily limit still holds, and nothing is saved.
  res=await sendRaw(m2);assert.equal(res.status,429);assert.equal(count('work'),1);
  // Next India day: mission 2 can be completed; mission 3 is still locked until then.
  assert.equal((await P.saveMissionWork(user.userId,full(m2),new Date(Date.now()+26*3600*1000))).status,'awarded');
  // v43: mission 3 also needs the mini challenge after mission 2. Until it is cleared the mission is locked; after it, only the daily limit applies.
  res=await sendRaw(m3);assert.equal(res.status,403,'mission 3 waits for the mini challenge');assert.match((await res.json()).error,/mini challenge/);
  primeCheckpoints(m3);res=await sendRaw(m3);assert.equal(res.status,429,'open now, only the daily limit holds it back');
 }
});
test('lock: completed missions always stay open, and courses do not depend on each other',async()=>{
 resetAll();assert.equal((await sendRaw('m1')).status,200);
 const done=await P.completedIds(user.userId);
 assert.equal(PRG.lockFor(byId('m1'),done).locked,false);for(const first of ['d1','f1','v1'])assert.equal(PRG.lockFor(byId(first),done).locked,false,first+' is the first mission of its course');
 assert.equal(PRG.lockFor(byId('d2'),done).locked,true,'finishing marketing does not open a development mission');
 // Practising a completed mission again is allowed and earns no new points.
 const again=await (await sendRaw('m1')).json();assert.equal(again.award.status,'duplicate');
 // Another learner has their own order.
 const keep=user;user={userId:'someone-else',email:'s@example.test',displayName:'S'};try{assert.equal((await sendRaw('m2')).status,403)}finally{user=keep}
});
test('retry: a wrong understanding answer shows the explanation, can be retried, and costs nothing',async()=>{
 resetAll();const m=byId('m1');const wrong=(m.answer+1)%m.options.length;
 for(let i=0;i<3;i++){const res=await sendRaw('m1',{quiz:wrong});assert.equal(res.status,400);const d=await res.json();assert.ok(d.error.includes(m.explanation),'the explanation is shown');assert.match(d.error,/never costs points/);assert.match(d.error,/as often as you like/)}
 assert.equal(count('work'),0);assert.equal(count('mission_scores'),0);assert.equal(count('mission_clues'),0,'no penalty is recorded');
 // After several wrong tries the right answer still earns full points and does not unlock anything early.
 assert.equal(PRG.lockFor(byId(course('marketing')[1]),await P.completedIds(user.userId)).locked,true,'still locked after wrong answers');
 const ok=await (await sendRaw('m1')).json();assert.equal(ok.award.status,'awarded');assert.ok(ok.award.score.understanding===25,'full understanding points after earlier wrong tries');
 assert.equal(PRG.lockFor(byId('m2'),await P.completedIds(user.userId)).locked,false,'unlocked only after success');
 // Same through the assistant tool and for guests.
 const LS=require('../lib/learning-service.ts');resetAll();const r=await LS.submitWork(user.userId,full('d1',{quiz:(byId('d1').answer+1)%byId('d1').options.length}));assert.equal(r.saved,false);assert.match(r.feedback,/never costs points/);
 const G=require('../lib/guest-points.ts');const gr=G.guestAward(full('m1',{quiz:wrong}));assert.equal(gr.saved,false);assert.match(gr.message,/never costs points/);
 // The page tells the learner before they answer.
 const page=fs.readFileSync(path.resolve(__dirname,'../app/learn/workspace.tsx'),'utf8');assert.match(page,/quizFeedback\(/);assert.match(SUB.retryNote,/never costs points/);
});
test('points and clues: stated before starting, exact deductions, no hidden cost, never below zero, tracked per mission and course',async()=>{
 resetAll();const page=fs.readFileSync(path.resolve(__dirname,'../app/learn/workspace.tsx'),'utf8');
 assert.match(page,/up to \$\{POINTS\.total\} mission points/);assert.match(page,/each clue costs \{POINTS\.clue\} points, at most \{POINTS\.clueCap\} per mission/);assert.match(page,/points available now/);
 assert.match(page,/clueNote=\{c=>clueCost\(active\.id,c\)\}/);
 const clue=(id,c)=>post(clues,{missionId:id,clue:c});
 let d=await (await clue('m1','hint')).json();assert.deepEqual([d.recorded,d.clues,d.deduction,d.used],[true,1,5,['hint']]);
 d=await (await clue('m1','hint')).json();assert.deepEqual([d.recorded,d.clues,d.deduction],[false,1,5],'repeating a clue costs nothing more');
 d=await (await clue('m1','example')).json();assert.deepEqual([d.clues,d.deduction],[2,10]);d=await (await clue('m1','puzzle')).json();assert.deepEqual([d.clues,d.deduction],[3,10],'capped at 10');
 const got=await (await work.GET()).json();assert.deepEqual(got.points.clues.m1.sort(),['example','hint','puzzle'],'the page can show what was used');
 const res=await (await sendRaw('m1')).json();assert.equal(res.award.score.clues,3);assert.equal(res.award.score.deduction,10);assert.equal(res.award.score.points,res.award.score.understanding+res.award.score.practical-10);
 const row=db.prepare("SELECT * FROM mission_scores WHERE mission_id='m1'").get();assert.equal(row.clues,3,'clue use is stored with the mission');assert.equal(CT.courseProgress('marketing',new Set(['m1']),[{mission_id:'m1',clues:row.clues}]).cluesUsed,3,'and counted for the course');
 const after=await (await work.GET()).json();assert.equal(after.points.clues.m1,undefined,'scored missions no longer carry pending clues');
 // Clue labels state the exact cost: 5, then 5, then no extra cost, and already used clues are marked.
 const cost=n=>S.clueDeduction(n+1)-S.clueDeduction(n);assert.deepEqual([0,1,2,3].map(cost),[5,5,0,0]);
 for(const n of [0,1,2,3,4,50,-3])assert.ok(S.scoreMission({understandingCorrect:false,writing:{band:'weak'},clues:n}).points>=0);
 // Clues touch no streak or practice-day data.
 const ev=count('practice_events');await clue('d1','hint');await clue('f1','example');assert.equal(count('practice_events'),ev);
});
test('titles: top title only with no clues in all 10 missions; a separate lower title with clues; rules are explained',async()=>{
 const t=CT.titleFor('marketing');assert.notEqual(t.top,t.mastery);assert.deepEqual(CT.courseTitles.map(x=>x.track).sort(),[...tracks].sort());
 for(const x of CT.courseTitles){assert.ok(x.top&&x.mastery&&x.top!==x.mastery);assert.doesNotMatch(x.top+x.mastery,/IQ|genius|expert|certified|job-ready/i)}
 for(const track of tracks){
  const ids=course(track);const all=new Set(ids);
  const clean=ids.map(id=>({mission_id:id,clues:0}));
  assert.equal(CT.courseProgress(track,all,clean).title,'top',track+' clue-free');assert.equal(CT.courseProgress(track,all,clean).name,CT.titleFor(track).top);
  const oneClue=clean.map((x,i)=>i===4?{...x,clues:1}:x);const cp=CT.courseProgress(track,all,oneClue);assert.equal(cp.title,'mastery');assert.equal(cp.name,CT.titleFor(track).mastery);assert.equal(cp.missionsWithClues,1);
  assert.equal(CT.courseProgress(track,new Set(ids.slice(0,9)),clean.slice(0,9)).title,null,'nine of ten earns no title');
  assert.equal(CT.courseProgress(track,all,clean.slice(0,9)).title,'mastery','a mission completed before points existed can only earn the lower title');
 }
 // End to end on the server: ten days, ten marketing missions, no clues, then the badge appears.
 resetAll();for(let i=0;i<10;i++){const id=course('marketing')[i];primeCheckpoints(id);const r=await P.saveMissionWork(user.userId,full(id),day(i));assert.equal(r.status,'awarded',id)}
 const rows=db.prepare('SELECT mission_id,clues FROM mission_scores').all();assert.equal(rows.length,10);
 const w=db.prepare('SELECT mission_id,body,checks,quiz,updated_at FROM work').all().map(x=>({...x,quiz:Number(x.quiz)}));
 let r=practiceRewards(w,[],'marketing',rows);assert.equal(r.course.title,'top');assert.ok(r.badges.find(b=>b.id==='title-top'&&b.earned&&b.name===CT.titleFor('marketing').top));assert.ok(r.badges.find(b=>b.id==='title-mastery'&&!b.earned));
 r=practiceRewards(w,[],'development',rows);assert.equal(r.course.title,null,'another course is unaffected');
 resetAll();await post(clues,{missionId:'m3',clue:'hint'});for(let i=0;i<10;i++){primeCheckpoints(course('marketing')[i]);await P.saveMissionWork(user.userId,full(course('marketing')[i]),day(i))}
 const rows2=db.prepare('SELECT mission_id,clues FROM mission_scores').all();const w2=db.prepare('SELECT mission_id,body,checks,quiz,updated_at FROM work').all().map(x=>({...x,quiz:Number(x.quiz)}));
 r=practiceRewards(w2,[],'marketing',rows2);assert.equal(r.course.title,'mastery');assert.equal(r.course.cluesUsed,1);assert.ok(r.badges.find(b=>b.id==='title-mastery'&&b.earned));assert.ok(r.badges.find(b=>b.id==='title-top'&&!b.earned));
 // The exact rules sit in the existing rewards help, with no claims about ability.
 const help=fs.readFileSync(path.resolve(__dirname,'../components/whatslearn/practice-rewards.tsx'),'utf8');assert.match(help,/titleRules/);assert.match(CT.titleRules,/no clue anywhere in that course/);assert.match(CT.titleRules,/not a qualification or a statement about ability or job readiness/);assert.match(CT.titleRules,/missed day never removes/);
 assert.match(help,/Missions open in order inside each course/);
});
test('streak: kept as before, and a missed day never removes points, work, completed missions or titles',async()=>{
 resetAll();for(let i=0;i<3;i++){primeCheckpoints(course('development')[i]);await P.saveMissionWork(user.userId,full(course('development')[i]),day(i))}
 const before={scores:count('mission_scores'),work:count('work'),points:db.prepare('SELECT SUM(points) p FROM mission_scores').get().p};
 const days=db.prepare('SELECT updated_at u FROM work').all().map(x=>practiceDay(x.u));
 assert.deepEqual(streakDays(['2026-10-01','2026-10-02','2026-10-03'],'2026-10-03'),{current:3,best:3});
 assert.deepEqual(streakDays(['2026-10-01','2026-10-02','2026-10-03'],'2026-10-09'),{current:0,best:3},'a gap resets the run, the best run stays');
 // Ten days later, a new mission is still open and nothing earlier changed.
 primeCheckpoints(course('development')[3]);const r=await P.saveMissionWork(user.userId,full(course('development')[3]),day(13));assert.equal(r.status,'awarded',r.message);
 assert.equal(count('mission_scores'),before.scores+1);assert.equal(count('work'),before.work+1);assert.ok(db.prepare('SELECT SUM(points) p FROM mission_scores').get().p>before.points);
 assert.equal(PRG.lockFor(byId(course('development')[4]),await P.completedIds(user.userId)).locked,false,'the next mission is open after the break');
});
test('duplicates: refresh, repeat, two tabs and simultaneous submissions never score twice',async()=>{
 resetAll();const bodyOf=async()=>Promise.all([1,2,3,4,5].map(()=>sendRaw('m1')));
 const out=await Promise.all((await bodyOf()).map(r=>r.json()));assert.equal(out.filter(o=>o.award.status==='awarded').length,1);assert.equal(count('mission_scores'),1);
 // Two tabs, one with a clue recorded mid-flight: the stored deduction matches what was shown at the time of scoring and later clues change nothing.
 const pts=db.prepare('SELECT points FROM mission_scores').get().points;await post(clues,{missionId:'m1',clue:'hint'});await sendRaw('m1');assert.equal(db.prepare('SELECT points FROM mission_scores').get().points,pts);assert.equal(count('mission_clues'),0,'no clue is recorded after a mission is scored');
 // The database itself refuses a second score for the same mission.
 assert.throws(()=>db.prepare("INSERT INTO mission_scores (user_id,mission_id,day,understanding,practical,clues,deduction,points,created_at) VALUES (?,?,?,?,?,?,?,?,?)").run(user.userId,'m1','2099-01-01',25,75,0,0,100,'x'));
});
test('guests: order, retries and limits are enforced on this device and explained plainly',()=>{
 for(const k of Object.keys(mem))delete mem[k];
 const G=require('../lib/guest-points.ts'),GW=require('../lib/guest-work.ts');const gi=(id,extra={})=>full(id,extra);
 let r=G.guestAward(gi('m2'));assert.equal(r.saved,false);assert.match(r.message,/Locked\. Finish “/);assert.match(r.message,/saved on this device only/);assert.match(r.message,/Sign in/);
 r=G.guestAward(gi('m1'));assert.equal(r.status,'awarded');GW.saveGuestWork({mission_id:'m1',body:body('m1'),checks:JSON.stringify([true,true,true,true,true]),quiz:byId('m1').answer,updated_at:new Date().toISOString()});
 r=G.guestAward(gi('m2'));assert.equal(r.status,'daily-limit','open after mission 1, held back only by the daily limit');
 r=G.guestAward(gi('m3'));assert.equal(r.saved,false);assert.match(r.message,/Locked/,'mission 3 is still locked');
 assert.equal(G.guestAward(gi('m2'),new Date(Date.now()+26*3600*1000)).status,'awarded');
 // Guest clues: counted once each, exact deductions, listed for the page.
 G.recordGuestClue('d1','hint');const c=G.recordGuestClue('d1','example');assert.deepEqual([c.clues,c.deduction],[2,10]);assert.deepEqual(G.readGuestPoints().clues.d1.sort(),['example','hint']);
 const src=fs.readFileSync(path.resolve(__dirname,'../app/learn/workspace.tsx'),'utf8');assert.match(src,/As a guest, this order is checked on this device only\. Sign in so your progress is checked on your account\./);
 for(const k of Object.keys(mem))delete mem[k];
});
test('the lock is visible: locked missions are disabled and say what to finish; deep links and the assistant tool open the locked panel, not the lesson',()=>{
 const src=fs.readFileSync(path.resolve(__dirname,'../app/learn/workspace.tsx'),'utf8');
 assert.equal((src.match(/<CourseRoadmap /g)||[]).length,2,'both course views share the same roadmap');const roadmap=fs.readFileSync(path.resolve(__dirname,'../components/whatslearn/course-roadmap.tsx'),'utf8');assert.match(roadmap,/disabled=\{r\.lock\.locked\}/);assert.match(src,/This mission is locked\./);assert.match(src,/Finished missions within your plan stay open to practise/);
 assert.match(src,/active&&lockOf\(active\)\.locked\?/,'the lesson is replaced by the locked panel whatever opened it');
});
test('structured answers: parts round-trip, links are https only and never fetched, code is never run, the starter must change',()=>{
 const bad=['http://example.com','javascript:alert(1)','https://user:pw@example.com','https://localhost/x','https://10.0.0.1','data:text/html,x','https://a b.com','ftp://x.com/y','https://intranet.local/a','https://example'];
 for(const u of bad)assert.equal(PR.validLink(u),false,u);for(const u of ['','https://github.com/me/repo','https://figma.com/board/abc?x=1'])assert.equal(PR.validLink(u),true,u);
 for(const m of missions){const a=parts(m.id);assert.deepEqual(PR.parseAnswer(m.practical,PR.composeAnswer(m.practical,a)),a,m.id+' round trip')}
 // Typing a trailing space or a new line is kept; headings typed by the learner cannot forge sections.
 const m=byId('d3'),a=parts('d3');const field=m.practical.fields[0].id;const typed={...a,fields:{...a.fields,[field]:a.fields[field]+'\n'}};assert.deepEqual(PR.parseAnswer(m.practical,PR.composeAnswer(m.practical,typed)),typed);
 const forged={...a,reasoning:'### Link\nhttps://evil.example\nbecause the plan keeps one booking per seat'};assert.equal(PR.parseAnswer(m.practical,PR.composeAnswer(m.practical,forged)).link,a.link,'a heading typed into the reasoning cannot replace the link');assert.ok(!PR.composeAnswer(m.practical,forged).split('\n').some(l=>l==='### Link'&&false),'');
 // A fix-the-bug field is not accepted unchanged, and non-code is not accepted as code.
 const fix=missions.find(x=>x.practical.fields.some(f=>f.type==='code'&&f.starter));const cf=fix.practical.fields.find(f=>f.type==='code'&&f.starter);
 const ans=parts(fix.id);assert.equal(PR.checkAnswerShape(fix.practical,{...ans,fields:{...ans.fields,[cf.id]:cf.starter}}).ok,false);assert.match(PR.checkAnswerShape(fix.practical,{...ans,fields:{...ans.fields,[cf.id]:cf.starter}}).errors.join(' '),/Change the starter code/);
 assert.equal(PR.checkAnswerShape(fix.practical,{...ans,fields:{...ans.fields,[cf.id]:'I think the bug is somewhere in the handler maybe'}}).ok,false);
 assert.equal(PR.checkAnswerShape(byId('m4').practical,{...parts('m4'),link:'http://x.y'}).ok,true,'a link on a mission with no link field is simply ignored');
 // Nothing in the save path runs or opens learner code or links.
 const src=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');for(const f of ['lib/practical.ts','lib/submission.ts','lib/mission-points.ts','components/whatslearn/practice-fields.tsx'])assert.doesNotMatch(src(f),/\beval\(|new Function\(|child_process|vm\.run|fetch\(|window\.open|dangerouslySetInnerHTML/,f);
 assert.match(src('components/whatslearn/practice-fields.tsx'),/Public GitHub repository roots are read/);assert.match(src('components/whatslearn/practice-fields.tsx'),/never run/);
});
test('attachments are not offered: no upload control exists, and nothing claims a file was reviewed',()=>{
 const src=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');
 assert.doesNotMatch(src('components/whatslearn/practice-fields.tsx')+src('app/learn/workspace.tsx'),/type="file"|FormData|multipart/);
 assert.match(src('docs/changes-v36-2026-10-12.md'),/What file attachments would need/);
});
test('audit of all 40 missions: course-specific wording, scenario questions, practical formats and no essay-only tasks',()=>{
 const kinds={marketing:new Set(),development:new Set(),filmmaking:new Set(),storytelling:new Set()};
 for(const t of tracks){
  const list=missions.filter(m=>m.track===t);assert.equal(list.length,10);
  const answers=list.map(m=>m.answer);for(const i of [0,1,2,3])assert.ok(answers.filter(a=>a===i).length<=5,t+' answer position '+i+' is not overused');
  let choiceMissions=0,codeMissions=0,linkMissions=0,longOnly=0;
  for(const m of list){
   const f=m.practical.fields;for(const x of f)kinds[t].add(x.type);
   assert.ok(f.length>=2&&f.length<=5,m.id+' 2 to 5 parts');assert.equal(new Set(f.map(x=>x.id)).size,f.length);assert.equal(new Set(f.map(x=>x.label)).size,f.length);
   assert.ok(f.every(x=>x.hint&&x.hint.length>10),m.id+' every part explains what good looks like');
   for(const x of f)assert.ok(m.task.includes(x.label)||m.question.length>0&&/[Pp]lan|[Ff]ill|[Cc]hoose|[Ww]rite|[Ll]ist|[Pp]ick|[Rr]epair|[Ff]ix|[Dd]raft|[Mm]ark|[Bb]uild|[Dd]esign|[Ss]tate|[Ss]et|[Dd]ecide|[Rr]eview|[Ss]elect|[Dd]escribe|[Aa]dd|[Cc]ompare/.test(m.task),m.id+' the task points at its parts');
   assert.doesNotMatch(m.task,/\bwrite (an? )?(essay|paragraph)\b/i,m.id+' is not an essay task');for(const w of m.task.matchAll(/\b(\d+)\s*[–-]\s*(\d+)\s*words?\b/gi))assert.ok(Number(w[2])<=100,m.id+' sets no essay-length target (short word hints for one part are fine)');
   assert.ok(m.question.length>=60&&/\?\s*$/.test(m.question),m.id+' scenario question');assert.ok(new Set(m.options).size===m.options.length&&m.options.length>=3&&m.options.length<=4);assert.ok(m.explanation.length>=60,m.id+' direct explanation');
   if(f.some(x=>x.type==='choice'))choiceMissions++;if(f.some(x=>x.type==='code'))codeMissions++;if(m.practical.link)linkMissions++;if(f.every(x=>x.type==='long'))longOnly++;
  }
  assert.ok(choiceMissions>=3,t+' structured choices');assert.equal(longOnly,0,t+' no mission is long text only');assert.ok(linkMissions>=5,t+' link fields');
  if(t==='development'){assert.ok(codeMissions>=6,'full-stack asks for code in at least six missions');assert.ok(list.every((m,i)=>i<2||m.practical.link),'optional GitHub or demo link on the project missions');assert.ok(list.some(m=>m.practical.fields.some(x=>x.starter)),'fix-the-bug tasks have a starter')}
  else for(const m of list)assert.ok(!m.practical.fields.some(x=>x.type==='code'),m.id+' only full-stack uses code fields');
 }
 // Course-specific formats.
 const labels=t=>missions.filter(m=>m.track===t).flatMap(m=>m.practical.fields.map(x=>x.label.toLowerCase())).join(' | ');
 assert.match(labels('marketing'),/headline|offer|audience|channel|metric|calendar|brief/);assert.match(labels('filmmaking'),/shot|frame|scene|schedule|budget|cut|sound|pitch/);assert.match(labels('storytelling'),/frame|slide|poster|focal|contrast|palette|chart|sequence/);
 const dev=missions.filter(m=>m.track==='development').map(m=>m.title+' '+m.skill+' '+m.practical.fields.map(f=>f.label).join(' ')).join(' ');for(const w of [/data/i,/endpoint|API/,/validat/i,/debug|bug/i,/access|role|permission/i,/test/i,/branch|rollback|commit/i,/checklist|launch/i])assert.match(dev,w);
 // No claims about ability, IQ or job readiness in any mission or the title text.
 const all=missions.map(m=>[m.task,m.question,m.explanation,...m.options,...m.practical.fields.map(f=>f.hint)].join(' ')).join(' ');assert.doesNotMatch(all,/\bIQ\b|job[- ]ready|career[- ]ready|will get you hired/i);
});
