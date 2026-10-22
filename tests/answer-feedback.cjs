require('./helpers/approved-review.cjs');
// Direct answer feedback on every multiple-choice question (home starter, agency starter, side quests, 40 missions), retry after a wrong answer, and no change to points or progress. Run: node --test tests/answer-feedback.cjs
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),{DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync(':memory:');for(const f of fs.readdirSync(path.resolve(__dirname,'../drizzle')).filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync(path.resolve(__dirname,'../drizzle',f),'utf8').replaceAll('--> statement-breakpoint',''));
// Like Cloudflare D1, a batch is all-or-nothing.
const d1={prepare(sql){const stmt=db.prepare(sql);const api=(...args)=>({async first(){return stmt.get(...args)||null},async all(){return {results:stmt.all(...args)}},async run(){const r=stmt.run(...args);return {meta:{changes:r.changes}}},_run:()=>stmt.run(...args)});return {bind:api,...api()}},async batch(list){db.exec('BEGIN');try{const out=list.map(s=>({meta:{changes:s._run().changes}}));db.exec('COMMIT');return out}catch(e){db.exec('ROLLBACK');throw e}}};
let user={userId:'learner',email:'l@example.test',displayName:'L'};const env={DB:d1};
const original=Module._load;Module._load=function(name,parent,isMain){if(name==='@/app/chatgpt-auth')return {getChatGPTUser:async()=>user};if(name==='cloudflare:workers')return {env};if(name.startsWith('@/'))name=path.resolve(__dirname,'..',name.slice(2));return original.call(this,name,parent,isMain)};
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,f);
const {missions}=require('../lib/missions.ts'),{programmeNames}=require('../lib/programmes.ts'),{miniChallenge,practiceRewards}=require('../lib/play.ts');
const S=require('../lib/mission-score.ts'),{checkWriting}=require('../lib/writing-check.ts'),P=require('../lib/mission-points.ts');
const work=require("../app/api/work/route.ts"),clues=require("../app/api/clues/route.ts"),PT=require("../lib/points.ts"),CT=require("../lib/course-titles.ts"),QF=require("../lib/quiz-feedback.ts"),{languages}=require("../lib/languages.ts"),SUB=require("../lib/submission.ts"),AG=require("../lib/agency-story.ts");
const samples=require('./fixtures/course-samples.json');
const byId=id=>missions.find(m=>m.id===id);
const ROOT=path.resolve(__dirname,'..');
const walk=(d,out=[])=>{for(const e of fs.readdirSync(path.join(ROOT,d),{withFileTypes:true})){const p=d+'/'+e.name;if(e.isDirectory())walk(p,out);else out.push(p)}return out};
const WRONG_VAGUE=/other angle|another angle|useful instinct|thinking like a maker|not quite|try the other|see the other option|look at the other/i;
const codes=Object.keys(languages);
const ENGLISH_ONLY=['brx','mni','ks','sat'];
const primeCheckpoints=id=>{const m=byId(id);const l=missions.filter(x=>x.track===m.track);const p=l.findIndex(x=>x.id===id)+1;for(let a=2;a<p;a+=2)db.prepare('INSERT OR IGNORE INTO checkpoint_clears (user_id,track,after_mission,created_at) VALUES (?,?,?,?)').run(user.userId,m.track,a,new Date().toISOString())};
const prime=id=>{primeCheckpoints(id);const m=byId(id);const l=missions.filter(x=>x.track===m.track);for(const q of l.slice(0,l.findIndex(x=>x.id===id)))db.prepare("INSERT OR IGNORE INTO work (user_id,mission_id,body,checks,quiz,updated_at) VALUES (?,?,?,?,?,?)").run(user.userId,q.id,'seed','[]',q.answer,new Date().toISOString())};
const post=(route,body)=>route.POST(new Request('https://whatslearn.in/api/x',{method:'POST',headers:{origin:'https://whatslearn.in','Content-Type':'application/json'},body:JSON.stringify(body)}));
const sendAnswer=(id,quiz)=>post(work,{missionId:id,body:samples[id],checks:[true,true,true,true,true],quiz});
const ledger=u=>db.prepare('SELECT COUNT(*) n,COALESCE(SUM(delta),0) s FROM point_ledger WHERE user_id=?').get(u);
const snap=u=>JSON.stringify([ledger(u),db.prepare("SELECT COUNT(*) n FROM mission_scores WHERE user_id=?").get(u).n,db.prepare("SELECT COUNT(*) n FROM work WHERE user_id=? AND body<>'seed'").get(u).n,db.prepare("SELECT COUNT(*) n FROM mission_clues WHERE user_id=?").get(u).n]);

