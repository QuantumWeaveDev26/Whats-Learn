// Course missions and mission points: four courses of ten missions with two questions each, one new mission a day, clue deductions,
// duplicate-point prevention, and relevance checks (copied, off-topic and relevant answers). No network, no AI, no real keys. Run: node --test tests/mission-points.cjs
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

test('four courses, ten missions each, exactly two questions per mission',()=>{
 assert.deepEqual(Object.keys(programmeNames).sort(),[...tracks].sort());
 assert.deepEqual(Object.values(programmeNames).map(n=>n.replace(/^AI[ -]/,'')).sort(),['Digital Marketing','Filmmaking','Full-Stack Development','powered Visual Storytelling'].sort().map(x=>x==='powered Visual Storytelling'?'powered Visual Storytelling':x));
 assert.equal(new Set(missions.map(m=>m.id)).size,missions.length,'ids are unique');
 assert.equal(missions.length,40);
 for(const t of tracks){
  const list=missions.filter(m=>m.track===t);assert.equal(list.length,10,t+' has 10 missions');
  for(const m of list){
   // Question 1: understanding (knowledge check). Question 2: the practical "try it" task. Nothing else is scored.
   assert.ok(m.question.trim().endsWith('?'),m.id+' understanding question');assert.ok(m.options.length>=3&&m.options.every(o=>o.trim()),m.id+' options');assert.ok(Number.isInteger(m.answer)&&m.answer>=0&&m.answer<m.options.length,m.id+' answer index');
   assert.match(m.task,/\S{3}/);assert.equal(m.checks.length,5,m.id+' checks');assert.ok(m.explanation.length>20);
   const mini=miniChallenge(m.id);assert.equal(mini.options.length,2,m.id+' clue puzzle');assert.ok(mini.why.length>10);
  }
 }
});
test('difficulty bands: missions 1-2 beginner, 3-7 intermediate, 8-10 advanced, in every course',()=>{
 for(const t of tracks){const list=missions.filter(m=>m.track===t);assert.deepEqual(list.map(m=>m.level),['beginner','beginner',...Array(5).fill('intermediate'),...Array(3).fill('advanced')],t);
  // Every task has 2 to 5 practical parts, and each course asks for at least four parts somewhere in its advanced missions.
  for(const m of list){assert.ok(m.practical&&m.practical.fields.length>=2&&m.practical.fields.length<=5,m.id)}
  assert.ok(list.slice(7).some(m=>m.practical.fields.length>=4),t+' advanced missions are substantial');
 }
});
test('current learning interface retains progression, points and practical-task controls',()=>{
 const src=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');
 const page=src('app/learn/workspace.tsx');
 for(const feature of ['PointsChip','Checkpoint','PracticeFields','UploadControl','lockFor','Task 1','Task 2'])assert.ok(page.includes(feature),feature);
 assert.match(page,/whatsappLearningUrl/);
 assert.doesNotMatch(src('app/layout.tsx'),/<Mascot[\s/>]/);
 for(const f of ['app/membership/page.tsx','app/companion/page.tsx','app/settings/page.tsx','app/signin/page.tsx'])assert.ok(fs.existsSync(path.resolve(__dirname,'..',f)),f);
});

test('every new mission is about its own course: no off-course wording in the lesson',()=>{
 const wrong={marketing:/\b(API|endpoint|storyboard|camera lens)\b/i,development:/\b(storyboard|logline|campaign slogan)\b/i,filmmaking:/\b(API|endpoint|conversion rate)\b/i,storytelling:/\b(API|endpoint|logline)\b/i};
 for(const m of missions)assert.doesNotMatch(m.lesson+m.task,wrong[m.track],m.id);
});

