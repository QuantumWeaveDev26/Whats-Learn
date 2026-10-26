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
test('existing workspace and layout JSX are byte-identical: no card, text, class or styling changes',()=>{
 const jsx=source=>{const file=ts.createSourceFile('page.tsx',source.replace(/\r\n/g,'\n'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),out=[];function visit(n){if(ts.isJsxElement(n)||ts.isJsxSelfClosingElement(n)||ts.isJsxFragment(n))out.push(n.getText(file));ts.forEachChild(n,visit);}visit(file);return out;};
 // Hashes from 4f3b350; do not depend on Git history being present in a shallow CI checkout.
 const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
 const baseline={'app/learn/workspace.tsx':'ae5459871df5740031f1b5480fa3b113cad073717b7511adec53e090f6009b1b','app/layout.tsx':'98e4aee781f8608f33cbeb96292ba9940e55a3917f990bdc47743a84a6f3d587'};
 for(const [file,expected] of Object.entries(baseline))assert.equal(hash(JSON.stringify(jsx(fs.readFileSync(file,'utf8')))),expected);
 assert.equal(hash(fs.readFileSync('lib/curriculum.ts','utf8').replace(/\r\n/g,'\n')),'5df69a05b07ae54cfc152dc4d601185a7a484dd28daafd1d1c0f29ef5ca80e46');
});
