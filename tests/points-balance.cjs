// Points balance, one-time starting points, clue charges, 10-day streak title, direct answer feedback and the migration backfill. No network, no real keys. Run: node --test tests/points-balance.cjs
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),{DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync(':memory:');for(const f of fs.readdirSync(path.resolve(__dirname,'../drizzle')).filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync(path.resolve(__dirname,'../drizzle',f),'utf8').replaceAll('--> statement-breakpoint',''));
// Like Cloudflare D1, a batch is all-or-nothing.
const d1={prepare(sql){const stmt=db.prepare(sql);const api=(...args)=>({async first(){return stmt.get(...args)||null},async all(){return {results:stmt.all(...args)}},async run(){const r=stmt.run(...args);return {meta:{changes:r.changes}}},_run:()=>stmt.run(...args)});return {bind:api,...api()}},async batch(list){db.exec('BEGIN');try{const out=list.map(s=>({meta:{changes:s._run().changes}}));db.exec('COMMIT');return out}catch(e){db.exec('ROLLBACK');throw e}}};
let user={userId:'learner',email:'l@example.test',displayName:'L'};const env={DB:d1};
const original=Module._load;Module._load=function(name,parent,isMain){if(name==='@/app/chatgpt-auth')return {getChatGPTUser:async()=>user};if(name==='cloudflare:workers')return {env};if(name.startsWith('@/'))name=path.resolve(__dirname,'..',name.slice(2));return original.call(this,name,parent,isMain)};
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,f);
const {missions}=require('../lib/missions.ts'),{programmeNames}=require('../lib/programmes.ts'),{miniChallenge,practiceRewards}=require('../lib/play.ts');
const S=require('../lib/mission-score.ts'),{checkWriting}=require('../lib/writing-check.ts'),P=require('../lib/mission-points.ts');
const work=require("../app/api/work/route.ts"),clues=require("../app/api/clues/route.ts"),PT=require("../lib/points.ts"),CT=require("../lib/course-titles.ts"),QF=require("../lib/quiz-feedback.ts"),{languages}=require("../lib/languages.ts"),SUB=require("../lib/submission.ts");
const samples=require('./fixtures/course-samples.json');
const byId=id=>missions.find(m=>m.id===id);
const prevOf=id=>{const m=byId(id);const l=missions.filter(x=>x.track===m.track);return l.slice(0,l.findIndex(x=>x.id===id)).map(x=>x.id)};
const primeCheckpoints=id=>{const m=byId(id);const l=missions.filter(x=>x.track===m.track);const p=l.findIndex(x=>x.id===id)+1;for(let a=2;a<p;a+=2)db.prepare('INSERT OR IGNORE INTO checkpoint_clears (user_id,track,after_mission,created_at) VALUES (?,?,?,?)').run(user.userId,m.track,a,new Date().toISOString())};
const prime=id=>{primeCheckpoints(id);for(const q of prevOf(id))db.prepare("INSERT OR IGNORE INTO work (user_id,mission_id,body,checks,quiz,updated_at) VALUES (?,?,?,?,?,?)").run(user.userId,q,'seed','[]',byId(q).answer,new Date().toISOString())};
const Save=(id,now=new Date('2026-10-12T05:00:00Z'))=>{prime(id);return P.saveMissionWork(user.userId,{missionId:id,body:samples[id],checks:[true,true,true,true,true],quiz:byId(id).answer},now)};
const post=(route,body)=>route.POST(new Request('https://whatslearn.in/api/x',{method:'POST',headers:{origin:'https://whatslearn.in','Content-Type':'application/json'},body:JSON.stringify(body)}));
const clue=(missionId,c)=>post(clues,{missionId,clue:c}).then(r=>r.json());
const rows=(kind)=>db.prepare("SELECT * FROM point_ledger WHERE user_id=?"+(kind?" AND kind='"+kind+"'":'')).all(user.userId);
const fresh=(id,start)=>{user={userId:id,email:id+'@example.test',displayName:id};if(start===undefined)delete env.STARTING_POINTS;else env.STARTING_POINTS=start};