test('scoring: 25 + 75, clue deductions of 5 capped at 10, never below zero',()=>{
 const strong=checkWriting(byId('m4'),T('m4'));assert.equal(strong.blocked,false);
 const full=S.scoreMission({understandingCorrect:true,writing:{...strong,band:'strong'},clues:0});assert.deepEqual([full.understanding,full.practical,full.deduction,full.points],[25,75,0,100]);
 const w=b=>({...strong,band:b});
 assert.equal(S.scoreMission({understandingCorrect:true,writing:w('strong'),clues:1}).points,95);
 assert.equal(S.scoreMission({understandingCorrect:true,writing:w('strong'),clues:2}).points,90);
 assert.equal(S.scoreMission({understandingCorrect:true,writing:w('strong'),clues:3}).points,90,'cap of 10');
 assert.equal(S.scoreMission({understandingCorrect:true,writing:w('strong'),clues:99}).deduction,10);
 assert.equal(S.scoreMission({understandingCorrect:true,writing:w('good'),clues:0}).points,85);
 assert.equal(S.scoreMission({understandingCorrect:false,writing:w('weak'),clues:3}).points,20,'30 practical − 10');
 for(const band of ['strong','good','needs-work','weak','empty','filler','copied','off-topic'])for(const c of [0,1,2,3,10])for(const u of [true,false])assert.ok(S.scoreMission({understandingCorrect:u,writing:w(band),clues:c}).points>=0);
 assert.equal(S.scoreMission({understandingCorrect:false,writing:w('empty'),clues:5}).points,0,'never below zero');
 assert.equal(S.POINTS.understanding+S.POINTS.practical,100);
});

test('relevance: relevant answers pass in every mission; copied, empty, meaningless and off-topic answers do not',()=>{
 for(const m of missions){
  assert.equal(S.pointsGate(m,T(m.id)).ok,true,m.id+' relevant answer passes');
  for(const text of [m.example,m.lesson,m.lesson+' '+m.example,m.brief+' '+m.task]){const g=S.pointsGate(m,text);assert.equal(g.ok,false,m.id+' copied text refused');assert.ok(g.message.length>25,'guidance is given')}
  for(const text of ['','   ','abcd','abcd efgh ijkl mnop qrst uvwx yzab cdef','lorem ipsum '.repeat(10),'I do not know. I do not know. I do not know.','Yesterday the cricket match was great and the biryani at the canteen was too spicy, so we went home early and watched a movie about space.']){assert.equal(S.pointsGate(m,text).ok,false,m.id+' refused: '+text.slice(0,25))}
 }
 const log=fs.readFileSync(path.resolve(__dirname,'fixtures/wrangler-log.txt'),'utf8');for(const m of missions){assert.equal(S.pointsGate(m,log).ok,false,m.id+' terminal log');assert.equal(S.pointsGate(m,log.slice(0,3000)).ok,false)}
 // An answer written for a different course is refused (a few neighbouring pairs, such as two pitch missions, can overlap).
 let cross=0,accepted=0;for(const m of missions)for(const o of missions){if(o.track===m.track)continue;cross++;if(S.pointsGate(m,T(o.id)).ok)accepted++}
 assert.ok(accepted/cross<0.01,`cross-course answers accepted: ${accepted}/${cross}`);
 // Copying the example with a few words changed is still caught; a pasted answer in the learner's own words is not blocked by paste rules.
 const m=byId('m4');const lightly=m.example.replace('Leading','Biased').replace('Fair and open','Better');assert.equal(S.pointsGate(m,lightly).ok,false);
 // Where the task asks "why", a list with no reasoning is asked for a reason.
 const v4=byId('v4');const listOnly='Focal point: the microphone. Contrast: yellow on navy. Eye path: microphone, headline OPEN MIC, date and library name. Left out: photos of past performers.';
 assert.equal(S.pointsGate(v4,listOnly).reason,'no-reasoning');assert.equal(S.pointsGate(v4,T('v4')).ok,true);
});

