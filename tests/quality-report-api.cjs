const test=require('node:test'),assert=require('node:assert/strict');
const h=require('./helpers/harness.cjs'),q=h.load('lib/quality/store.ts');
let route;try{route=h.load('app/api/quality/reports/route.ts')}catch{route={}}
async function login(){const fake=h.reset(),u={id:crypto.randomUUID(),email:'reporter@example.test',name:'Learner',confirmed:true};fake.users.set(u.email,u);const s=fake.session(u);await h.load('lib/auth/session.ts').setSessionCookies({accessToken:s.access_token,refreshToken:s.refresh_token,expiresIn:s.expires_in,user:{...u,emailConfirmed:true}},true);return u}
test('report API rejects guests and cross-origin writes',async()=>{assert.equal(typeof route.POST,'function');h.reset();assert.equal((await route.POST(h.req('/api/quality/reports',{body:{}}))).status,401);await login();assert.equal((await route.POST(h.req('/api/quality/reports',{body:{},origin:'https://elsewhere.test'}))).status,403)});
test('report preview and submission enforce ownership and keep counters unchanged',async()=>{
 assert.equal(typeof route.GET,'function');const u=await login(),mine=await q.recordReply(u.id,{channel:'web',question:'Test?',answer:'My reply'}),other=await q.recordReply('other',{channel:'web',question:'Private?',answer:'Other reply'});
 const request=id=>new Request('https://whatslearn.example.test/api/quality/reports?reply='+id);
 assert.equal((await route.GET(request(other.id))).status,404);const preview=await route.GET(request(mine.id));assert.equal((await preview.json()).reply.answer,'My reply');
 const payload={replyId:mine.id,reason:'wrong_answer',note:'Please check.',idempotencyKey:'report-api-retry-001'};
 const first=await route.POST(h.req('/api/quality/reports',{body:payload})),again=await route.POST(h.req('/api/quality/reports',{body:payload}));assert.equal(first.status,200);assert.equal((await first.json()).id,(await again.json()).id);
 assert.equal(h.db.prepare('SELECT COUNT(*) n FROM work').get().n,0);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM mission_scores').get().n,0);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM ai_feedback_usage').get().n,0);
 assert.equal((await route.POST(h.req('/api/quality/reports',{body:{...payload,replyId:other.id,idempotencyKey:'report-api-retry-002'}}))).status,404);
 assert.equal((await route.POST(h.req('/api/quality/reports',{body:{...payload,note:'a'.repeat(501)}}))).status,400);
});
