// Email and password accounts through the managed provider (tested against a stand-in for the provider's API): sign-up, confirmation, sign-in, sign-out, password reset,
// invalid credentials, unconfirmed email, expired links, network failure, rate limits, CSRF, session cookies, account deletion, and host-mode isolation.
// No network, no real keys. Run: node --test tests/email-auth.cjs
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const H=require('./helpers/harness.cjs');
const R=n=>H.load('app/api/auth/'+n+'/route.ts');
const signup=R('signup'),signin=R('signin'),signout=R('signout'),forgot=R('forgot'),reset=R('reset'),resend=R('resend'),confirm=R('confirm'),del=R('delete'),config=R('config');
const A=H.load('app/chatgpt-auth.ts'),AC=H.load('lib/auth/config.ts'),P=H.load('lib/points.ts');
const sessionRoute=H.load('app/api/session/route.ts');
const PW='correct horse battery';
const body=(o={})=>({name:'Asha Rao',email:'asha@example.test',password:PW,returnTo:'/learn?mission=m2',...o});
async function register(fake,o={}){const r=await H.call(signup,'/api/auth/signup',{body:body(o)});assert.equal(r.status,200,JSON.stringify(r.json));return r}
async function confirmLast(fake){const m=fake.outbox.at(-1);const u=new URL(m.link);const r=await H.call(confirm,'/api/auth/confirm',{body:{tokenHash:u.searchParams.get('token_hash'),type:u.searchParams.get('type'),next:u.searchParams.get('next')}});return {r,m}}
const signedIn=async()=>!!(await A.getChatGPTUser());

test('Node hosting refuses forged OpenAI account headers and reports unconfigured email sign-in',async()=>{
 H.reset({noProvider:true,env:{WHATSLEARN_RUNTIME:'node'}});
 H.setHeaders(new Headers({'oai-authenticated-user-id':'forged','oai-authenticated-user-email':'forged@example.test'}));
 assert.equal(await A.getChatGPTUser(),null);
 assert.equal(AC.authMode(),'unavailable');
 const response=await config.GET();const body=await response.json();
 assert.equal(body.chatgpt,false);assert.equal(body.signedIn,false);
});