test('server: one new mission a day, refresh-safe, duplicate-safe',async()=>{
 reset();
 // First new mission today earns points.
 let res=await send('m4');assert.equal(res.status,200);let d=await res.json();assert.equal(d.award.status,'awarded');assert.ok(d.award.score.points>=45&&d.award.score.points<=100);assert.match(d.award.message,/not an AI review/);
 const first=d.award.score.points;assert.equal(count('mission_scores'),1);assert.equal(count('work'),1);
 // A second NEW mission the same day, in any course, is refused and saves nothing, so it can still be done tomorrow.
 for(const id of ['d3','f4','v3','m5']){res=await send(id);assert.equal(res.status,429,id);d=await res.json();assert.match(d.error,/already completed today/)}
 assert.equal(count('mission_scores'),1);assert.equal(count('work'),1);
 // Refresh or repeat of the SAME request: no new points, still one score.
 for(let i=0;i<5;i++){res=await send('m4');assert.equal(res.status,200);d=await res.json();assert.equal(d.award.status,'duplicate');assert.equal(d.award.score,undefined)}
 assert.equal(count('mission_scores'),1);
 // Revisiting an earlier mission with a revised answer is practice only.
 res=await send('m4',amend('m4','I would also ask each person to tell me about a time they changed their mind.'),{reflection:'Added a new question about changing their mind.'});assert.equal((await res.json()).award.status,'duplicate');
 assert.equal(db.prepare('SELECT SUM(points) p FROM mission_scores').get().p,first);
 // GET returns the day's state for the page.
 const got=await (await work.GET()).json();assert.equal(got.points.todayUsed,true);assert.equal(got.points.totalPoints,first);
 // Tomorrow (India time) a new mission opens.
 const tomorrow=new Date(Date.now()+26*3600*1000);let r2=await Save({missionId:'d3',body:samples.d3,checks:[true,true,true,true,true],quiz:byId('d3').answer},tomorrow);assert.equal(r2.status,'awarded');
 assert.equal(count('mission_scores'),2);
 // And again the same day is refused.
 r2=await Save({missionId:'f4',body:samples.f4,checks:[true,true,true,true,true],quiz:byId('f4').answer},tomorrow);assert.equal(r2.status,'daily-limit');assert.equal(r2.saved,false);
});

