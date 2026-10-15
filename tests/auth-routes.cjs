// Sign-in and sign-out routes: no path ends at a 404, return_to is safe, protected endpoints refuse signed-out calls, and no fake local login exists.
// No network, no real keys. Run: node --test tests/auth-routes.cjs
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const root=path.resolve(__dirname,'..');let user=null;
const original=Module._load;Module._load=function(name,parent,isMain){if(name==='@/app/chatgpt-auth')return {getChatGPTUser:async()=>user,requireChatGPTUser:async()=>{if(!user)throw new Error('redirect')}};if(name==='cloudflare:workers')return {env:{}};if(name.startsWith('@/'))name=path.resolve(root,name.slice(2));return original.call(this,name,parent,isMain)};
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,f);
const R=require('../lib/return-to.ts');
const walk=(d,out=[])=>{for(const e of fs.readdirSync(path.join(root,d),{withFileTypes:true})){const p=d+'/'+e.name;if(e.isDirectory())walk(p,out);else out.push(p)}return out};
const routeExists=p=>{const clean=p.split(/[?#]/)[0].replace(/\/+$/,'')||'/';if(clean==='/')return true;const dir=path.join(root,'app',clean);return ['page.tsx','route.ts'].some(f=>fs.existsSync(path.join(dir,f)))};

test('return_to only ever leads somewhere inside this site, and never loops through the sign-in pages',()=>{
 assert.equal(R.safeReturnTo('/learn?mission=m3'),'/learn?mission=m3');assert.equal(R.safeReturnTo('/membership'),'/membership');
 for(const bad of ['https://evil.example/x','//evil.example','/\\evil.example','\\\\evil','javascript:alert(1)','','   ',null,undefined,'/signin','/signout','/signin-with-chatgpt','/signout-with-chatgpt?x=1','/callback','/learn\r\nSet-Cookie:x=1','learn','/a\u0000b'])assert.equal(R.safeReturnTo(bad),'/learn',JSON.stringify(bad));
 assert.equal(R.safeReturnTo('//x','/'),'/');
 assert.equal(R.signInHref('/learn?mission=m3'),'/signin?return_to=%2Flearn%3Fmission%3Dm3');assert.equal(R.signOutHref('/learn'),'/signout?return_to=%2Flearn');assert.equal(R.signOutHref(),'/signout?return_to=%2F');
 assert.equal(R.signInHref('https://evil.example'),'/signin?return_to=%2Flearn','an outside address is replaced');
 assert.equal(R.hostSignInHref('/learn'),'/signin-with-chatgpt?return_to=%2Flearn');
});
test('every sign-in and sign-out link in the app goes through the WhatsLearn pages, not straight to host paths that can 404',()=>{
 const files=[...walk('app'),...walk('components'),...walk('lib')].filter(f=>/\.(tsx?)$/.test(f));const offenders=[];
 for(const f of files){if(['app/chatgpt-auth.ts','lib/return-to.ts','components/whatslearn/host-sign-in.tsx'].includes(f))continue;const t=fs.readFileSync(path.join(root,f),'utf8');if(/signin-with-chatgpt|signout-with-chatgpt/.test(t))offenders.push(f)}
 assert.deepEqual(offenders,[],'only the auth helper, the host constants and the sign-in page may name the host paths');
});
test('every sign-in alias leads to a page that exists, keeps the query, and none is a 404',async()=>{
 assert.ok(Object.keys(R.authAliases).length>=9);
 for(const [from,to] of Object.entries(R.authAliases)){
  assert.ok(routeExists(to),from+' -> '+to+' exists');assert.ok(routeExists(from),from+' has a route');
  const mod=require(path.join(root,'app',from.slice(1),'route.ts'));const res=await mod.GET(new Request('https://whatslearn.in'+from+'?return_to=%2Flearn'));
  assert.equal(res.status,307,from);assert.equal(res.headers.get('location'),to+'?return_to=%2Flearn',from);
 }
 for(const p of ['/signin','/signout','/signup','/learn','/settings','/membership'])assert.ok(routeExists(p),p);
});
test('the 404 page is helpful and links only to pages that exist',()=>{
 const t=fs.readFileSync(path.join(root,'app/not-found.tsx'),'utf8');assert.match(t,/signInHref|\/signin/);assert.match(t,/\/learn/);
 for(const m of t.matchAll(/href="(\/[^"]*)"/g))assert.ok(routeExists(m[1]),m[1]);
});
test('no internal link in the app points at a page that does not exist',()=>{
 const bad=[];for(const f of [...walk('app'),...walk('components')].filter(f=>/\.tsx$/.test(f))){
  for(const m of fs.readFileSync(path.join(root,f),'utf8').matchAll(/(?:href|redirect\()\s*=?\s*[{(]?\s*["'`](\/[A-Za-z0-9\-_/]*)(?:[?#"'`]|$)/g)){const p=m[1];if(p==='/'||p.startsWith('/api')||p.startsWith('/_'))continue;if(!routeExists(p))bad.push(f+' '+p)}}
 assert.deepEqual(bad,[],'links to missing pages');
});
test('signed-out visitors cannot read or change account data, and get a clear message, not a 404 or a crash',async()=>{
 user=null;const req=(m,b)=>new Request('https://whatslearn.in/api/x',{method:m,headers:{origin:'https://whatslearn.in','Content-Type':'application/json'},body:b?JSON.stringify(b):undefined});
 const work=require('../app/api/work/route.ts'),clues=require('../app/api/clues/route.ts');
 const g=await work.GET();assert.equal(g.status,401);assert.match((await g.json()).error,/Sign in/);
 const p=await work.POST(req('POST',{missionId:'m1',body:'x',checks:[],quiz:0}));assert.equal(p.status,401);
 const c=await clues.POST(req('POST',{missionId:'m1',clue:'hint'}));assert.equal(c.status,401);
});
test('the sign-in page handles the host honestly: already signed in, host sign-in present, host sign-in missing',()=>{
 const t=fs.readFileSync(path.join(root,'components/whatslearn/host-sign-in.tsx'),'utf8');
 assert.match(t,/\/api\/session/,'checks whether you are already signed in');assert.match(t,/redirect:\s*'manual'/,'probes the host path without following it');
 assert.match(t,/opaqueredirect/);assert.match(t,/sign-in-hosting\.md/);assert.match(t,/guest/i,'offers the guest path when the host has no sign-in');
 assert.match(t,/safeReturnTo/,'the return target is sanitised');assert.ok(!/<input|type=["']password["']/.test(t),'no password form');
});
test('nothing fakes a login: no password hashing or local credential store; password fields exist only in the managed-provider forms',()=>{
 const bad=[];for(const f of [...walk('app'),...walk('components'),...walk('lib')].filter(f=>/\.tsx?$/.test(f))){const t=fs.readFileSync(path.join(root,f),'utf8');if(/type=["']password["']|bcrypt|scrypt|pbkdf2|argon2|createHash\(['"]sha(1|256)['"]\)\.update\([^)]*password/i.test(t))bad.push(f)}
 assert.deepEqual(bad,['components/whatslearn/auth-forms.tsx'],'password inputs live only in auth-forms.tsx, which pages render only when emailAuthConfigured()');
 const d=fs.readFileSync(path.join(root,'docs/sign-in-hosting.md'),'utf8');assert.match(d,/cannot be added on the Sites host/);assert.match(d,/Which sign-in works where/);
 // The loopback test login is still loopback-only.
 const lp=fs.readFileSync(path.join(root,'scripts/local-preview.mjs'),'utf8');assert.match(lp,/127\.0\.0\.1|loopback/);
});
test('reserved sign-in paths are never used as a return target by protected pages',()=>{
 const t=fs.readFileSync(path.join(root,'app/chatgpt-auth.ts'),'utf8');assert.match(t,/SIGN_IN_PATH\s*=\s*['"]\/signin['"]/);assert.match(t,/isReservedAuthPath/);
});