test('no vague wrong-answer wording is left anywhere a multiple-choice answer is judged',()=>{
 const hits=[];for(const f of [...walk('app'),...walk('components'),...walk('lib')].filter(f=>/\.(tsx?|json)$/.test(f))){
  const t=fs.readFileSync(path.join(ROOT,f),'utf8');const m=t.match(WRONG_VAGUE);if(m)hits.push(f+': '+m[0])}
 assert.deepEqual(hits,[]);
});
test('homepage keeps one starter with explicit correct and retry feedback for all courses',()=>{
 const page=fs.readFileSync(path.join(ROOT,'app/page.tsx'),'utf8');assert.match(page,/<VisualStart\/>/);assert.doesNotMatch(page,/30-SECOND WARM-UP/);
 const hero=fs.readFileSync(path.join(ROOT,'components/whatslearn/visual-start.tsx'),'utf8');assert.match(hero,/choice===0\?t.correct:t.retry/);assert.match(hero,/choice===0\?t.feedback/);
});
test('agency starter (14 languages): wrong says not correct and invites a retry; right says correct and why',()=>{
 assert.equal(AG.agencyStoryLanguages.length,14);
 for(const l of ['en',...AG.agencyStoryLanguages]){const {copy:c}=AG.agencyStory(l);const lines=QF.feedbackLines(l);
  assert.equal(c.retry,lines.wrong,l+' wrong line');assert.equal(c.correct,lines.right,l+' right line');
  assert.ok(c.clue.length>10&&c.feedback.length>20,l+' gives the reason');assert.ok(lines.again.length>10,l+' invites a retry');
  assert.notEqual(c.retry,c.correct);
 }
 const t=fs.readFileSync(path.join(ROOT,'components/whatslearn/visual-start.tsx'),'utf8');assert.match(t,/feedbackLines\(contentLanguage\)\.again/);assert.match(t,/choice===0\?t\.correct:t\.retry/);
});
test('side quests: locked attempts give direct feedback without inviting an answer switch',()=>{
 const ids=missions.map(m=>m.id);let n=0;
 for(const id of ids){for(const l of ['en','kn','hi','ta','bn','ur']){let mini;try{mini=miniChallenge(id,l)}catch{continue}
  for(let i=0;i<mini.options.length;i++){const f=QF.quizFeedback(l,i===mini.answer,'',mini.why,false);n++;
   if(i===mini.answer){assert.ok(f.text.startsWith(QF.feedbackLines(l).right),id+l);assert.ok(f.text.includes(mini.why))}
   else{assert.ok(f.text.startsWith(QF.feedbackLines(l).wrong),id+l);assert.ok(f.text.includes(mini.why));assert.ok(!f.text.includes(QF.feedbackLines(l).again),id+l+' has no retry invitation')}
   assert.ok(!WRONG_VAGUE.test(f.text))}}}
 assert.ok(n>=40,'checked '+n+' answers');
 const t=fs.readFileSync(path.join(ROOT,'components/whatslearn/mini-challenge.tsx'),'utf8');assert.match(t,/quizFeedback\(language,choice===m\.answer/);assert.match(t,/disabled=\{choice>=0\|\|earned\}/);assert.match(t,/if\(answerLocked.current\|\|earned\)return/);assert.match(t,/Answer locked for this attempt/);assert.match(t,/m.why,false/);
});
test('all 40 mission questions: every wrong option and the right option give direct feedback in all 23 interface languages',()=>{
 assert.equal(missions.length,40);
 for(const m of missions){assert.ok(m.options.length>=2&&m.answer>=0&&m.answer<m.options.length,m.id);assert.ok(m.explanation.length>30,m.id+' has a reason');assert.ok(m.skill.length>2);
  for(const code of codes){const L=QF.feedbackLines(code);
   for(let i=0;i<m.options.length;i++){const f=QF.quizFeedback(code,i===m.answer,m.skill,m.explanation);
    if(i===m.answer){assert.equal(f.title,L.right);assert.ok(f.text.startsWith(L.right+' ')&&f.text.includes(m.explanation))}
    else{assert.equal(f.title,L.wrong);assert.ok(f.text.startsWith(L.wrong)&&f.text.includes(m.skill)&&f.text.includes(m.explanation)&&f.text.endsWith(L.again),m.id+code)}
    assert.ok(!WRONG_VAGUE.test(f.text))}}}
 for(const c of ENGLISH_ONLY)assert.equal(QF.feedbackLines(c).wrong,'That answer is not correct.',c+' shows English until reviewed');
 const drafted=codes.filter(c=>!ENGLISH_ONLY.includes(c));assert.equal(drafted.length,codes.length-4);for(const c of drafted.filter(c=>c!=='en'))assert.notEqual(QF.feedbackLines(c).wrong,'That answer is not correct.',c+' has its own line');
 const page=fs.readFileSync(path.join(ROOT,'app/learn/workspace.tsx'),'utf8');assert.match(page,/<StyleInteraction[^>]*language=\{profile.language\}/);
});
test('a wrong answer changes nothing: not saved, no points, no clue, next mission still locked; the retry then works',async()=>{
 user={userId:'z1',email:'z1@example.test',displayName:'Z'};delete env.STARTING_POINTS;
 for(const id of ['marketing','development','filmmaking','storytelling'].map(t=>missions.find(x=>x.track===t).id)){
  const u='z-'+id;user={userId:u,email:u+'@example.test',displayName:u};const m=byId(id);const nextId=missions.filter(x=>x.track===m.track)[1].id;
  await PT.ensureAccount(u);const before=snap(u);const bal=ledger(u).s;
  for(let i=0;i<m.options.length;i++){if(i===m.answer)continue;
   for(let rep=0;rep<3;rep++){const res=await sendAnswer(id,i);const d=await res.json();assert.notEqual(res.status,500);
    assert.match(JSON.stringify(d),/That answer is not correct\./,id);assert.match(JSON.stringify(d),/answer again|Choose another|try again/i);assert.notEqual(d.award?.status,'awarded');
    assert.equal(snap(u),before,id+': a wrong attempt changes no points, work, scores or clues')}}
  // The next mission is still locked after any number of wrong attempts.
  const lock=await post(work,{missionId:nextId,body:samples[nextId],checks:[true,true,true,true,true],quiz:byId(nextId).answer});assert.notEqual((await lock.json()).award?.status,'awarded');assert.equal(snap(u),before,'locked next mission stays locked');
  // Retry with the right answer: saved and scored once.
  const ok=await (await sendAnswer(id,m.answer)).json();assert.equal(ok.award.status,'awarded');assert.equal(ledger(u).s,bal+ok.award.score.points);
  // And only now does the next mission open (it is refused today only by the one-new-mission-a-day rule, not by a lock).
  const next=await (await post(work,{missionId:nextId,body:samples[nextId],checks:[true,true,true,true,true],quiz:byId(nextId).answer})).json();assert.ok(!/finish|locked|before/i.test(next.award?.message||'')||next.award?.status==='daily-limit',nextId+': '+JSON.stringify(next).slice(0,200));
 }
});
test('clues still cost points only when revealed, with the cost shown first; wrong answers never reveal or charge one',async()=>{
 user={userId:'cz',email:'cz@example.test',displayName:'cz'};const m=byId('m1');
 await PT.ensureAccount('cz');const bal=ledger('cz').s;await sendAnswer('m1',(m.answer+1)%m.options.length);assert.equal(ledger('cz').s,bal,'a wrong answer does not reveal a clue');
 const page=fs.readFileSync(path.join(ROOT,'app/learn/workspace.tsx'),'utf8');assert.match(page,/clueCost=/,'the cost is printed on the clue button');
 const r=await (await post(clues,{missionId:'m1',clue:'hint'})).json();assert.equal(r.charged,5);assert.equal(ledger('cz').s,bal-5);
 const again=await (await post(clues,{missionId:'m1',clue:'hint'})).json();assert.equal(again.charged,0);assert.equal(ledger('cz').s,bal-5,'the same clue is never charged twice');
});
test('side quest API: a wrong choice is refused with a plain message and records nothing; the right choice still works after it',async()=>{
 const play=require('../app/api/play/route.ts');user={userId:'sq',email:'sq@example.test',displayName:'sq'};
 const mini=miniChallenge('m1');const wrong=mini.answer===0?1:0;const n=()=>db.prepare("SELECT COUNT(*) n FROM practice_events WHERE user_id='sq'").get().n;
 for(let i=0;i<3;i++){const r=await post(play,{missionId:'m1',choice:wrong});assert.equal(r.status,400);const d=await r.json();assert.match(d.error,/^That answer is not correct\./);assert.match(d.error,/try again/);assert.equal(n(),0)}
 const ok=await post(play,{missionId:'m1',choice:mini.answer});assert.equal(ok.status,200);assert.ok(n()>0);
});