test('configuration: email mode needs a valid provider address and key; otherwise the host sign-in is used',()=>{
 H.reset({noProvider:true});assert.equal(AC.authMode(),'host');assert.equal(AC.emailAuthConfigured(),false);
 for(const bad of ['http://auth.example.test','ftp://x.test','not a url','javascript:alert(1)']){H.reset({env:{SUPABASE_URL:bad}});assert.equal(AC.emailAuthConfigured(),false,bad)}
 H.reset({env:{SUPABASE_PUBLISHABLE_KEY:''}});assert.equal(AC.emailAuthConfigured(),false,'no key, no email mode');
 H.reset({env:{SUPABASE_URL:'http://127.0.0.1:54321'}});assert.equal(AC.emailAuthConfigured(),true,'a provider on this computer is accepted for local testing');
 H.reset();assert.equal(AC.authMode(),'email');assert.equal(AC.siteOrigin(new Request('https://evil.example/x')),'https://whatslearn.example.test','links in emails use SITE_URL, never the request host');
 H.reset({env:{SITE_URL:''}});assert.equal(AC.siteOrigin(new Request('https://evil.example/x')),null,'without SITE_URL no emailed link is built from an untrusted host');
});
test('routes refuse to run, with a clear message, when no provider is configured (no form can work on this host)',async()=>{
 H.reset({noProvider:true});const r=await H.call(signin,'/api/auth/signin',{body:{email:'a@b.test',password:'x'}});assert.equal(r.status,503);assert.equal(r.json.code,'not_configured');
 const c=await H.call(config,'/api/auth/config',{method:'GET'});assert.deepEqual([c.json.mode,c.json.emailPassword,c.json.chatgpt],['host',false,true]);
 H.reset();const c2=await H.call(config,'/api/auth/config',{method:'GET'});assert.deepEqual([c2.json.mode,c2.json.emailPassword,c2.json.chatgpt],['email',true,false]);
 for(const [dir,form] of [['signin','SignInForm'],['signup','SignUpForm'],['forgot-password','ForgotForm'],['verify-email','VerifyEmailPanel'],['auth/confirm','ConfirmPanel'],['signout','SignOutPanel']]){
  const src=fs.readFileSync(path.join(H.ROOT,'app',dir,'page.tsx'),'utf8');assert.match(src,new RegExp('emailAuthConfigured\\(\\)\\s*\\?\\s*(<AccountShell>)?<'+form),dir+' shows its form only in email mode');}
});
test('sign-up: name, email and password only; same answer for a new and a registered address; weak or malformed input is refused first',async()=>{
 const fake=H.reset();const r=await register(fake);assert.match(r.json.message,/Check your email/);assert.equal(fake.outbox.length,1);
 const link=new URL(fake.outbox[0].link);assert.equal(link.origin,'https://whatslearn.example.test');assert.equal(link.pathname,'/auth/confirm');assert.equal(link.searchParams.get('next'),'/learn?mission=m2');assert.equal(link.searchParams.get('type'),'signup');
 // Confirm, then try the same address again: the answer is identical and nothing leaks.
 await confirmLast(fake);const again=await H.call(signup,'/api/auth/signup',{body:body({name:'Someone Else'})});assert.deepEqual(again.json,r.json,'a registered address gets the same answer');
 const weak=await H.call(signup,'/api/auth/signup',{body:body({email:'b@example.test',password:'short'})});assert.equal(weak.status,400);assert.match(weak.json.error,/at least 10/);
 for(const bad of [{name:''},{name:'<script>'},{email:'nope'},{password:'x'.repeat(80)}]){const x=await H.call(signup,'/api/auth/signup',{body:body({email:'c@example.test',...bad})});assert.equal(x.status,400,JSON.stringify(bad))}
 const phone=await H.call(signup,'/api/auth/signup',{body:{...body({email:'d@example.test'}),phone:'+910000000000'}});assert.equal(phone.status,400,'a phone number is not accepted or required');
 const providerWeak=H.fake;providerWeak.minPassword=14;const pw=await H.call(signup,'/api/auth/signup',{body:body({email:'e@example.test',password:'elevenchars'})});assert.equal(pw.status,422);assert.equal(pw.json.code,'weak_password');
});
test('a new account cannot sign in until the email is confirmed; the confirmation link signs in, once',async()=>{
 const fake=H.reset();await register(fake);
 const early=await H.call(signin,'/api/auth/signin',{body:{email:'asha@example.test',password:PW}});assert.equal(early.status,403);assert.equal(early.json.code,'email_not_confirmed');assert.match(early.json.error,/confirm your email/i);assert.equal(H.jar.size,0,'no session before confirmation');
 const {r,m}=await confirmLast(fake);assert.equal(r.status,200);assert.equal(r.json.redirect,'/welcome?next=%2Flearn%3Fmission%3Dm2');assert.ok(await signedIn(),'the confirmation link signs the learner in');
 const reuse=await H.call(confirm,'/api/auth/confirm',{body:{tokenHash:new URL(m.link).searchParams.get('token_hash'),type:'signup',next:'/learn'}});assert.equal(reuse.status,400);assert.equal(reuse.json.code,'link_expired');assert.match(reuse.json.error,/expired or was already used/);
 const forged=await H.call(confirm,'/api/auth/confirm',{body:{tokenHash:'th_'+'A'.repeat(24),type:'signup',next:'/learn'}});assert.equal(forged.json.code,'link_expired');
 const bad=await H.call(confirm,'/api/auth/confirm',{body:{tokenHash:'bad token!',type:'signup',next:'/learn'}});assert.equal(bad.status,400);
});
test('expired confirmation link: shows the expired message and a new link can be requested',async()=>{
 let clock=Date.now();const fake=H.reset({fake:{now:()=>clock}});await register(fake);clock+=2*3600e3;
 const {r}=await confirmLast(fake);assert.equal(r.status,400);assert.equal(r.json.code,'link_expired');assert.equal(H.jar.size,0);
 const rs=await H.call(resend,'/api/auth/resend',{body:{email:'asha@example.test',returnTo:'/learn'}});assert.equal(rs.status,200);assert.equal(fake.outbox.length,2);
 const ok=await confirmLast(fake);assert.equal(ok.r.status,200);
 const unknown=await H.call(resend,'/api/auth/resend',{body:{email:'nobody@example.test',returnTo:'/learn'}});assert.deepEqual(unknown.json,rs.json,'resend does not reveal which addresses exist');
});
test('sign-in: success sets HttpOnly session cookies and returns only a safe path; invalid credentials get one generic message',async()=>{
 const fake=H.reset();await register(fake);await confirmLast(fake);for(const k of [...H.jar.keys()])H.jar.delete(k);
 const bad=await H.call(signin,'/api/auth/signin',{body:{email:'asha@example.test',password:'wrong password!!'}});const none=await H.call(signin,'/api/auth/signin',{body:{email:'nobody@example.test',password:'wrong password!!'}});
 assert.equal(bad.status,401);assert.equal(bad.json.code,'invalid_credentials');assert.deepEqual(bad.json,none.json,'same answer for a wrong password and an unknown address');assert.equal(H.jar.size,0);assert.ok(!JSON.stringify(bad.json).includes('wrong password'),'the password is never echoed');
 const ok=await H.call(signin,'/api/auth/signin',{body:{email:'ASHA@example.test',password:PW,returnTo:'/learn?mission=m2'}});assert.equal(ok.status,200);assert.equal(ok.json.redirect,'/welcome?next=%2Flearn%3Fmission%3Dm2');
 assert.ok(!JSON.stringify(ok.json).includes('access_token')&&!JSON.stringify(ok.json).includes('at_'),'tokens are never sent to page JavaScript');
 assert.equal(H.jar.size,2);for(const [,c] of H.jar){assert.equal(c.httpOnly,true);assert.equal(c.sameSite,'lax');assert.equal(c.path,'/')}
 const evil=await H.call(signin,'/api/auth/signin',{body:{email:'asha@example.test',password:PW,returnTo:'https://evil.example/steal'}});assert.equal(evil.json.redirect,'/welcome?next=%2Flearn','an outside address becomes safe /learn after setup');
 const loop=await H.call(signin,'/api/auth/signin',{body:{email:'asha@example.test',password:PW,returnTo:'/signin'}});assert.equal(loop.json.redirect,'/welcome?next=%2Flearn');
 assert.ok(await signedIn());const sess=await H.call(sessionRoute,'/api/session',{method:'GET'});assert.equal(sess.json.signedIn,true);
});
test('secure cookies on https use the __Host- prefix; the password never appears in any response or log line',async()=>{
 const fake=H.reset();await register(fake);await confirmLast(fake);for(const k of [...H.jar.keys()])H.jar.delete(k);
 const logs=[];const old={log:console.log,error:console.error,warn:console.warn,info:console.info};for(const k of Object.keys(old))console[k]=(...a)=>logs.push(a.join(' '));
 try{const res=await signin.POST(new Request('https://whatslearn.example.test/api/auth/signin',{method:'POST',headers:{origin:'https://whatslearn.example.test','content-type':'application/json'},body:JSON.stringify({email:'asha@example.test',password:PW})}));const t=await res.text();assert.ok(!t.includes(PW));}finally{Object.assign(console,old)}
 assert.deepEqual([...H.jar.keys()].sort(),['__Host-wl-at','__Host-wl-rt']);for(const [,c] of H.jar)assert.equal(c.secure,true);assert.deepEqual(logs.filter(l=>l.includes(PW)),[]);
 for(const f of ['lib/auth/gotrue.ts','lib/auth/session.ts','lib/auth/http.ts','lib/auth/limits.ts','lib/account-delete.ts'])assert.ok(!/console\./.test(fs.readFileSync(path.join(H.ROOT,f),'utf8')),f+' never logs');
 for(const n of fs.readdirSync(path.join(H.ROOT,'app/api/auth')))assert.ok(!/console\./.test(fs.readFileSync(path.join(H.ROOT,'app/api/auth',n,'route.ts'),'utf8')),n+' never logs');
});
test('sessions are verified by the provider on every request; renewing, expiry and revocation',async()=>{
 const fake=H.reset();await register(fake);await confirmLast(fake);
 const user=await A.getChatGPTUser();assert.equal(user.email,'asha@example.test');assert.equal(user.displayName,'Asha Rao');assert.ok(/^[0-9a-f-]{36}$/.test(user.userId));
 // The access cookie runs out: the refresh cookie renews it and new cookies are stored.
 const at=H.jar.get('wl-at')||H.jar.get('__Host-wl-at');const name=H.jar.has('wl-at')?'wl-at':'__Host-wl-at';H.jar.delete(name);fake.access.clear();
 const renewed=await A.getChatGPTUser();assert.equal(renewed.userId,user.userId);assert.ok(H.jar.get(name).value!==at.value,'a new access token was stored');
 // Forged or tampered cookies never work.
 H.jar.set(name,{value:'at_forged',httpOnly:true});H.jar.delete(name==='wl-at'?'wl-rt':'__Host-wl-rt');assert.equal(await A.getChatGPTUser(),null);
 // Without any cookie there is no user, and protected APIs answer 401.
 H.jar.clear();assert.equal(await A.getChatGPTUser(),null);const work=H.load('app/api/work/route.ts');assert.equal((await work.GET()).status,401);
});
test('host sign-in headers are ignored in email mode (anyone can send them off Sites) and still honoured in host mode',async()=>{
 H.reset();H.setHeaders(new Headers({'oai-authenticated-user-id':'forged-admin','oai-authenticated-user-email':'owner@example.test'}));
 assert.equal(await A.getChatGPTUser(),null,'forged headers do nothing in email mode');const work=H.load('app/api/work/route.ts');assert.equal((await work.GET()).status,401);
 H.reset({noProvider:true});H.setHeaders(new Headers({'oai-authenticated-user-id':'host-user','oai-authenticated-user-email':'h@example.test'}));
 assert.equal((await A.getChatGPTUser()).userId,'host-user','host mode (OpenAI Sites) still reads the host headers');
});
test('sign-out clears the session, revokes it at the provider, and still works when the provider is unreachable',async()=>{
 const fake=H.reset();await register(fake);await confirmLast(fake);assert.ok(await signedIn());
 const r=await H.call(signout,'/api/auth/signout',{body:{returnTo:'/learn'}});assert.equal(r.status,200);assert.equal(r.json.redirect,'/learn');assert.equal(H.jar.size,0);assert.equal(await signedIn(),false);
 assert.equal(fake.access.size,0,'the session is revoked at the provider');
 const bad=await H.call(signout,'/api/auth/signout',{body:{returnTo:'https://evil.example'}});assert.equal(bad.json.redirect,'/');
 await H.call(signin,'/api/auth/signin',{body:{email:'asha@example.test',password:PW}});assert.ok(await signedIn());fake.down=true;
 const down=await H.call(signout,'/api/auth/signout',{body:{}});assert.equal(down.status,200);assert.equal(H.jar.size,0,'cookies are cleared even with the provider down');
});
test('network failure and provider rate limits give clear messages and never a session',async()=>{
 const fake=H.reset();await register(fake);await confirmLast(fake);for(const k of [...H.jar.keys()])H.jar.delete(k);
 fake.down=true;const n=await H.call(signin,'/api/auth/signin',{body:{email:'asha@example.test',password:PW}});assert.equal(n.status,503);assert.equal(n.json.code,'network');assert.match(n.json.error,/could not reach/i);assert.equal(H.jar.size,0);
 const s=await H.call(signup,'/api/auth/signup',{body:body({email:'z@example.test'})});assert.equal(s.json.code,'network');
 const f=await H.call(forgot,'/api/auth/forgot',{body:{email:'asha@example.test'}});assert.equal(f.json.code,'network');
 fake.down=false;fake.rateLimited=true;const rl=await H.call(signin,'/api/auth/signin',{body:{email:'asha@example.test',password:PW}});assert.equal(rl.status,429);assert.equal(rl.json.code,'rate_limited');
 fake.rateLimited=false;fake.handle=()=>({status:200,json:'<html>'});const odd=await H.call(signin,'/api/auth/signin',{body:{email:'asha@example.test',password:PW}});assert.notEqual(odd.status,200,'a malformed provider answer is not a sign-in');assert.equal(H.jar.size,0);
});
test('our own attempt limits: repeated sign-ins, sign-ups and reset requests are slowed down per address and per email',async()=>{
 const fake=H.reset();let last;for(let i=0;i<9;i++)last=await H.call(signin,'/api/auth/signin',{body:{email:'asha@example.test',password:'nope nope nope'}});
 assert.equal(last.status,429,'the 9th try for one email in 15 minutes is refused');const other=await H.call(signin,'/api/auth/signin',{body:{email:'another@example.test',password:'nope nope nope'}},);assert.equal(other.status,401,'other emails are unaffected until the address limit');
 H.reset();for(let i=0;i<5;i++)await H.call(signup,'/api/auth/signup',{body:body({email:`u${i}@example.test`})});const sixth=await H.call(signup,'/api/auth/signup',{body:body({email:'u6@example.test'})});assert.equal(sixth.status,429);
 const otherIp=await H.call(signup,'/api/auth/signup',{body:body({email:'u7@example.test'}),ip:'198.51.100.9'});assert.equal(otherIp.status,200);
 H.reset();for(let i=0;i<3;i++)await H.call(forgot,'/api/auth/forgot',{body:{email:'asha@example.test'}});assert.equal((await H.call(forgot,'/api/auth/forgot',{body:{email:'asha@example.test'}})).status,429);
 const rows=H.db.prepare('SELECT key FROM auth_attempts').all();assert.ok(rows.length>0&&rows.every(r=>!r.key.includes('@')&&!r.key.includes('example')),'attempt counters hold hashes, not email addresses or addresses');
});
test('CSRF: every account route refuses a request that did not come from this site, and only accepts JSON from it',async()=>{
 const fake=H.reset();await register(fake);await confirmLast(fake);
 for(const [route,url,b] of [[signin,'signin',{email:'a@b.test',password:'x'}],[signup,'signup',body()],[signout,'signout',{}],[forgot,'forgot',{email:'a@b.test'}],[reset,'reset',{password:PW+'1'}],[resend,'resend',{email:'a@b.test'}],[confirm,'confirm',{tokenHash:'th_aaaaaaaa',type:'signup'}],[del,'delete',{password:PW,confirm:true}]]){
  for(const origin of [null,'https://evil.example']){const r=await H.call(route,'/api/auth/'+url,{body:b,origin});assert.equal(r.status,403,url+' '+origin)}}
 assert.ok(await signedIn(),'a forged cross-site request did not sign the learner out or change anything');
 const big=await H.call(signin,'/api/auth/signin',{body:{email:'a@b.test',password:'x'.repeat(5000)}});assert.ok([400,413].includes(big.status));
});
test('password reset: same answer for known and unknown emails; the link works once; the new password works and the old one does not',async()=>{
 const fake=H.reset();await register(fake);await confirmLast(fake);await H.call(signout,'/api/auth/signout',{body:{}});
 const known=await H.call(forgot,'/api/auth/forgot',{body:{email:'asha@example.test'}});const unknown=await H.call(forgot,'/api/auth/forgot',{body:{email:'nobody@example.test'}});assert.deepEqual(known.json,unknown.json);
 assert.equal(fake.outbox.filter(m=>m.type==='recovery').length,1,'an email is sent only to the real account');
 const m=fake.outbox.at(-1);const u=new URL(m.link);assert.equal(u.pathname,'/auth/confirm');assert.equal(u.searchParams.get('next'),'/reset-password');
 // Before the link is opened the reset route refuses.
 assert.equal((await H.call(reset,'/api/auth/reset',{body:{password:'a brand new passphrase'}})).json.code,'link_expired');
 const opened=await H.call(confirm,'/api/auth/confirm',{body:{tokenHash:u.searchParams.get('token_hash'),type:'recovery',next:'/reset-password'}});assert.equal(opened.json.redirect,'/reset-password');
 const weak=await H.call(reset,'/api/auth/reset',{body:{password:'short'}});assert.equal(weak.status,400);
 const done=await H.call(reset,'/api/auth/reset',{body:{password:'a brand new passphrase'}});assert.equal(done.status,200);assert.equal(done.json.redirect,'/learn');
 await H.call(signout,'/api/auth/signout',{body:{}});
 assert.equal((await H.call(signin,'/api/auth/signin',{body:{email:'asha@example.test',password:PW}})).status,401,'the old password stops working');
 assert.equal((await H.call(signin,'/api/auth/signin',{body:{email:'asha@example.test',password:'a brand new passphrase'}})).status,200);
 const reuse=await H.call(confirm,'/api/auth/confirm',{body:{tokenHash:u.searchParams.get('token_hash'),type:'recovery',next:'/reset-password'}});assert.equal(reuse.json.code,'link_expired');
});
test('expired reset link: clear message, no session, and a fresh link can be requested',async()=>{
 let clock=Date.now();const fake=H.reset({fake:{now:()=>clock}});await register(fake);await confirmLast(fake);await H.call(signout,'/api/auth/signout',{body:{}});
 await H.call(forgot,'/api/auth/forgot',{body:{email:'asha@example.test'}});clock+=2*3600e3;const u=new URL(fake.outbox.at(-1).link);
 const r=await H.call(confirm,'/api/auth/confirm',{body:{tokenHash:u.searchParams.get('token_hash'),type:'recovery',next:'/reset-password'}});assert.equal(r.status,400);assert.equal(r.json.code,'link_expired');assert.match(r.json.error,/expired/);assert.equal(H.jar.size,0);
});
test('the one-time starting balance is granted once per account: sign-up, confirmation, repeated sign-ins, refreshes and profile edits never repeat it',async()=>{
 const fake=H.reset();await register(fake);await confirmLast(fake);const id=(await A.getChatGPTUser()).userId;
 const count=()=>H.db.prepare("SELECT COUNT(*) n FROM point_ledger WHERE user_id=? AND kind='starting'").get(id).n;assert.equal(count(),1);assert.equal(await P.pointsBalance(id),50);
 for(let i=0;i<3;i++){await H.call(signout,'/api/auth/signout',{body:{}});await H.call(signin,'/api/auth/signin',{body:{email:'asha@example.test',password:PW}});await H.call(sessionRoute,'/api/session',{method:'GET'});await H.load('lib/mission-points.ts').loadScores(id)}
 await H.call(signup,'/api/auth/signup',{body:body()});assert.equal(count(),1);assert.equal(await P.pointsBalance(id),50);
 H.reset({env:{STARTING_POINTS:'80'}});const f2=H.fake;await register(f2,{email:'new@example.test'});await confirmLast(f2);assert.equal(await P.pointsBalance((await A.getChatGPTUser()).userId),80,'the amount is configurable');
});
test('account deletion: needs the password; erases data and the login; keeps no welcome-balance loophole; works without the provider admin key too',async()=>{
 const fake=H.reset();await register(fake);await confirmLast(fake);const id=(await A.getChatGPTUser()).userId;
 const ml=H.load('lib/mission-points.ts');await ml.recordClue(id,'m1','hint');H.db.prepare("INSERT INTO work (user_id,mission_id,body,checks,quiz,updated_at) VALUES (?,?,?,?,?,?)").run(id,'m1','my work','[]',0,'x'); const wrong=await H.call(del,'/api/auth/delete',{body:{password:'not my password',confirm:true}});assert.equal(wrong.status,401);assert.equal(H.db.prepare('SELECT COUNT(*) n FROM work WHERE user_id=?').get(id).n,1,'nothing is deleted on a wrong password');
 const noTick=await H.call(del,'/api/auth/delete',{body:{password:PW,confirm:false}});assert.equal(noTick.status,400);
 const ok=await H.call(del,'/api/auth/delete',{body:{password:PW,confirm:true}});assert.equal(ok.status,200);assert.equal(ok.json.loginRemoved,true);assert.equal(H.jar.size,0);assert.equal(fake.users.size,0,'the login is removed at the provider');
 for(const t of ['work','mission_clues','mission_scores','practice_events','learner_profiles','uploads','reward_claims'])assert.equal(H.db.prepare(`SELECT COUNT(*) n FROM ${t} WHERE user_id=?`).get(id).n,0,t);
 const left=H.db.prepare('SELECT kind,delta FROM point_ledger WHERE user_id=?').all(id);assert.deepEqual(left.map(x=>({...x})),[{kind:'starting',delta:0}],'one empty marker keeps the welcome balance from ever being granted again');
 // Without the optional provider admin key the data is still erased and the owner is told.
 const f2=H.reset({env:{SUPABASE_SERVICE_ROLE_KEY:''}});await register(f2);await confirmLast(f2);const id2=(await A.getChatGPTUser()).userId;
 const r2=await H.call(del,'/api/auth/delete',{body:{password:PW,confirm:true}});assert.equal(r2.status,200);assert.equal(r2.json.loginRemoved,false);assert.match(r2.json.message,/within 30 days/);
 assert.equal(await P.pointsBalance(id2),0,'a later sign-in with the leftover login cannot get a second welcome balance');
 assert.equal((await H.call(del,'/api/auth/delete',{body:{password:PW,confirm:true}})).status,401,'signed-out visitors cannot delete anything');
});
test('account isolation: one learner never sees or changes another learner’s data',async()=>{
 const fake=H.reset();await register(fake,{email:'one@example.test'});await confirmLast(fake);const one=(await A.getChatGPTUser()).userId;
 const ml=H.load('lib/mission-points.ts');await ml.recordClue(one,'m1','hint');
 await H.call(signout,'/api/auth/signout',{body:{}});await register(fake,{email:'two@example.test',name:'Bo Two'});await confirmLast(fake);const two=(await A.getChatGPTUser()).userId;assert.notEqual(one,two);
 const work=H.load('app/api/work/route.ts');const g=await (await work.GET()).json();assert.equal(g.points.balance,50);assert.deepEqual(g.points.clues,{});
 const clues=H.load('app/api/clues/route.ts');await clues.POST(H.req('/api/clues',{body:{missionId:'m1',clue:'hint'}}));assert.equal(await P.pointsBalance(one),45);assert.equal(await P.pointsBalance(two),45);
 assert.equal(H.db.prepare('SELECT COUNT(*) n FROM mission_clues WHERE user_id=?').get(one).n,1);
});
test('every sign-up, sign-in, confirm, reset and sign-out path leads to a page that exists (no 404)',()=>{
 const exists=p=>['page.tsx','route.ts'].some(f=>fs.existsSync(path.join(H.ROOT,'app',p,f)));
 for(const p of ['signin','signup','signout','forgot-password','reset-password','verify-email','auth/confirm','settings','learn','privacy','terms'])assert.ok(exists(p),p);
 const forms=fs.readFileSync(path.join(H.ROOT,'components/whatslearn/auth-forms.tsx'),'utf8');
 for(const m of forms.matchAll(/href=\{?[`"'](\/[a-z\-/]*)/g))assert.ok(exists(m[1].slice(1)||'.')||m[1]==='/','form link '+m[1]);
 for(const m of forms.matchAll(/'(\/api\/auth\/[a-z]+)'/g))assert.ok(fs.existsSync(path.join(H.ROOT,'app',m[1].slice(1),'route.ts')),m[1]);
 for(const k of ['link_expired','invalid_credentials','email_not_confirmed','network','rate_limited','weak_password'])assert.ok(H.load('lib/auth/gotrue.ts').messages[k].length>20,k+' has a clear message');
});
test('provider calls never follow redirects, and use only options the Workers runtime supports',async()=>{
 const src=fs.readFileSync(path.join(H.ROOT,'lib/auth/gotrue.ts'),'utf8');
 assert.doesNotMatch(src,/redirect:\s*['"]error['"]/,"the Workers runtime rejects redirect:'error' (found by the real-runtime browser test)");assert.match(src,/redirect:\s*['"]manual['"]/);
 const fake=H.reset();let seen;fake.handle=()=>({status:302,json:{}});const r=await H.call(signin,'/api/auth/signin',{body:{email:'a@example.test',password:PW}});assert.equal(r.status,502,'a redirect from the provider is a failure, never followed');assert.equal(H.jar.size,0);
});


test('resend limits report the remaining fixed-window wait without sending another email',async()=>{
 const fake=H.reset(); await register(fake);
 const opts={body:{email:'asha@example.test',returnTo:'/learn'}};
 for(let i=0;i<3;i++) assert.equal((await H.call(resend,'/api/auth/resend',opts)).status,200);
 const before=fake.outbox.length;
 const response=await resend.POST(H.req('/api/auth/resend',opts));
 const data=await response.json();
 assert.equal(response.status,429);
 assert.ok(Number(response.headers.get('Retry-After'))>=1 && Number(response.headers.get('Retry-After'))<=3600);
 assert.match(data.error,/Try again in \d+ minute/);
 assert.equal(fake.outbox.length,before);
});

test('Supabase email quota errors are distinguished from general attempt limits',async()=>{
 H.reset(); const original=global.fetch;
 try {
 global.fetch=async()=>Response.json({code:'over_email_send_rate_limit',msg:'Email rate limit exceeded'},{status:429});
 const result=await H.load('lib/auth/gotrue.ts').resend('asha@example.test','https://whatslearn.example.test/auth/confirm?next=/learn');
 assert.equal(result.code,'rate_limited');
 assert.match(result.message,/email sending limit/i);
 assert.doesNotMatch(result.message,/few minutes/i);
 } finally {global.fetch=original}
});


test('resend reports provider mail delivery failures instead of claiming success',async()=>{
 H.reset(); const previous=global.fetch;
 try {
 global.fetch=async()=>Response.json({code:'unexpected_failure',msg:'Error sending confirmation email'},{status:500});
 for(const [route,url] of [[resend,'/api/auth/resend'],[forgot,'/api/auth/forgot']]){
 const r=await H.call(route,url,{body:url.endsWith('/resend')?{email:'asha@example.test',returnTo:'/learn'}:{email:'asha@example.test'}});
 assert.equal(r.status,502);
 assert.equal(r.json.ok,false);
 assert.match(r.json.error,/email.*send|send.*email/i);
 assert.ok(!r.json.message);
 }
 }finally{global.fetch=previous}
});


test('account recovery navigation uses browser links independent of the client router',()=>{
 const source=fs.readFileSync(path.join(H.ROOT,'components/whatslearn/auth-forms.tsx'),'utf8');
 assert.ok(source.includes('<a href="/signin">Back to sign in</a>'));
 assert.ok(!source.includes("next/link"));
});
