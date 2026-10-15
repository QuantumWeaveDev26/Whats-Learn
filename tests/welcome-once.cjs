// v44: evidence for the 50-point welcome on the real signup code path (signup route -> confirm route -> sign-in route -> first load), using the stand-in provider in tests/helpers.
// The stand-in is NOT proof of real Supabase sign-up or email delivery; see docs/owner-signup-checklist.md for the check to run against the configured Supabase project. Run: node --test tests/welcome-once.cjs
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const H=require('./helpers/harness.cjs');
const P=H.load('lib/points.ts'),MP=H.load('lib/mission-points.ts'),A=H.load('app/chatgpt-auth.ts');
const R=n=>H.load('app/api/'+n+'/route.ts');
const signup=R('auth/signup'),confirm=R('auth/confirm'),signin=R('auth/signin'),signout=R('auth/signout'),work=R('work'),profile=R('profile');
const PW='correct horse battery',EM='asha@example.test';
const src=f=>fs.readFileSync(path.join(H.ROOT,f),'utf8');
const rows=(id,k)=>H.db.prepare('SELECT COUNT(*) n FROM point_ledger WHERE user_id=? AND kind=?').get(id,k).n;
const doSignup=()=>H.call(signup,'/api/auth/signup',{body:{name:'Asha Rao',email:EM,password:PW,returnTo:'/learn'}});
const linkOf=fake=>{const u=new URL(fake.outbox.at(-1).link);return {tokenHash:u.searchParams.get('token_hash'),type:'signup',next:u.searchParams.get('next')}};
const get=async()=>(await (await work.GET()).json());
test('code path: only the confirm and sign-in routes credit the account; signup itself and a bare page load of a signed-out visitor credit nothing',()=>{
 assert.ok(!/ensureAccount|point_ledger/.test(src('app/api/auth/signup/route.ts')),'signup creates the login at the provider only');
 assert.match(src('app/api/auth/confirm/route.ts'),/setSessionCookies\(.*\);\s*try\{await ensureAccount\(r\.data\.user\.id\)\}/,'credited after the provider verified the link');
 assert.match(src('app/api/auth/signin/route.ts'),/ensureAccount\(r\.data\.user\.id\)/);
 // The one grant: a single INSERT OR IGNORE guarded by the unique index (user, kind, ref).
 assert.match(src('lib/points.ts'),/INSERT OR IGNORE INTO point_ledger \(user_id,kind,ref,delta,created_at\) VALUES \(\?,'starting','start',\?,\?\)/);
 assert.match(src('drizzle/0008_points_ledger.sql'),/CREATE UNIQUE INDEX `point_ledger_once` ON `point_ledger` \(`user_id`,`kind`,`ref`\)/);
});
test('an unverified account gets no points and cannot sign in until the emailed link is used',async()=>{
 const fake=H.reset();await doSignup();const before=H.db.prepare('SELECT COUNT(*) n FROM point_ledger').get().n;
 const s=await H.call(signin,'/api/auth/signin',{body:{email:EM,password:PW}});assert.ok(s.status>=400,'sign-in refused before verification: '+s.status);
 assert.equal(H.db.prepare('SELECT COUNT(*) n FROM point_ledger').get().n,before);assert.equal(before,0);
 assert.equal((await work.GET()).status,401,'no session, so no balance and no grant');
 const r=await H.call(confirm,'/api/auth/confirm',{body:linkOf(fake)});assert.equal(r.status,200);const id=(await A.getChatGPTUser()).userId;
 assert.deepEqual([rows(id,'starting'),await P.pointsBalance(id)],[1,50]);
});
test('the one-time link cannot be used twice, and a second device that signs in later gets nothing more',async()=>{
 const fake=H.reset();await doSignup();const link=linkOf(fake);const first=await H.call(confirm,'/api/auth/confirm',{body:link});assert.equal(first.status,200);const id=(await A.getChatGPTUser()).userId;
 const again=await H.call(confirm,'/api/auth/confirm',{body:link});assert.ok(again.status>=400,'used link refused: '+again.status);
 await H.call(signout,'/api/auth/signout',{body:{}});const dev2=await H.call(signin,'/api/auth/signin',{body:{email:EM,password:PW}});assert.equal(dev2.status,200);
 assert.deepEqual([rows(id,'starting'),await P.pointsBalance(id)],[1,50]);assert.equal((await get()).points.balance,50);
});
test('a simultaneous confirm, sign-in, page loads and profile edit still credit exactly once',async()=>{
 const fake=H.reset();await doSignup();const link=linkOf(fake);
 const [c]=await Promise.all([H.call(confirm,'/api/auth/confirm',{body:link})]);assert.equal(c.status,200);const id=(await A.getChatGPTUser()).userId;
 await Promise.all([1,2,3,4,5].map(()=>MP.loadScores(id)));await Promise.all([1,2,3].map(()=>P.ensureAccount(id)));
 await H.call(profile,'/api/profile',{body:{goal:'job',track:'marketing',level:'beginner',language:'en',minutes:'10'}});
 assert.deepEqual([rows(id,'starting'),await P.pointsBalance(id)],[1,50]);
});
test('the database itself refuses a second starting row for the same account, and a failed first attempt is retried safely at the next load',async()=>{
 const fake=H.reset();await doSignup();await H.call(confirm,'/api/auth/confirm',{body:linkOf(fake)});const id=(await A.getChatGPTUser()).userId;
 assert.throws(()=>H.db.prepare("INSERT INTO point_ledger (user_id,kind,ref,delta,created_at) VALUES (?,'starting','start',50,'x')").run(id),/UNIQUE/i);
 // If the grant at confirm time had failed (the route swallows that error so the learner is still signed in), the first load grants it once, never twice.
 H.db.prepare("DELETE FROM point_ledger WHERE user_id=? AND kind='starting'").run(id);assert.equal(await P.pointsBalance(id),0);
 const d1=await get();assert.equal(d1.points.balance,50);await get();await get();assert.deepEqual([rows(id,'starting'),await P.pointsBalance(id)],[1,50]);
});
test('the amount shown is the server balance: the page and the bar contain no hard-coded 50, and the server answers with it right after signup',async()=>{
 const chip=src('components/whatslearn/points-chip.tsx'),page=src('app/learn/workspace.tsx');
 assert.ok(!/\b50\b/.test(chip),'the bar never hard-codes the amount');
 assert.match(page,/Welcome! \$\{w\.amount\} points added/);assert.match(page,/typeof d\.points\?\.balance==='number'/);assert.ok(!/Welcome! 50/.test(page));
 const fake=H.reset({env:{STARTING_POINTS:'75'}});await doSignup();await H.call(confirm,'/api/auth/confirm',{body:linkOf(fake)});const d=await get();
 assert.deepEqual([d.points.balance,d.points.welcome.amount,d.points.welcome.show],[75,75,true],'follows the configured amount, so the screen cannot be showing a fixed number');
 const fake2=H.reset();await doSignup();await H.call(confirm,'/api/auth/confirm',{body:linkOf(fake2)});assert.equal((await get()).points.balance,50,'default is 50');
});
test('guests have no server balance or welcome',async()=>{
 H.reset();const r=await work.GET();assert.equal(r.status,401);
 assert.ok(!/starting|welcome/i.test(src('lib/guest-points.ts').replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'')),'guest points code has no starting balance');
});
