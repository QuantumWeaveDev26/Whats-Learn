// Synthetic records only; no real accounts, providers or outbound WhatsApp messages.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),ts=require('typescript');
const h=require('./helpers/harness.cjs');
const {supportedPracticalReview,reviewAccepted}=h.load('lib/review-summary.ts');
const {adaptiveSkills}=h.load('lib/adaptive-skills.ts'),{improvementStory}=h.load('lib/improvement-story.ts');
const {portfolioExport}=h.load('lib/portfolio-export.ts');
const good=()=>({summary:'The test supports the audience choice.',strengths:['The audience is specific.'],checks:[{item:'Name a customer',met:true,note:'Local office workers.'},{item:'Verify the offer',met:true,note:'Menu checked.'},{item:'Test the message',met:true,note:'A reader trial is reported.'}],nextStep:'Try a different customer constraint.',answerAssessment:{onTopic:true,correct:true,reason:'Correct and tested.'},practicalTest:{created:true,performed:true,reported:true,note:'A reader trial is reported.'}});
test('incorrect, off-topic, untested and blocked work never establishes practical mastery or acceptance',()=>{
 for(const change of [r=>r.answerAssessment.correct=false,r=>r.answerAssessment.onTopic=false,r=>r.practicalTest.created=false,r=>r.practicalTest.performed=false,r=>r.practicalTest.reported=false,r=>r.blockingIssue='An unresolved correctness error.']){
  const r=good();change(r);assert.equal(supportedPracticalReview(r),false);assert.equal(reviewAccepted(r),false);
  assert.ok(Object.values(adaptiveSkills([{mission_id:'m1',review:r,created_at:'2026-10-26'}])).every(s=>!s.demonstrated));
 }
 assert.equal(reviewAccepted(good()),true);
});
test('revision improvements require supported new evidence, including legacy rows without review keys',()=>{
 const before=good();before.checks[0].met=false;before.answerAssessment.correct=false;
 const old={mission_id:'m1',review:before,created_at:'2026-10-25'},now={mission_id:'m1',review:good(),created_at:'2026-10-26'};
 assert.equal(improvementStory([old,now]).length,1);
 now.review.answerAssessment.correct=false;assert.deepEqual(improvementStory([old,now]),[]);
 now.review=good();now.review.practicalTest.performed=false;assert.deepEqual(improvementStory([old,now]),[]);
});
test('private exports include actual feedback and survive malformed legacy checks or reviews',()=>{
 const work={mission_id:'m1',body:'My actual offer',checks:'not JSON',updated_at:'2026-10-26'};
 let text=portfolioExport([{...work,evaluation:JSON.stringify(good())}]);assert.match(text,/My actual offer/);assert.match(text,/Next action: Try a different/);assert.match(text,/Met the stored practical-review requirements/);assert.match(text,/not a certified assessment/);
 for(const evaluation of ['{bad',JSON.stringify({summary:'broken'}),JSON.stringify({...good(),answerAssessment:{correct:'true'}})])assert.match(portfolioExport([{...work,evaluation}]),/No readable AI evaluation/);
 const wrong=good();wrong.blockingIssue='Still incorrect';assert.match(portfolioExport([{...work,evaluation:JSON.stringify(wrong)}]),/Does not establish accepted practical work/);
 assert.match(portfolioExport([],[{outcome:'A short campaign',draft:{body:'Starter text',updatedAt:'2026-10-26'}}]),/not a completed course mission/);
});
test('English greetings need no AI call and do not introduce a mission or repeat the name mid-conversation',async()=>{
 h.reset();const ai=h.load('lib/ai-feedback.ts');global.fetch=async()=>{throw Error('No provider call expected');};
 assert.equal((await ai.answerMentor('Hi','en',{name:'Pavana'})).answer,'Hey Pavana! What’s on your mind?');
 assert.equal((await ai.answerMentor('Hello','en',{name:'Pavana',recentConversation:{question:'What is AI?'}})).answer,'What’s on your mind?');
 assert.equal(h.db.prepare('SELECT COUNT(*) n FROM ai_feedback_usage').get().n,0);
 const {directMentorOpening,mentorGreeting}=h.load('lib/chat-copy.ts');
 assert.equal(directMentorOpening('Hey A. Rao! AI finds patterns.','English',{name:'A. Rao'}),'AI finds patterns.');
 assert.equal(mentorGreeting('Hi, explain AI','English',{name:'Pavana'}),null);
 assert.equal(mentorGreeting('Hi','Kannada',{name:'Pavana'}),null);
});
test('each course has dated official references and optional authored practice, without changing mission IDs or grading',()=>{
 const {curriculumFor}=h.load('lib/curriculum-context.ts');
 for(const track of ['marketing','development','filmmaking','storytelling']){
  const first=curriculumFor(track,new Date('2026-10-26')),next=curriculumFor(track,new Date('2026-11-02'));
  assert.equal(first.humanApproval,'pending');assert.equal(first.revision,'2026-10-26');assert.notEqual(first.optionalPractice.id,next.optionalPractice.id);assert.ok(first.sources.every(s=>s.url.startsWith('https://')));assert.match(first.optionalPractice.assessment,/does not complete/);
 }
 assert.equal(curriculumFor('__proto__'),null);
});
test('failed upstream checks keep cached timestamps unchanged and return stale status',async()=>{
 h.reset();h.db.exec('DELETE FROM content_cache');const route=h.load('app/api/updates/route.ts');
 const at='2026-10-01T00:00:00Z',items=[{id:'react',title:'Cached React release',source:'React',track:'development',url:'https://github.com/facebook/react/releases/tag/example',publishedAt:at,checkedAt:at}];
 h.db.prepare('INSERT INTO content_cache(id,payload,updated_at) VALUES(?,?,?)').run('official-releases',JSON.stringify(items),at);
 global.fetch=async()=>new Response('Unavailable',{status:503});
 const r=await route.GET(),data=await r.json();assert.equal(r.status,200);assert.equal(data.updatedAt,at);assert.equal(data.stale,true);assert.equal(data.items[0].checkedAt,at);assert.equal(r.headers.get('Cache-Control'),'no-store');
 assert.equal(h.db.prepare("SELECT updated_at FROM content_cache WHERE id='official-releases'").get().updated_at,at);
});
test('partial source refresh keeps the unsuccessful source marked stale',async()=>{
 h.reset();h.db.exec('DELETE FROM content_cache');const at='2026-10-01T00:00:00Z';
 h.db.prepare('INSERT INTO content_cache(id,payload,updated_at) VALUES(?,?,?)').run('official-releases',JSON.stringify([{id:'react',title:'Old React',source:'React',track:'development',url:'https://github.com/facebook/react/releases/tag/old',publishedAt:at,checkedAt:at}]),at);
 global.fetch=async url=>String(url).includes('WordPress/gutenberg')?Response.json({name:'A release',html_url:'https://github.com/WordPress/gutenberg/releases/tag/example',published_at:at,draft:false,prerelease:false}):new Response('',{status:503});
 const data=await (await h.load('app/api/updates/route.ts').GET()).json();assert.equal(data.stale,true);assert.equal(data.sources.find(s=>s.id==='react').stale,true);assert.equal(data.sources.find(s=>s.id==='gutenberg').stale,false);
});
test('quality breakdown aggregates existing metadata rather than exposing new tracking',async()=>{
 h.reset();const {listQualityItems}=h.load('lib/quality/store.ts');
 const data=await listQualityItems({userId:'owner',email:'owner@example.test'},{});
 assert.equal(data.breakdown.windowDays,30);assert.deepEqual(data.breakdown.reportsByReason,[]);assert.match(data.breakdown.note,/not failure rates/);
});
test('workspace permits the approved learning-topic sidebar and note removal; other JSX stays identical',()=>{
 const jsx=source=>{const file=ts.createSourceFile('page.tsx',source.replace(/\r\n/g,'\n'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),out=[];function visit(n){if(ts.isJsxElement(n)||ts.isJsxSelfClosingElement(n)||ts.isJsxFragment(n))out.push(n.getText(file));ts.forEachChild(n,visit);}visit(file);return out;};
 // Hashes from 4f3b350; do not depend on Git history being present in a shallow CI checkout.
 const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
 // The user approved a short knowledge outline in the sidebar and removal of the practice note.
 // Restore only those edits before checking the original fingerprint; keep every other JSX byte protected.
 const restoreApprovedWorkspace=source=>{
  source=source.replace("<div className=\"learning-assistance\" data-assistance-dock aria-label=\"Learning help\"/>","<section className=\"chat-card\"><div className=\"chat-title\"><MessageCircle size={20}/><div><strong>Prefer learning in chat?</strong><span>Continue on WhatsApp</span></div></div><div className=\"chat-bubble\">Optional: continue the same course in WhatsApp.</div><a className=\"chat-reply\" href={waLinked?whatsappLearningUrl(\"TODAY\"):\"/settings?connect=whatsapp#whatsapp\"} {...(waLinked?whatsappLinkProps:{})}>{waLabel} <ArrowRight size={16}/></a>{waStatus==='error'&&<button className=\"text-button\" onClick={()=>void retryWa()}>Retry connection check</button>}</section>");
  source=source.replace('{next.minutes} min task{path.sessionMinutes<next.minutes?` · try ${path.sessionMinutes} min now`:null}','{path.sessionMinutes} min session · {next.minutes} min full mission');
  source=source.replaceAll("Your next task","Your next mission");
  source=source.replaceAll("Start this task","Start this mission");
  source=source.replaceAll("Continue task","Continue mission");
  source=source.replaceAll("Unlock my next task","Unlock my next mission");
  source=source.replaceAll("Why this task?","Why this mission?");
  source=source.replaceAll("tasks saved","missions saved");
  source=source.replaceAll("First 3 tasks free","First 3 missions free");
  source=source.replaceAll("Your first three tasks are complete.","Your first three missions are complete.");
  source=source.replaceAll("Continue with tasks 4–10 on a paid plan.","Unlock missions 4–10 with a plan.");
  source=source.replaceAll("Finish a task. Your creation appears here.","Finish a mission. Your creation appears here.");

  const prefix='<section className="learning-path-panel" aria-labelledby="journey-learning-path-title">';
  const start=source.indexOf(prefix),end=source.indexOf('</section><details className="learning-details extra-rewards">',start);
  assert.ok(start>source.indexOf('<aside className="right-column">'));assert.ok(end>start);
  assert.equal(source.includes('A lesson is a start. Your work is the proof.'),false);
  const approved=source.slice(start+prefix.length,end);
  assert.equal(hash(approved),'dd086c5a1c6e9894ab58fe8af863dacdf1bf0a8e7a48d2686e29eff61764849c');
  const path="<div className=\"section-heading lower\"><h2>Your learning path</h2><button className=\"text-button\" onClick={()=>setView('paths')}>Explore paths <ArrowRight size={15}/></button></div><details className=\"learning-details\"><summary>Full course roadmap · {count}/{current.length} saved</summary><CourseRoadmap paidAccess={paidAccess} track={track} completed={doneIds} cleared={cleared} onOpen={openMission} onCheckpoint={(t,a)=>{const c=checkpointFor(t,a);if(c)setCp(c)}}/></details><details className=\"learning-details\"><summary>Mini challenges</summary><CheckpointRow track={track} done={doneIds} cleared={cleared} onOpen={c=>setCp(c)}/></details>";
  const rest=source.slice(0,start)+source.slice(end+'</section>'.length);
  const anchor='</section>\n<aside className="right-column">';
  const note='<div className="practice-note"><span className="note-icon">↗</span><div><h3>A lesson is a start. Your work is the proof.</h3><p>Use short lessons to start. Set time aside for deeper practice.</p></div></div>';
  assert.ok(rest.includes(anchor));
  return rest.replace(anchor,path+note+anchor);
 };
 const baseline={'app/learn/workspace.tsx':'ae5459871df5740031f1b5480fa3b113cad073717b7511adec53e090f6009b1b','app/layout.tsx':'98e4aee781f8608f33cbeb96292ba9940e55a3917f990bdc47743a84a6f3d587'};
 for(const [file,expected] of Object.entries(baseline)){const source=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');assert.equal(hash(JSON.stringify(jsx(file==='app/learn/workspace.tsx'?restoreApprovedWorkspace(source):source))),expected);}
 assert.equal(hash(fs.readFileSync('lib/curriculum.ts','utf8').replace(/\r\n/g,'\n')),'5df69a05b07ae54cfc152dc4d601185a7a484dd28daafd1d1c0f29ef5ca80e46');
});
