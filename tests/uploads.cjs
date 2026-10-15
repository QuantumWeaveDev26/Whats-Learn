// Optional private file uploads: off by default, type decided from the file's bytes, size and count limits, owner-only download as an attachment, deletion, and no AI-review claim.
// Run: node --test tests/uploads.cjs
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const H=require('./helpers/harness.cjs');
const U=H.load('lib/uploads.ts'),route=H.load('app/api/uploads/route.ts'),one=H.load('app/api/uploads/[id]/route.ts'),D=H.load('lib/account-delete.ts'),M=H.load('lib/missions.ts');
const png=n=>{const b=new Uint8Array(Math.max(n,16));b.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);return b};
const pdf=n=>{const b=new Uint8Array(Math.max(n,16));b.set([0x25,0x50,0x44,0x46,0x2d]);return b};
const mp4=n=>{const b=new Uint8Array(Math.max(n,16));b.set([0,0,0,0x18,0x66,0x74,0x79,0x70]);return b};
const host=(id)=>H.setHeaders(new Headers({'oai-authenticated-user-id':id,'oai-authenticated-user-email':id+'@example.test'}));
const bucket=()=>{const b=new H.FakeBucket();return b};
const on=()=>{H.reset({noProvider:true});H.env.UPLOADS_ENABLED='true';H.env.BUCKET=bucket()};
const m1=M.missions[0].id;
const post=(user,mission,name,bytes,origin)=>{host(user);const f=new FormData();f.set('mission',mission);f.set('file',new File([bytes],name));return route.POST(new Request('https://whatslearn.example.test/api/uploads',{method:'POST',headers:origin===null?{}:{origin:origin||'https://whatslearn.example.test'},body:f}))};
test('uploads are OFF unless the setting is true AND a bucket is bound',async()=>{
 H.reset({noProvider:true});assert.equal(U.uploadsEnabled(),false);
 H.env.UPLOADS_ENABLED='true';assert.equal(U.uploadsEnabled(),false,'setting without a bucket');
 H.reset({noProvider:true});H.env.BUCKET=bucket();assert.equal(U.uploadsEnabled(),false,'bucket without the setting');
 host('a');const r=await post('a',m1,'x.png',png(100));assert.equal(r.status,503);const g=await (await route.GET(new Request('https://whatslearn.example.test/api/uploads'))).json();assert.equal(g.enabled,false);
});
test('the real type comes from the bytes: executables, scripts, HTML and disguised files are refused',async()=>{
 on();
 for(const [name,bytes] of [['evil.png',new TextEncoder().encode('<html><script>alert(1)</script></html>')],['run.exe',new Uint8Array([0x4d,0x5a,...new Array(40).fill(1)])],['x.svg',new TextEncoder().encode('<svg onload=alert(1)></svg>')],['a.png',new Uint8Array(0)],['z.zip',new Uint8Array([0x50,0x4b,3,4,...new Array(30).fill(0)])]]){
  const r=await post('a',m1,name,bytes);assert.ok([413,415].includes(r.status),name+' '+r.status)}
 assert.equal(H.db.prepare('SELECT COUNT(*) n FROM uploads').get().n,0);
 const ok=await post('a',m1,'../../etc/pa ss<wd>.png',png(100));assert.equal(ok.status,200);const f=(await ok.json()).file;assert.equal(f.mime,'image/png');assert.ok(!/[\/<>]/.test(f.name),'the name is cleaned: '+f.name);
 const lie=await post('a',M.missions[1].id,'photo.pdf',png(50));assert.equal((await lie.json()).file.mime,'image/png','a wrong extension does not change the detected type');
});
test('size limits per kind, files per mission and per account, and simultaneous uploads',async()=>{
 on();assert.equal((await post('a',m1,'big.png',png(5*1024**2+1))).status,413);assert.equal((await post('a',m1,'ok.png',png(5*1024**2))).status,200);
 assert.equal((await post('a',m1,'doc.pdf',pdf(10*1024**2+1))).status,413);assert.equal((await post('a',m1,'clip.mp4',mp4(25*1024**2+1))).status,413);assert.equal((await post('a',m1,'clip.mp4',mp4(2000))).status,200);
 assert.equal((await post('a',m1,'doc.pdf',pdf(2000))).status,200);const fourth=await post('a',m1,'more.png',png(100));assert.equal(fourth.status,409);assert.match((await fourth.json()).error,/up to 3 files/);
 on();const rs=await Promise.all([1,2,3,4,5,6].map(i=>post('b',m1,`f${i}.png`,png(100))));assert.equal(rs.filter(r=>r.status===200).length,3,'simultaneous uploads cannot pass the limit');
 assert.equal(H.db.prepare("SELECT COUNT(*) n FROM uploads WHERE user_id='b'").get().n,3);
 assert.equal((await post('a','nope',  'x.png',png(100))).status,400);
});
test('storage failure leaves no orphan record',async()=>{
 on();H.env.BUCKET.put=async()=>{throw new Error('down')};const r=await post('a',m1,'x.png',png(100));assert.equal(r.status,503);assert.equal(H.db.prepare('SELECT COUNT(*) n FROM uploads').get().n,0);
});
test('private: only the owner can list, download or delete; downloads are attachments that cannot run',async()=>{
 on();const f=(await (await post('a',m1,'mine.png',png(100))).json()).file;
 host('a');const get=await one.GET(new Request('https://x.test'),{params:Promise.resolve({id:f.id})});assert.equal(get.status,200);
 assert.match(get.headers.get('content-disposition'),/^attachment/);assert.equal(get.headers.get('x-content-type-options'),'nosniff');assert.match(get.headers.get('cache-control'),/private/);assert.match(get.headers.get('content-security-policy'),/sandbox/);assert.equal(get.headers.get('content-type'),'image/png');
 host('b');assert.equal((await one.GET(new Request('https://x.test'),{params:Promise.resolve({id:f.id})})).status,404,'another account sees nothing');
 const del=await one.DELETE(new Request('https://whatslearn.example.test/x',{method:'DELETE',headers:{origin:'https://whatslearn.example.test'}}),{params:Promise.resolve({id:f.id})});assert.equal(del.status,404);assert.equal(H.db.prepare('SELECT COUNT(*) n FROM uploads').get().n,1);
 const list=await (await route.GET(new Request('https://whatslearn.example.test/api/uploads'))).json();assert.deepEqual(list.files,[]);
 H.setHeaders(new Headers());assert.equal((await one.GET(new Request('https://x.test'),{params:Promise.resolve({id:f.id})})).status,401);
 assert.equal((await post('a',m1,'x.png',png(10),'https://evil.example')).status,403);
 host('a');assert.equal((await one.DELETE(new Request('https://x.test/x',{method:'DELETE'}),{params:Promise.resolve({id:f.id})})).status,403,'delete needs a same-site request');
 const own=await one.DELETE(new Request('https://whatslearn.example.test/x',{method:'DELETE',headers:{origin:'https://whatslearn.example.test'}}),{params:Promise.resolve({id:f.id})});assert.equal(own.status,200);
 assert.equal(H.db.prepare('SELECT COUNT(*) n FROM uploads').get().n,0);assert.equal(H.env.BUCKET.map.size,0,'the stored file is removed too');
 assert.equal((await one.GET(new Request('https://x.test'),{params:Promise.resolve({id:'../../x'})})).status,404);
});
test('deleting an account removes its files; a file that cannot be removed stops the deletion',async()=>{
 on();await post('a',m1,'x.png',png(100));await post('b',m1,'y.png',png(100));assert.equal(H.env.BUCKET.map.size,2);
 const realDelete=H.env.BUCKET.delete.bind(H.env.BUCKET);H.env.BUCKET.delete=async()=>{throw new Error('down')};
 await assert.rejects(()=>D.deleteAccountData('a'));assert.equal(H.db.prepare("SELECT COUNT(*) n FROM uploads WHERE user_id='a'").get().n,1,'nothing was lost track of');
 H.env.BUCKET.delete=realDelete;await D.deleteAccountData('a');assert.equal(H.env.BUCKET.map.size,1);assert.ok([...H.env.BUCKET.map.keys()][0].startsWith('u/b/'),"the other learner's file is untouched");
});
test('the interface promises only what is true: private, not AI-reviewed, rules shown, hidden when off',()=>{
 assert.match(U.uploadRules,/not reviewed by AI/);assert.match(U.uploadRules,/delete/i);assert.match(U.uploadRules,/5 MB/);
 const c=fs.readFileSync(path.join(H.ROOT,'components/whatslearn/upload-control.tsx'),'utf8');assert.match(c,/enabled/);assert.doesNotMatch(c,/AI (reviewed|feedback on your file)/i);
 const cfg=fs.readFileSync(path.join(H.ROOT,'.vinext/../vite.config.ts'),'utf8');assert.match(cfg,/r2|BUCKET/i);
});