test('India-time day: the limit uses the Asia/Kolkata calendar day for every learner, signed in or guest',async()=>{
 reset();
 const input=(id,extra={})=>({missionId:id,body:samples[id],checks:[true,true,true,true,true],quiz:byId(id).answer,...extra});
 // India is UTC+5:30. 23:59 IST on 12 Oct is 18:29 UTC; midnight IST (13 Oct) is 18:30 UTC.
 const beforeMidnight=new Date('2026-10-12T18:29:00Z'),atMidnight=new Date('2026-10-12T18:30:00Z'),lateMorning=new Date('2026-10-13T05:00:00Z'),nextEvening=new Date('2026-10-13T18:29:59Z');
 assert.equal(require('../lib/play.ts').practiceDay(beforeMidnight.toISOString()),'2026-10-12');
 assert.equal((await Save(input('m4'),beforeMidnight)).status,'awarded');
 assert.equal(db.prepare('SELECT day FROM mission_scores').get().day,'2026-10-12');
 // One second later it is 00:00 IST on 13 Oct: a new mission opens, even though it is still 12 Oct in New York and London.
 assert.equal((await Save(input('d3'),new Date(beforeMidnight.getTime()+1000)).catch(e=>e)).status,'daily-limit','18:29:01 UTC is still 23:59 IST');
 assert.equal((await Save(input('d3'),atMidnight)).status,'awarded','18:30 UTC is 00:00 IST on the next date');
 assert.equal(db.prepare("SELECT day FROM mission_scores WHERE mission_id='d3'").get().day,'2026-10-13');
 // The rest of that Indian day is closed to new missions; the next Indian day opens at 18:30 UTC again.
 assert.equal((await Save(input('f4'),lateMorning)).status,'daily-limit');
 assert.equal((await Save(input('f4'),nextEvening)).status,'daily-limit');
 assert.equal((await Save(input('f4'),new Date('2026-10-13T18:30:00Z'))).status,'awarded');
 // A learner in another time zone gets the same India day: a time zone sent by the browser is ignored.
 reset();
 const newYork=new Date('2026-10-12T20:00:00Z'); // 16:00 in New York on 12 Oct, already 01:30 on 13 Oct in India
 assert.equal((await Save(input('m4',{timeZone:'America/New_York'}),newYork)).status,'awarded');
 assert.equal(db.prepare('SELECT day FROM mission_scores').get().day,'2026-10-13','the stored day is the India day, not the New York day');
 assert.equal((await Save(input('d3',{timeZone:'America/New_York'}),new Date('2026-10-13T03:00:00Z'))).status,'daily-limit','08:30 IST same India day, though it is 23:00 on 12 Oct in New York');
 assert.equal((await Save(input('d3',{timeZone:'Pacific/Kiritimati'}),new Date('2026-10-13T03:00:00Z'))).status,'daily-limit','a +14 zone cannot open a second day either');
 assert.equal((await Save(input('d3',{timeZone:'America/New_York'}),new Date('2026-10-13T18:30:00Z'))).status,'awarded','next India midnight opens it');
 // The day reported to the page is the India day, whatever tz the request carries.
 reset();const got=await (await work.GET(new Request('https://whatslearn.in/api/work?tz=Pacific/Kiritimati'))).json();assert.equal(got.points.today,require('../lib/play.ts').practiceDay(new Date().toISOString()));
 // Guests use the same India day.
 const mem={};global.localStorage={getItem:k=>k in mem?mem[k]:null,setItem:(k,v)=>{mem[k]=String(v)},removeItem:k=>{delete mem[k]}};
 const G=require('../lib/guest-points.ts'),GW=require('../lib/guest-work.ts');
 const gcp=id=>{const m=byId(id);const l=missions.filter(x=>x.track===m.track);const p=l.findIndex(x=>x.id===id)+1;const keys=[];for(let a=2;a<p;a+=2)keys.push(m.track+':'+a);const old=JSON.parse(localStorage.getItem('whatslearn-guest-checkpoints-v1')||'[]');localStorage.setItem('whatslearn-guest-checkpoints-v1',JSON.stringify([...new Set([...old,...keys])]))};
 const gi=id=>{gcp(id);for(const q of prevOf(id))if(!GW.readGuestWork().some(w=>w.mission_id===q))GW.saveGuestWork({mission_id:q,body:'seed '.repeat(12),checks:'[false,false,false,false,false]',quiz:byId(q).answer,updated_at:new Date().toISOString()});return {missionId:id,body:samples[id],checks:[true,true,true,true,true],quiz:byId(id).answer}};
 assert.equal(G.guestAward(gi('m1'),beforeMidnight).status,'awarded');assert.equal(G.readGuestPoints(beforeMidnight).scores[0].day,'2026-10-12');
 assert.equal(G.guestAward(gi('d3'),new Date(beforeMidnight.getTime()+1000)).status,'daily-limit');
 assert.equal(G.readGuestPoints(new Date(beforeMidnight.getTime()+1000)).todayUsed,true);assert.equal(G.readGuestPoints(atMidnight).todayUsed,false,'a new India day has started');
 assert.equal(G.guestAward(gi('d3'),atMidnight).status,'awarded');
 assert.match(G.guestAward(gi('f1'),atMidnight).message,/midnight India time/);assert.match(G.guestAward(gi('f1'),atMidnight).message,/clear your browser data/);
 delete global.localStorage;
 // Points are worked out on the server; any score, points or day the browser adds to the request is ignored.
 reset();const honest=(await (await send('m4')).json()).award.score.points;reset();
 const forged=await (await send('m4',samples.m4,{score:1000,points:1000,day:'2020-01-01',practical:75,deduction:-500})).json();assert.equal(forged.award.score.points,honest);assert.equal(db.prepare('SELECT day FROM mission_scores').get().day,require('../lib/play.ts').practiceDay(new Date().toISOString()));
});
test('progress is never erased when a day is missed, and clues or revisions still count as a practice day',async()=>{
 reset();
 const old=new Date(Date.now()-5*86400000);
 assert.equal((await Save({missionId:'m4',body:samples.m4,checks:[true,true,true,true,true],quiz:byId('m4').answer},old)).status,'awarded');
 // Five days with no activity, then a new mission today: the old points are still there and today's mission awards normally.
 assert.equal((await send('d3')).status,200);
 const rows=db.prepare('SELECT mission_id,points FROM mission_scores ORDER BY day').all();assert.deepEqual(rows.map(r=>r.mission_id),['m4','d3']);assert.ok(rows.every(r=>r.points>0));
 assert.equal(count('work'),2);
 // A mission finished with a clue used and then revised still adds a practice day.
 reset();await post(clues,{missionId:'m5',clue:'hint'});await post(clues,{missionId:'m5',clue:'example'});
 assert.equal((await (await send('m5')).json()).award.status,'awarded');
 await send('m5',amend('m5','I would also change one thing at a time to compare results.'),{reflection:'Added a note about changing one thing at a time.'});
 const ev=db.prepare('SELECT event_id,mission_id,kind,created_at FROM practice_events').all();assert.ok(ev.some(e=>e.kind==='practice'),'a practice day is recorded');
 assert.ok(practiceRewards([],ev,'marketing').days>=1);assert.equal(db.prepare('SELECT deduction d FROM mission_scores').get().d,10,'clues were used, mission still counted');
});
test('answers in Hindi and Kannada are judged against the mission, not rejected for being in English-only vocabulary',()=>{
 const n=samples.native;
 assert.equal(S.pointsGate(byId('m4'),answerText(byId('m4'),n.hi_m4)).ok,true,'relevant Hindi answer');assert.equal(S.pointsGate(byId('d3'),answerText(byId('d3'),n.kn_d3)).ok,true,'relevant Kannada answer');
 assert.equal(S.pointsGate(byId('m4'),n.hi_off).ok,false,'off-topic Hindi');assert.equal(S.pointsGate(byId('d3'),n.kn_off).ok,false,'off-topic Kannada');
 assert.equal(S.pointsGate(byId('m4'),n.hi_gibberish).ok,false,'filler in Devanagari');
 assert.equal(S.pointsGate(byId('d3'),answerText(byId('m4'),n.hi_m4)).ok,false,'a Hindi answer for another course');assert.equal(S.pointsGate(byId('m4'),answerText(byId('d3'),n.kn_d3)).ok,false,'a Kannada answer for another course');
});
test('wrong-course regressions: the three v31 near misses and their neighbours are refused; each mission still accepts its own answer',()=>{
 // v31 let these through: an interview-question mission given dialogue lines, and two filmmaking missions given a storytelling pitch.
 for(const [mission,answer] of [['m4','f4'],['f8','v9'],['f9','v9'],['f4','m4'],['v9','f8'],['v9','f9'],['f10','v9'],['v9','f10'],['m10','v10'],['v10','m10'],['d4','m7'],['m5','d8'],['v6','m7'],['v7','m8']]){
  const g=S.pointsGate(byId(mission),T(answer));assert.equal(g.ok,false,`${answer} answer must not earn points in ${mission}`);assert.ok(g.message.length>25);
  assert.equal(S.pointsGate(byId(answer),T(answer)).ok,true,answer+' still accepts its own answer');
 }
 // Shortened but still on-topic answers for the correct course are not turned away because of this rule.
 let kept=0,total=0;for(const m of missions){const sents=T(m.id).split(/(?<=[.!?])\s+/);const cut=sents.slice(0,Math.max(2,Math.round(sents.length*0.75))).join(' ');if(S.pointsGate(m,T(m.id)).ok){total++;const g=S.pointsGate(m,cut);if(g.ok||g.reason!=='wrong-course')kept++}}
 assert.equal(kept,total,'no shortened own-course answer is refused as the wrong course');
 // Missions in the same course share terms on purpose and are not treated as the wrong course.
 assert.notEqual(S.pointsGate(byId('m5'),T('m4')).reason,'wrong-course');assert.notEqual(S.pointsGate(byId('d4'),T('d3')).reason,'wrong-course');
});
test('translation fallback is honest: the 30 new missions are listed as waiting for Kannada and Hindi',()=>{
 const {isMissionTranslated}=require('../lib/personalization.ts');const fresh=Object.keys(samples).filter(id=>/^(m([4-9]|10)|d([3-9]|10)|f([4-9]|10)|v([3-9]|10))$/.test(id));
 assert.equal(fresh.length,30);
 for(const lang of ['kn','hi']){for(const id of fresh)assert.equal(isMissionTranslated(id,lang),false,id+' '+lang+' is not translated');for(const id of ['m1','m2','m3','d1','d2'])assert.equal(isMissionTranslated(id,lang),true,id+' '+lang)}
 for(const id of fresh)assert.equal(isMissionTranslated(id,'en'),true);
 const src=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');
 assert.match(src('components/whatslearn/language-notice.tsx'),/waiting for its .*translation/);assert.match(src('components/whatslearn/language-notice.tsx'),/We do not pass off machine translations as finished lessons/);
 assert.match(src('docs/changes-v33-2026-10-12.md'),/m4, m5, m6/,'the handoff lists the missions awaiting translation');
});
test('streak indicator: consecutive practice days, kept honest and never erasing progress',()=>{
 const {streakDays}=require('../lib/play.ts');
 assert.deepEqual(streakDays(['2026-10-10','2026-10-11','2026-10-12'],'2026-10-12'),{current:3,best:3});
 assert.deepEqual(streakDays(['2026-10-10','2026-10-11'],'2026-10-12'),{current:2,best:2},'still alive until the day is over');
 assert.deepEqual(streakDays(['2026-10-06','2026-10-07','2026-10-08','2026-10-12'],'2026-10-12'),{current:1,best:3},'a gap resets the current run but the best run is kept');
 assert.deepEqual(streakDays(['2026-10-06','2026-10-07'],'2026-10-12'),{current:0,best:2});assert.deepEqual(streakDays([],'2026-10-12'),{current:0,best:0});
 const r=practiceRewards([],[],'marketing');assert.equal(r.streak,0);assert.equal(r.days,0);
 // Text only: the indicator sits on the existing XP line of the rewards card. Since v38 it shows the mission streak (one new scored mission a day), not practice days.
 assert.match(fs.readFileSync(path.resolve(__dirname,'../components/whatslearn/practice-rewards.tsx'),'utf8'),/creations\{ms\.current>=2/);
});
test('migration 0007 is included, ordered and creates the mission tables and the one-per-day index',()=>{
 const dir=path.resolve(__dirname,'../drizzle');assert.ok(fs.existsSync(path.join(dir,'0007_mission_points.sql')));
 const journal=JSON.parse(fs.readFileSync(path.join(dir,'meta/_journal.json'),'utf8'));assert.ok(journal.entries.some(e=>e.tag==='0007_mission_points'));
 const names=db.prepare("SELECT name FROM sqlite_master WHERE type IN ('table','index')").all().map(r=>r.name);
 for(const n of ['mission_scores','mission_clues','mission_scores_one_per_day'])assert.ok(names.includes(n),n);
 assert.match(fs.readFileSync(path.resolve(__dirname,'../docs/go-live-setup.md'),'utf8'),/0007_mission_points\.sql/);
});
test('server: simultaneous requests cannot award twice',async()=>{
 reset();
 const same=await Promise.all([1,2,3,4,5,6].map(()=>send('m6')));
 const same2=await Promise.all(same.map(r=>r.json()));assert.equal(same2.filter(x=>x.award.status==='awarded').length,1,'exactly one award for six identical requests');
 assert.equal(count('mission_scores'),1);
 reset();
 const mixed=await Promise.all(['m4','d3','f4','v3'].map(id=>send(id)));
 const codes=mixed.map(r=>r.status).sort();assert.equal(codes.filter(c=>c===200).length,1,'exactly one new mission per day across courses');assert.equal(codes.filter(c=>c===429).length,3);
 assert.equal(count('mission_scores'),1);assert.equal(count('work'),1,'refused missions are not saved');
});

test('server: clues cost 5 points each, capped at 10, and never touch practice days',async()=>{
 reset();
 const ev0=count('practice_events');
 const clue=(missionId,c)=>post(clues,{missionId,clue:c});
 assert.equal((await (await clue('m4','puzzle')).json()).recorded,true);
 assert.equal((await (await clue('m4','puzzle')).json()).recorded,false,'the same clue is counted once');
 assert.equal((await clue('m4','example')).status,200);assert.equal((await clue('m4','hint')).status,200);
 assert.equal((await clue('m4','nope')).status,400);assert.equal((await clue('zzz','hint')).status,400);
 assert.equal(count('practice_events'),ev0,'using clues writes no practice-day events');
 const d=await (await send("m4")).json();assert.equal(d.award.status,'awarded');assert.equal(d.award.score.clues,3);assert.equal(d.award.score.deduction,10);
 assert.equal(d.award.score.points,d.award.score.understanding+d.award.score.practical-10);assert.match(d.award.message,/clues 10/);
 // After a mission is scored, more clues change nothing.
 assert.equal((await (await clue('m4','hint')).json()).recorded,false);
 // One clue costs 5.
 reset();await clue('m4','hint');const e=await (await send('m4')).json();assert.equal(e.award.score.deduction,5);
 // No clue costs nothing.
 reset();const f=await (await send('m4')).json();assert.equal(f.award.score.deduction,0);assert.equal(f.award.score.points,f.award.score.understanding+f.award.score.practical);
 // Clues do not change the practice days the rewards count.
 reset();const events=()=>db.prepare('SELECT event_id,mission_id,kind,created_at FROM practice_events').all();
 await send('m4');const before=practiceRewards([],events(),'marketing').days;await clue('d3','hint');assert.equal(practiceRewards([],events(),'marketing').days,before);
});

test('server: refused answers are not saved and get guidance; wrong knowledge answers are not saved',async()=>{
 reset();
 const bad=['abcd abcd abcd abcd abcd abcd abcd abcd abcd','Yesterday the cricket match was great and the biryani at the canteen was too spicy, so we went home early.',byId('m4').example+' '+byId('m4').lesson].map(t=>asAnswer('m4',t));
 for(const body of bad){const res=await send('m4',body);assert.equal(res.status,400);const d=await res.json();assert.ok(d.error.length>30,'guidance given')}
 // Passes the quick check but belongs to another course: refused with guidance and a chance to retry, nothing saved.
 let res=await send('m4',asAnswer('m4',T('d8')));assert.equal(res.status,400);assert.match((await res.json()).error,/different course|mission/);
 assert.equal(count('work'),0);assert.equal(count('mission_scores'),0);
 res=await post(work,{missionId:'m4',body:samples.m4,checks:[true,true,true,true,true],quiz:(byId('m4').answer+1)%3});assert.equal(res.status,400);assert.equal(count('work'),0);
 // After those refusals the same learner can still earn today's points.
 res=await send('m4');assert.equal((await res.json()).award.status,'awarded');
});

test('server: earlier work saved before points existed stays practice-only',async()=>{
 reset();db.prepare("INSERT INTO work (user_id,mission_id,body,checks,quiz,updated_at) VALUES (?,?,?,?,?,?)").run(user.userId,'m5','old answer '.repeat(5),'[true,true,true,true,true]',String(byId('m5').answer),new Date().toISOString());
 const d=await (await send('m5')).json();assert.equal(d.award.status,'practice');assert.equal(count('mission_scores'),0);
 // That did not use up today's new mission.
 assert.equal((await (await send('d3')).json()).award.status,'awarded');
});

test('server: points belong to the signed-in learner only',async()=>{
 reset();await send('m4');const other={userId:'other',email:'o@example.test',displayName:'O'};const keep=user;user=other;
 try{assert.equal((await (await send('m4')).json()).award.status,'awarded','another learner has their own day');const got=await (await work.GET()).json();assert.equal(got.points.scores.length,1);assert.equal(got.points.scores[0].mission_id,'m4')}finally{user=keep}
 assert.equal(count('mission_scores'),2);
});

test('guest: the same rules apply on this device only',()=>{
 const mem={};global.localStorage={getItem:k=>k in mem?mem[k]:null,setItem:(k,v)=>{mem[k]=String(v)},removeItem:k=>{delete mem[k]}};
 const G=require('../lib/guest-points.ts'),GW=require('../lib/guest-work.ts');
 const gcp=id=>{const m=byId(id);const l=missions.filter(x=>x.track===m.track);const p=l.findIndex(x=>x.id===id)+1;const keys=[];for(let a=2;a<p;a+=2)keys.push(m.track+':'+a);const old=JSON.parse(localStorage.getItem('whatslearn-guest-checkpoints-v1')||'[]');localStorage.setItem('whatslearn-guest-checkpoints-v1',JSON.stringify([...new Set([...old,...keys])]))};
 const input=id=>{gcp(id);for(const q of prevOf(id))if(!GW.readGuestWork().some(w=>w.mission_id===q))GW.saveGuestWork({mission_id:q,body:'seed '.repeat(12),checks:'[false,false,false,false,false]',quiz:byId(q).answer,updated_at:new Date().toISOString()});return {missionId:id,body:samples[id],checks:[true,true,true,true,true],quiz:byId(id).answer}};
 const saveWork=id=>GW.saveGuestWork({mission_id:id,body:samples[id],checks:JSON.stringify([true,true,true,true,true]),quiz:byId(id).answer,updated_at:new Date().toISOString()});
 G.recordGuestClue('m1','puzzle');G.recordGuestClue('m1','puzzle');G.recordGuestClue('m1','hint');
 let r=G.guestAward(input('m1'));assert.equal(r.status,'awarded');assert.equal(r.score.clues,2);assert.equal(r.score.deduction,10);assert.match(r.message,/this device|on this device/i);saveWork('m1');
 r=G.guestAward(input('d3'));assert.equal(r.status,'daily-limit');assert.equal(r.saved,false);assert.match(r.message,/saved on this device only/);
 r=G.guestAward(input('m1'));assert.equal(r.status,'duplicate');assert.equal(G.readGuestPoints().scores.length,1);
 assert.equal(G.guestAward({...input('m1'),missionId:'zzz'}).status,'rejected');
 // Tomorrow another one opens.
 r=G.guestAward(input('d3'),new Date(Date.now()+26*3600*1000));assert.equal(r.status,'awarded');assert.equal(G.readGuestPoints().scores.length,2);
 // Irrelevant answers are refused for guests too.
 mem['whatslearn-guest-points-v1']='{}';assert.equal(G.guestAward({...input('m5'),body:'abcd abcd abcd abcd abcd abcd abcd abcd abcd'}).status,'rejected');
 // Damaged storage does not crash or award.
 mem['whatslearn-guest-points-v1']='not json';assert.equal(G.readGuestPoints().scores.length,0);
 delete global.localStorage;
});

test('labels: the quick check is never called an AI review; the page text explains points and the guest limit',()=>{
 const src=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');
 assert.match(S.pointsGate(byId('m4'),samples.m4).message,/not an AI review/);
 assert.doesNotMatch(src('lib/mission-points.ts')+src('lib/mission-score.ts')+src('lib/guest-points.ts'),/AI review['’`]?\s*(passed|complete)/i);
 assert.match(src('lib/mission-score.ts'),/Guest progress is saved on this device only/);
 assert.match(src('components/whatslearn/practice-rewards.tsx'),/up to 25 points for the understanding question and 75 for the practical task/);
});
