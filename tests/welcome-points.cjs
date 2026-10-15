// New-account points experience: the welcome balance is granted once, the welcome message is shown once, mission points and clue costs come back with the new balance,
// guests are told plainly they get no welcome balance, and the message respects reduced motion and makes no sound. Run: node --test tests/welcome-points.cjs
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const H=require('./helpers/harness.cjs');
const samples=require('./fixtures/course-samples.json');
const P=H.load('lib/points.ts'),MP=H.load('lib/mission-points.ts'),A=H.load('app/chatgpt-auth.ts'),M=H.load('lib/missions.ts');
const R=n=>H.load('app/api/'+n+'/route.ts');
const signup=R('auth/signup'),confirm=R('auth/confirm'),signin=R('auth/signin'),signout=R('auth/signout'),work=R('work'),clues=R('clues'),profile=R('profile'),welcome=R('points/welcome');
const PW='correct horse battery';
const make=async(fake,email='new@example.test')=>{await H.call(signup,'/api/auth/signup',{body:{name:'New Learner',email,password:PW,returnTo:'/learn'}});const u=new URL(fake.outbox.at(-1).link);const r=await H.call(confirm,'/api/auth/confirm',{body:{tokenHash:u.searchParams.get('token_hash'),type:'signup',next:u.searchParams.get('next')}});assert.equal(r.status,200);return (await A.getChatGPTUser()).userId};
const get=async()=>(await (await work.GET()).json());
const rows=(id,k)=>H.db.prepare('SELECT COUNT(*) n FROM point_ledger WHERE user_id=? AND kind=?').get(id,k).n;
const ack=()=>H.call(welcome,'/api/points/welcome',{});

