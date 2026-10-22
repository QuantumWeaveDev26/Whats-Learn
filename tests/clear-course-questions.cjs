const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const h=require('./helpers/harness.cjs'),{missions}=h.load('lib/missions.ts'),{missionForLevel}=h.load('lib/mission-levels.ts'),{courseSteps}=h.load('lib/course-guidance.ts'),{missionPractice}=h.load('lib/mission-practice.ts');
test('all 120 course and level questions ask one short decision without unexplained specialist labels',()=>{
 assert.equal(missions.length,40);let count=0;for(const m of missions)for(const level of ['beginner','practising','experienced']){const lesson=missionForLevel(m,level);assert.ok(lesson.question.split(/\s+/).length<=40,m.id+' '+level);assert.equal((lesson.question.match(/\?/g)||[]).length,1);assert.doesNotMatch(lesson.question,/referential.integrity|confounded|idempotency|luminance|causal diagnosis|capstone|acceptance check|req\.body|fetch\(/i);assert.ok(lesson.options.every(o=>o.split(/\s+/).length<=24));assert.ok(lesson.options[lesson.answer]);count++}assert.equal(count,120);
});
test('every course keeps everyday context and a concrete three-step make, try and improve task',()=>{
 const terms={marketing:/lunch|customer|shop|ad|post|campaign|resume|diya|tiffin/i,development:/parent|booking|class|shop|student|register|server|app|website|stock|order/i,filmmaking:/rider|actor|film|shot|character|Kavya|rooftop|fan|sunset|performer/i,storytelling:/library|picture|poster|image|club|flyer|chart|slide|pitch|campaign|tea stall/i};
 for(const m of missions){assert.match(m.question,terms[m.track],m.id);assert.equal(courseSteps[m.id].length,3);assert.ok(courseSteps[m.id].every(s=>s.length>25));const practice=missionPractice(m);assert.deepEqual(practice.steps,courseSteps[m.id]);assert.ok(practice.trial.includes(courseSteps[m.id][1]));assert.match(m.task,/^1\. /);assert.ok(m.task.includes('\n2. '));assert.ok(m.task.includes('\n3. '));}
 assert.match(courseSteps.d1.join(' '),/successful save.*forced failure/);assert.match(courseSteps.m4.join(' '),/real answers without names/);assert.match(courseSteps.f1.join(' '),/film.*again/i);assert.match(courseSteps.v3.join(' '),/willing viewer/);
});
test('all practical fields use plain questions while persisted identities and answer keys remain compatible',()=>{
 let count=0;for(const m of missions)for(const f of m.practical.fields){assert.ok(f.prompt?.endsWith('?'),m.id+'/'+f.id);assert.ok(f.prompt.length<=100);count++}assert.equal(count,169);
 const shape=[...missions].sort((a,b)=>a.id.localeCompare(b.id)).map(m=>({id:m.id,answer:m.answer,fields:m.practical.fields.map(({id,label,type,options,starter,anyOf})=>({id,label,type,options,starter,anyOf}))}));
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(shape)).digest('hex'),'ae268b94b8c871016fb27657d76510f669c9aab61f8ed9ea3c672678edd854c4');
 const {parseAnswer,composeAnswer}=h.load('lib/practical.ts'),samples=require('./fixtures/course-samples.json');for(const m of missions){const parsed=parseAnswer(m.practical,samples[m.id]);assert.ok(Object.values(parsed.fields).every(Boolean),m.id);assert.deepEqual(parseAnswer(m.practical,composeAnswer(m.practical,parsed)),parsed);}
});
test('WhatsApp uses the same short practical question and numbered real-world steps',()=>{
 const {shortFieldHint}=h.load('lib/whatsapp-step-check.ts');for(const m of missions)for(const f of m.practical.fields)assert.equal(shortFieldHint(m,f),f.prompt+'\n'+f.hint);
 const source=require('node:fs').readFileSync('lib/bridge/whatsapp-chat.ts','utf8');assert.match(source,/missionPractice\(lm\).steps\.map/);assert.match(source,/f.prompt\?'':' · '/);
});
test('short wording still states the numeric and evidence requirements used by the review',()=>{
 const {shortFieldHint}=h.load('lib/whatsapp-step-check.ts');const required={f2:{shots:/add up to 30/},f3:{budget:/5,000/},f4:{dialogue:/four to six.*A and B/i},f7:{cues:/at least four/i},f8:{edl:/30 seconds/},f9:{budget:/6,000/},v6:{caption:/fewer than 25 words/},d5:{validator:/10-digit.*quantity from 1/},d10:{checklist:/five yes\/no checks/i}};
 for(const [id,fields] of Object.entries(required)){const m=missions.find(m=>m.id===id);for(const [field,pattern] of Object.entries(fields)){const f=m.practical.fields.find(f=>f.id===field);assert.match(f.hint,pattern,id+'/'+field);assert.match(shortFieldHint(m,f),pattern);}}
});