test('starting points: configurable, documented default, granted exactly once per account',async()=>{
 fresh('a1');assert.equal(PT.DEFAULT_STARTING_POINTS,50);assert.equal(PT.startingPoints(),50,'the default is 50 when nothing is configured');
 assert.equal((await P.loadScores('a1')).balance,50);
 // Refresh, sign out and back in, retry signup, a second tab: every one of these calls the same thing and never grants again.
 for(let i=0;i<5;i++)await P.loadScores('a1');await Promise.all([PT.ensureAccount('a1'),PT.ensureAccount('a1'),PT.ensureAccount('a1')]);
 assert.equal(rows('starting').length,1);assert.equal(await PT.pointsBalance('a1'),50);
 // Changing the setting later never tops up an existing account.
 env.STARTING_POINTS='500';await P.loadScores('a1');assert.equal(await PT.pointsBalance('a1'),50);
 fresh('a2','120');assert.equal((await P.loadScores('a2')).balance,120,'STARTING_POINTS is respected for a new account');
 fresh('a3','0');assert.equal((await P.loadScores('a3')).balance,0,'zero is allowed');
 for(const bad of ['abc','-5','1.5','999999','  '])assert.equal((fresh('b'+bad.length+Math.abs(bad.length),bad),PT.startingPoints()),50,'an invalid value falls back to the default: '+JSON.stringify(bad));
 delete env.STARTING_POINTS;
});
test('starting points are also granted once when the first action is a clue or a save, not only a page load',async()=>{
 fresh('c1');const r=await clue('m1','hint');assert.equal(r.balance,45);assert.equal(db.prepare("SELECT COUNT(*) n FROM point_ledger WHERE user_id='c1' AND kind='starting'").get().n,1);
 fresh('c2');const s=await Save('m1');assert.equal(s.status,'awarded');assert.equal(db.prepare("SELECT COUNT(*) n FROM point_ledger WHERE user_id='c2' AND kind='starting'").get().n,1);
 assert.equal(await PT.pointsBalance('c2'),50+s.score.points);
});
test('clue cost is taken from the real balance, once per clue, and shown before it is used',async()=>{
 fresh('d1');
 // The cost is known before the click: the learner sees it from the same rule the server uses.
 assert.equal(S.clueDeduction(1)-S.clueDeduction(0),5);assert.equal(S.clueDeduction(2)-S.clueDeduction(1),5);assert.equal(S.clueDeduction(3)-S.clueDeduction(2),0);
 const page=fs.readFileSync(path.resolve(__dirname,'../app/learn/workspace.tsx'),'utf8');assert.match(page,/clueCost=/);assert.match(page,/\(−'\+/);
 let r=await clue('m1','hint');assert.deepEqual([r.allowed,r.recorded,r.charged,r.balance],[true,true,5,45]);
 r=await clue('m1','hint');assert.deepEqual([r.allowed,r.recorded,r.charged,r.balance],[true,false,0,45],'the same clue is never charged twice');
 r=await clue('m1','example');assert.equal(r.balance,40);
 r=await clue('m1','puzzle');assert.deepEqual([r.allowed,r.charged,r.balance],[true,0,40],'the cap is 10 per mission, so a third clue costs nothing');
 assert.equal(rows('clue').length,3);
 // Two tabs / retries sending the same clue at once still charge once.
 const rs=await Promise.all([1,2,3,4,5].map(()=>clue('m2','hint')));assert.equal(rs.filter(x=>x.recorded).length,1);assert.equal(await PT.pointsBalance('d1'),35);
 assert.equal(rows('clue').filter(x=>x.ref==='m2:hint').length,1);
});
test('the balance never goes below zero: a clue the balance cannot cover stays hidden and changes nothing',async()=>{
 fresh('e1','4');let r=await clue('m1','hint');
 assert.deepEqual([r.allowed,r.recorded,r.balance],[false,false,4]);assert.match(r.message,/costs 5 points/);assert.match(r.message,/balance is 4/);
 assert.equal(db.prepare("SELECT COUNT(*) n FROM mission_clues WHERE user_id='e1'").get().n,0,'no clue is recorded');assert.deepEqual(r.used,[]);
 fresh('e2','5');r=await clue('m1','hint');assert.equal(r.balance,0);r=await clue('m1','example');assert.deepEqual([r.allowed,r.balance],[false,0]);assert.deepEqual(r.used,['hint']);
 assert.ok(db.prepare("SELECT MIN(b) m FROM (SELECT SUM(delta) OVER (ORDER BY id) b FROM point_ledger WHERE user_id='e2')").get().m>=0,'no running balance is ever negative');
 // The refusal over HTTP is still a normal answer the page can read.
 fresh('e3','0');const res=await post(clues,{missionId:'m1',clue:'hint'});assert.equal(res.status,200);assert.equal((await res.json()).allowed,false);
});
test('missions add their points once; clue costs are charged once in total, not again at the end',async()=>{
 fresh('f1');await clue('m1','hint');await clue('m1','example');assert.equal(await PT.pointsBalance('f1'),40);
 const s=await Save('m1');assert.equal(s.score.clues,2);assert.equal(s.score.points,s.score.understanding+s.score.practical-10);
 assert.equal(await PT.pointsBalance('f1'),50+s.score.points,'balance = starting + mission points after clue costs');
 const again=await Save('m1');assert.notEqual(again.status,'awarded');assert.equal(await PT.pointsBalance('f1'),50+s.score.points,'repeating a completed mission adds nothing');
 const r=await clue('m1','puzzle');assert.equal(r.charged,0);assert.equal(await PT.pointsBalance('f1'),50+s.score.points,'clues on a completed mission cost nothing');
 assert.equal(rows('mission').length,1);
});
test('locks, the daily limit and wrong answers never touch the balance',async()=>{
 fresh('g1');const day=new Date('2026-10-12T05:00:00Z');
 const locked=await P.saveMissionWork('g1',{missionId:'m3',body:samples.m3,checks:[true,true,true,true,true],quiz:byId('m3').answer},day);assert.equal(locked.saved,false);
 const wrongRes=await post(work,{missionId:'m1',body:samples.m1,checks:[true,true,true,true,true],quiz:(byId('m1').answer+1)%byId('m1').options.length});const wrong=await wrongRes.json();assert.notEqual(wrong.award?.status,'awarded');assert.equal(db.prepare("SELECT COUNT(*) n FROM work WHERE user_id='g1' AND body<>'seed'").get().n,0);
 assert.match(JSON.stringify(wrong),/That answer is not correct\./);assert.match(JSON.stringify(wrong),/Concept to reconsider: /);
 await PT.ensureAccount('g1');assert.equal(await PT.pointsBalance('g1'),50);assert.equal(rows('mission').length,0);
 const a=await Save('m1',day);assert.equal(a.status,'awarded');const bal=await PT.pointsBalance('g1');
 const same=await Save('m2',new Date('2026-10-12T17:00:00Z'));assert.equal(same.status,'daily-limit','a second new mission the same India day waits');assert.equal(await PT.pointsBalance('g1'),bal);
 const next=await Save('m2',new Date('2026-10-13T05:00:00Z'));assert.equal(next.status,'awarded','the next mission is still available on a later day');
 // India-time boundary: 18:30 UTC is already the next India day.
 const late=await Save('m3',new Date('2026-10-13T18:29:00Z'));assert.equal(late.status,'daily-limit');const nextDay=await Save('m3',new Date('2026-10-13T18:31:00Z'));assert.equal(nextDay.status,'awarded');
 const ledger=rows('mission').reduce((n,x)=>n+x.delta,0);const scored=db.prepare("SELECT SUM(points) p FROM mission_scores WHERE user_id='g1'").get().p;assert.equal(ledger,scored,'ledger and scores agree');
});
test('the wrong-answer and right-answer text is direct in every supported language',()=>{
 const m=byId('m1');const en=QF.quizFeedback('en',false,m.skill,m.explanation);
 assert.ok(en.text.startsWith('That answer is not correct.'));assert.ok(en.text.includes('Concept to reconsider: '+m.skill));assert.ok(en.text.includes(m.explanation));assert.match(en.text,/costs no points and does not lock anything/);
 assert.ok(QF.quizFeedback('en',true,m.skill,m.explanation).text.startsWith('Correct. '+m.explanation));
 for(const code of Object.keys(languages)){
  const w=QF.quizFeedback(code,false,m.skill,m.explanation),r=QF.quizFeedback(code,true,m.skill,m.explanation);
  assert.ok(w.text.includes(m.explanation)&&w.text.includes(m.skill),code);assert.ok(r.text.includes(m.explanation),code);assert.notEqual(w.title,r.title,code);
  if(QF.feedbackLanguages.includes(code)&&code!=='en')assert.notEqual(w.title,en.title,code+' has its own line');
 }
 assert.equal(QF.feedbackLines('xx').wrong,'That answer is not correct.','unknown languages use English');
 for(const c of ['brx','mni','ks','sat'])assert.equal(QF.feedbackLines(c).wrong,'That answer is not correct.',c+' shows English until a native speaker supplies the line');
 assert.match(SUB.wrongAnswerMessage(m),/^That answer is not correct\. Concept to reconsider: /);
 const page=fs.readFileSync(path.resolve(__dirname,'../app/learn/workspace.tsx'),'utf8');assert.match(page,/quizFeedback\(profile\.language,quiz===active\.answer/);
});
test('wrong answer over the website API: not saved, retry works, nothing unlocks or is charged',async()=>{
 fresh('h1');prime('m1');const m=byId('m1');const wrongQ=(m.answer+1)%m.options.length;
 const res=await post(work,{missionId:'m1',body:samples.m1,checks:[true,true,true,true,true],quiz:wrongQ});const d=await res.json();
 assert.match(JSON.stringify(d),/That answer is not correct\./);assert.equal(db.prepare("SELECT COUNT(*) n FROM work WHERE user_id='h1' AND mission_id='m2'").get().n,0);
 const ok=await (await post(work,{missionId:'m1',body:samples.m1,checks:[true,true,true,true,true],quiz:m.answer})).json();assert.equal(ok.award.status,'awarded');
 assert.equal(await PT.pointsBalance('h1'),50+ok.award.score.points);
});
const dayList=(start,n)=>Array.from({length:n},(_,i)=>new Date(Date.UTC(2026,9,start+i)).toISOString().slice(0,10));
test('daily streak: one new scored mission, any course, on each consecutive India day; a miss resets only the current streak',()=>{
 assert.deepEqual(CT.newMissionStreak(dayList(1,5),'2026-10-05'),{current:5,best:5});
 assert.deepEqual(CT.newMissionStreak(dayList(1,5),'2026-10-06'),{current:5,best:5},'yesterday still counts, today is not over');
 assert.deepEqual(CT.newMissionStreak(dayList(1,5),'2026-10-07'),{current:0,best:5},'a missed India day resets only the current streak');
 assert.deepEqual(CT.newMissionStreak([...dayList(1,5),...dayList(8,2)],'2026-10-09'),{current:2,best:5},'a gap starts a new run; the best run is kept');
 assert.deepEqual(CT.newMissionStreak(['2026-10-01','2026-10-01','2026-10-02'],'2026-10-02'),{current:2,best:2},'two entries on one day count once');
 assert.deepEqual(CT.newMissionStreak([],'2026-10-02'),{current:0,best:0});
 assert.match(CT.streakRules,/one new mission, in any course/);assert.match(CT.streakRules,/does not count/);assert.match(CT.streakRules,/never removed/);
});
test('daily streak across midnight India time, and for a learner in any other time zone',()=>{
 const {practiceDay}=require('../lib/play.ts');const old=process.env.TZ;
 try{for(const tz of ['Asia/Kolkata','America/Los_Angeles','Pacific/Auckland','Europe/London','UTC']){
  process.env.TZ=tz;
  assert.equal(practiceDay('2026-10-12T18:29:00Z'),'2026-10-12',tz+': 23:59 IST is still the 12th');
  assert.equal(practiceDay('2026-10-12T18:30:00Z'),'2026-10-13',tz+': 00:00 IST is the 13th');
  assert.equal(practiceDay('2026-10-12T18:31:00Z'),'2026-10-13',tz);
 }}finally{if(old===undefined)delete process.env.TZ;else process.env.TZ=old}
});
test('server: the daily streak counts new scored missions only; repeats, clues and a missed day behave as stated',async()=>{
 fresh('k1');const at=(d,h=5)=>new Date(Date.UTC(2026,9,d,h-6,30)); // h:00 India time on 2026-10-d
 const m=['m1','m2','m3','m4'];
 // Day 1 marketing, day 2 development (another course), then a missed day.
 assert.equal((await Save('m1',at(1))).status,'awarded');assert.equal((await Save('d1',at(2))).status,'awarded');
 // Practice: repeating a finished mission on day 3 earns nothing and does not extend the streak.
 const rep=await Save('m1',at(3));assert.notEqual(rep.status,'awarded');
 let st=(await P.loadScores('k1',at(3))).streak;assert.deepEqual(st,{current:2,best:2},'practice on day 3 does not count');
 // A clue used on a not-yet-completed mission neither adds nor removes a streak day.
 await clue('m2','hint');assert.deepEqual((await P.loadScores('k1',at(3))).streak,{current:2,best:2});
 // Day 3 is missed; on day 4 the current streak is gone but the best stays and nothing is erased.
 const d4=await P.loadScores('k1',at(4));assert.deepEqual(d4.streak,{current:0,best:2});assert.equal(d4.scores.length,2);
 // A new scored mission on day 4 starts a new run of 1, even with a clue on it.
 const s4=await Save('m2',at(4));assert.equal(s4.status,'awarded');assert.equal(s4.score.clues,1);assert.deepEqual((await P.loadScores('k1',at(4))).streak,{current:1,best:2});
 // Two minutes either side of midnight India time are different days.
 const late=await Save('m3',new Date('2026-10-05T18:29:00Z'));assert.equal(late.status,'awarded');const sameDay=await Save('d2',new Date('2026-10-05T18:29:30Z'));assert.equal(sameDay.status,'daily-limit');
 const next=await Save('d2',new Date('2026-10-05T18:31:00Z'));assert.equal(next.status,'awarded');
 assert.deepEqual((await P.loadScores('k1',new Date('2026-10-05T18:40:00Z'))).streak,{current:3,best:3});
});
test('10-day no-clue title: all 10 missions of one course, no clue in that course, one new mission a day on 10 consecutive India days',()=>{
 const ids=missions.filter(x=>x.track==='marketing').map(x=>x.id);const all=new Set(ids);
 const mk=(days,clues=()=>0)=>ids.slice(0,days.length).map((id,i)=>({mission_id:id,clues:clues(i),day:days[i]}));
 const T=(scores,done=all)=>CT.courseProgress('marketing',done,scores);
 // Earned in a clean run.
 let p=T(mk(dayList(1,10)));assert.equal(p.title,'streak');assert.equal(p.name,'Campaign Director');assert.equal(p.bestStreak,10);
 assert.equal(T(mk(dayList(25,10).map((d,i)=>i<7?d:new Date(Date.UTC(2026,10,1+i-7)).toISOString().slice(0,10)))).title,'streak','a run that crosses a month end still counts');
 // Denied for a clue anywhere in the course (still finishes the course: practitioner title).
 for(const i of [0,4,9]){p=T(mk(dayList(1,10),k=>k===i?1:0));assert.equal(p.title,'mastery','clue on mission '+(i+1));assert.notEqual(p.name,'Campaign Director')}
 // Denied for a gap (a missed day).
 p=T(mk([...dayList(1,5),...dayList(7,5)]));assert.equal(p.title,'top');assert.equal(p.bestStreak,5);assert.notEqual(p.name,'Campaign Director');
 // Denied for a mixed-course day: the learner spent day 6 on another course, so this course's days have a hole.
 const hole=[...dayList(1,5),...dayList(7,5)];p=T(mk(hole));assert.equal(p.title,'top','a day on another course breaks the run');
 // Denied when the missions were spread over more than 10 days.
 p=T(mk([...dayList(1,3),...dayList(5,3),...dayList(9,4)]));assert.equal(p.title,'top');
 // Denied for fewer than 10 missions: nine in a row is not enough, and the course is not complete.
 p=T(mk(dayList(1,9)),new Set(ids.slice(0,9)));assert.equal(p.title,null);assert.equal(p.name,null);assert.equal(p.bestStreak,9);
 // A streak earned in other courses does not help this course.
 const other=missions.filter(x=>x.track==='development').map(x=>x.id);
 p=T(mk(dayList(1,10)).map(x=>({...x,day:'2026-10-01'})));assert.notEqual(p.title,'streak','ten missions on one day is not ten days');
 const mixed=[...ids.slice(0,5).map((id,i)=>({mission_id:id,clues:0,day:dayList(1,5)[i]})),...other.slice(0,1).map(id=>({mission_id:id,clues:0,day:'2026-10-06'})),...ids.slice(5).map((id,i)=>({mission_id:id,clues:0,day:dayList(7,5)[i]}))];
 p=T(mixed);assert.equal(p.title,'top','development mission on day 6 breaks the marketing run');assert.equal(p.bestStreak,5);
 // A title already earned stays when later days are missed (nothing in the inputs changes, so it is derived the same way every time).
 assert.equal(T(mk(dayList(1,10))).title,'streak');
 // The four names and the rules text.
 assert.deepEqual(CT.courseTitles.map(t=>t.streak),['Campaign Director','Full-Stack Lead','Film Director','Creative Director']);assert.equal(new Set(CT.courseTitles.flatMap(t=>[t.streak,t.top,t.mastery])).size,12);
 for(const re of [/10-day no-clue title/,/one course/,/no clue anywhere in that course/,/10 consecutive days \(India time\)/,/another course, or a missed day, breaks that run/,/any clue in the course rules this title out/,/missed day never removes/,/no leaderboard/i])assert.match(CT.titleRules,re);
});
test('server-verified 10-day title: ten real saved missions of one course, one a day, no clues; any clue or other-course day denies it',async()=>{
 const ids=missions.filter(x=>x.track==='marketing').map(x=>x.id);const day=(d)=>new Date(Date.UTC(2026,9,d,5,0,0));
 const title=async(u,asOf)=>{const d=await P.loadScores(u,asOf);return CT.courseProgress('marketing',new Set(ids.filter(id=>d.scores.some(s=>s.mission_id===id))),d.scores.map(s=>({mission_id:s.mission_id,clues:s.clues,day:s.day}))).title};
 fresh('t1');for(let i=0;i<10;i++)assert.equal((await Save(ids[i],day(1+i))).status,'awarded',ids[i]);
 assert.equal(await title('t1',day(10)),'streak');assert.equal(await title('t1',day(30)),'streak','a later gap removes nothing');
 const d1=await P.loadScores('t1',day(30));assert.equal(d1.scores.length,10);assert.equal(d1.streak.current,0);assert.equal(d1.streak.best,10);
 // A clue on mission 6 means the learner finishes the course but not with the special title.
 fresh('t2');for(let i=0;i<10;i++){if(i===5)await clue(ids[5],'hint');assert.equal((await Save(ids[i],day(1+i))).status,'awarded')}
 assert.equal(await title('t2',day(10)),'mastery');
 // A day on another course in the middle breaks the run.
 fresh('t3');for(let i=0;i<5;i++)await Save(ids[i],day(1+i));assert.equal((await Save('d1',day(6))).status,'awarded');for(let i=5;i<10;i++)await Save(ids[i],day(7+i-5));
 assert.equal(await title('t3',day(12)),'top');
 // A missed day breaks the run.
 fresh('t4');for(let i=0;i<10;i++)await Save(ids[i],day(1+i+(i>=5?1:0)));assert.equal(await title('t4',day(12)),'top');
 // Nine missions: nothing yet.
 fresh('t5');for(let i=0;i<9;i++)await Save(ids[i],day(1+i));assert.equal(await title('t5',day(9)),null);
});
test('other learners cannot see or change this learner’s balance',async()=>{
 fresh('j1');await clue('m1','hint');fresh('j2');assert.equal((await P.loadScores('j2')).balance,50);assert.equal(await PT.pointsBalance('j1'),45);
 const h=await PT.pointsHistory('j2');assert.ok(h.every(x=>x.kind==='starting'));
});
test('migration 0008 creates the ledger with the one-grant index and carries earlier scores over once',()=>{
 const dir=path.resolve(__dirname,'../drizzle');const sql=fs.readFileSync(path.join(dir,'0008_points_ledger.sql'),'utf8');
 const journal=JSON.parse(fs.readFileSync(path.join(dir,'meta/_journal.json'),'utf8'));assert.ok(journal.entries.some(e=>e.tag==='0008_points_ledger'));
 const fresh8=new DatabaseSync(':memory:');for(const f of fs.readdirSync(dir).filter(f=>/^000[0-7]/.test(f)&&f.endsWith('.sql')).sort())fresh8.exec(fs.readFileSync(path.join(dir,f),'utf8').replaceAll('--> statement-breakpoint',''));
 fresh8.prepare("INSERT INTO mission_scores (user_id,mission_id,day,understanding,practical,clues,deduction,points,created_at) VALUES ('old','m1','2026-10-01',25,75,1,5,95,'2026-10-01T05:00:00Z')").run();
 fresh8.exec(sql.replaceAll('--> statement-breakpoint',''));
 assert.deepEqual(fresh8.prepare("SELECT kind,ref,delta FROM point_ledger WHERE user_id='old'").all().map(x=>({...x})),[{kind:'mission',ref:'m1',delta:95}]);
 assert.throws(()=>fresh8.prepare("INSERT INTO point_ledger (user_id,kind,ref,delta,created_at) VALUES ('old','mission','m1',95,'x')").run(),/UNIQUE/);
 assert.match(fs.readFileSync(path.resolve(__dirname,'../docs/go-live-setup.md'),'utf8'),/0008_points_ledger\.sql/);
});
test('guests: no starting balance, device-only, and clearly not presented as saved or synced',()=>{
 const rewards=fs.readFileSync(path.resolve(__dirname,'../components/whatslearn/practice-rewards.tsx'),'utf8');assert.match(rewards,/local to this browser/);assert.match(rewards,/not securely saved or synced/);
 const g=fs.readFileSync(path.resolve(__dirname,'../lib/guest-points.ts'),'utf8');assert.ok(!/STARTING_POINTS|point_ledger/.test(g),'guests never receive the server starting balance');
});