test('a real, verified account gets 50 points exactly once and the page is told to show the welcome message',async()=>{
 const fake=H.reset();const id=await make(fake);
 assert.equal(rows(id,'starting'),1);assert.equal(await P.pointsBalance(id),50);
 const d=await get();assert.equal(d.points.balance,50,'the balance is there immediately');assert.deepEqual([d.points.welcome.amount,d.points.welcome.show],[50,true]);assert.ok(d.points.welcome.grantedAt);
 assert.equal(d.points.history.some(h=>h.kind==='welcome_seen'),false,'the bookkeeping row is not a point event');
});
test('after the message is acknowledged it never shows again: sign-in, sign-out, refresh, retries and profile edits grant and show nothing',async()=>{
 const fake=H.reset();const id=await make(fake);assert.equal((await ack()).status,200);assert.equal((await ack()).status,200,'a retried acknowledgement is harmless');
 for(let i=0;i<3;i++){await H.call(signout,'/api/auth/signout',{body:{}});await H.call(signin,'/api/auth/signin',{body:{email:'new@example.test',password:PW}});const d=await get();assert.deepEqual([d.points.balance,d.points.welcome.show],[50,false],'round '+i)}
 const pr=await H.call(profile,'/api/profile',{body:{goal:'job',track:'marketing',level:'beginner',language:'en',minutes:'10'}});assert.ok(pr.status<300,JSON.stringify(pr.json));
 await H.call(signup,'/api/auth/signup',{body:{name:'New Learner',email:'new@example.test',password:PW}});
 for(let i=0;i<4;i++)await MP.loadScores(id);
 assert.deepEqual([rows(id,'starting'),rows(id,'welcome_seen'),await P.pointsBalance(id)],[1,1,50]);assert.equal((await get()).points.welcome.show,false);
});
test('without an acknowledgement the balance is still granted only once (the message may repeat only until it has been shown once)',async()=>{
 const fake=H.reset();const id=await make(fake);for(let i=0;i<3;i++){await H.call(signout,'/api/auth/signout',{body:{}});await H.call(signin,'/api/auth/signin',{body:{email:'new@example.test',password:PW}});await get()}
 assert.deepEqual([rows(id,'starting'),await P.pointsBalance(id)],[1,50]);
});
test('guests, other accounts and forged requests cannot trigger or consume the welcome message',async()=>{
 const fake=H.reset();const one=await make(fake,'one@example.test');
 H.jar.clear();assert.equal((await ack()).status,401,'a guest cannot acknowledge anything');
 await H.call(signin,'/api/auth/signin',{body:{email:'one@example.test',password:PW}});assert.equal((await H.call(welcome,'/api/points/welcome',{origin:'https://evil.example'})).status,403);assert.equal((await get()).points.welcome.show,true);
 await H.call(signout,'/api/auth/signout',{body:{}});await make(fake,'two@example.test');assert.equal((await get()).points.welcome.show,true,'the second account has its own welcome');await ack();
 await H.call(signout,'/api/auth/signout',{body:{}});await H.call(signin,'/api/auth/signin',{body:{email:'one@example.test',password:PW}});assert.equal((await get()).points.welcome.show,true,'acknowledging one account does not hide another account’s welcome');assert.equal(one,(await A.getChatGPTUser()).userId);
});
test('the amount follows the documented setting; zero or a deleted account shows no welcome',async()=>{
 const f1=H.reset({env:{STARTING_POINTS:'80'}});const id=await make(f1);const d=await get();assert.deepEqual([d.points.welcome.amount,d.points.balance],[80,80]);
 const f0=H.reset({env:{STARTING_POINTS:'0'}});await make(f0);assert.equal((await get()).points.welcome.show,false,'no “0 points added” message');
 const f2=H.reset();const id2=await make(f2);const del=R('auth/delete');await H.call(del,'/api/auth/delete',{body:{password:PW,confirm:true}});
 assert.deepEqual(await P.welcomeStatus(id2),{amount:0,grantedAt:(await P.welcomeStatus(id2)).grantedAt,show:false},'the erased account’s marker never shows a welcome');
});
test('mission points come back with the new balance; a wrong answer and a repeat add nothing',async()=>{
 const fake=H.reset();const id=await make(fake);await ack();const m1=M.missions.find(m=>m.track==='marketing');
 const post=(route,body)=>route.POST(new Request('https://whatslearn.example.test/api/x',{method:'POST',headers:{origin:'https://whatslearn.example.test','content-type':'application/json'},body:JSON.stringify(body)}));
 const wrong=await (await post(work,{missionId:m1.id,body:samples[m1.id],checks:[true,true,true,true,true],quiz:(m1.answer+1)%m1.options.length})).json();assert.notEqual(wrong.award?.status,'awarded');assert.equal(await P.pointsBalance(id),50);
 const ok=await (await post(work,{missionId:m1.id,body:samples[m1.id],checks:[true,true,true,true,true],quiz:m1.answer})).json();
 assert.equal(ok.award.status,'awarded');assert.ok(ok.award.score.points>0);assert.equal(ok.award.balance,50+ok.award.score.points,'the new balance is in the response');
 const again=await (await post(work,{missionId:m1.id,body:samples[m1.id],checks:[true,true,true,true,true],quiz:m1.answer})).json();assert.notEqual(again.award.status,'awarded');assert.equal(await P.pointsBalance(id),ok.award.balance);
});
test('a clue shows its cost before it is revealed and its deduction after; repeats cost nothing',async()=>{
 const fake=H.reset();const id=await make(fake);await ack();const m=M.missions[0];
 const post=body=>clues.POST(new Request('https://whatslearn.example.test/api/clues',{method:'POST',headers:{origin:'https://whatslearn.example.test','content-type':'application/json'},body:JSON.stringify(body)}));
 const a=await (await post({missionId:m.id,clue:'hint'})).json();assert.deepEqual([a.recorded,a.charged,a.balance],[true,5,45]);
 const b=await (await post({missionId:m.id,clue:'hint'})).json();assert.deepEqual([b.recorded,b.charged,b.balance],[false,0,45],'repeat: no second charge, no second message');
 const page=fs.readFileSync(path.join(H.ROOT,'app/learn/page.tsx'),'utf8');
 assert.match(page,/clueCost\(/,'the cost is shown beside each clue before reveal');assert.match(page,/each clue costs \{POINTS\.clue\} points/);assert.match(page,/d\.recorded&&typeof d\.charged==='number'&&d\.charged>0\)setBurst/,'the deduction message only follows a real charge');
});
test('guest mode says plainly: no account welcome balance, progress local to this browser',()=>{
 const r=fs.readFileSync(path.join(H.ROOT,'components/whatslearn/practice-rewards.tsx'),'utf8');
 assert.match(r,/guests get no welcome balance/);assert.match(r,/Guests get no welcome balance\. Guest progress is local to this browser/);
 const page=fs.readFileSync(path.join(H.ROOT,'app/learn/page.tsx'),'utf8');assert.match(page,/Guest points are kept in this browser only/);
 assert.doesNotMatch(page.match(/if\(r\.status===401\)\{[^}]*\}/)?.[0]||'',/welcome/,'a guest never sees the welcome message');
});
test('the message is polite, quiet and motion-safe: no sound, reduced motion removes all movement, shown once per grant',()=>{
 const c=fs.readFileSync(path.join(H.ROOT,'components/whatslearn/points-burst.tsx'),'utf8'),css=fs.readFileSync(path.join(H.ROOT,'app/globals.css'),'utf8').split('/* v41:')[1];
 assert.match(c,/role="status"/);assert.match(c,/aria-live="polite"/);assert.match(c,/prefers-reduced-motion: reduce/);assert.match(c,/aria-hidden="true"/);assert.match(c,/Dismiss/);
 assert.doesNotMatch(c+fs.readFileSync(path.join(H.ROOT,'app/learn/page.tsx'),'utf8'),/new Audio\(|<audio|AudioContext|\.play\(\)\s*;?\s*\/\/sound/i,'no sound');
 const rm=css.match(/@media \(prefers-reduced-motion:reduce\)\{([^]*)\}\s*$/)[1];assert.match(rm,/\.points-burst\{animation:none\}/);assert.match(rm,/display:none/);
 assert.match(css,/animation:points-rise 1\.6s/,'the dots last under two seconds');assert.match(c,/calm\?6000:4200/,'auto-dismiss');assert.match(c,/calm\?0:particles/,'no dots drawn when calm');
 const page=fs.readFileSync(path.join(H.ROOT,'app/learn/page.tsx'),'utf8');assert.match(page,/Welcome! \$\{w\.amount\} points added/);assert.match(page,/whatslearn-welcome-'\+w\.grantedAt/,'one message per grant on this browser');assert.match(page,/welcomeShown\.current/,'not twice in one visit');assert.match(page,/\/api\/points\/welcome/);
});
test('host mode is honest: the Sites host cannot do verified email accounts, and the guide says what is needed',()=>{
 const s=fs.readFileSync(path.join(H.ROOT,'docs/sign-in-hosting.md'),'utf8'),g=fs.readFileSync(path.join(H.ROOT,'docs/deployment-guide.md'),'utf8');
 assert.match(s,/cannot be added on the Sites host/);assert.match(g,/Welcome points and real sign-up/);assert.match(g,/not proof of real sign-up|not proof of a real sign-up/);
});
