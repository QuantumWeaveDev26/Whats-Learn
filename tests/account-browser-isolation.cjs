const test=require('node:test'),assert=require('node:assert/strict');
const h=require('./helpers/harness.cjs');
const agency=h.load('lib/agency-story.ts'),bridge=h.load('lib/starter-bridge.ts');
test('signed-in starter copies never merge into another account or the guest portfolio',()=>{
 const data=new Map();global.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
 agency.saveAgencyDraft('development',{body:'Synthetic A private project notes.',choice:0,language:'en',updatedAt:new Date().toISOString()},'account:a');
 assert.equal(bridge.starterPieces('account:a').length,1);
 assert.deepEqual(bridge.starterPieces('account:b'),[]);assert.deepEqual(bridge.starterPieces('guest'),[]);
 data.set('whatslearn-agency-warmups-v1',JSON.stringify({marketing:{body:'Legacy device starter text.',choice:0,language:'en',updatedAt:new Date().toISOString()}}));
 assert.equal(bridge.starterPieces('guest').length,1);assert.equal(bridge.starterPieces('account:b').length,0);
});
test('sync notifies verified sign-out and rechecks identity after later focus',async()=>{
 const events={},timers=new Map();let seq=0,calls=0,lost=0,changed=[];
 const old={fetch:global.fetch,setTimeout:global.setTimeout,clearTimeout:global.clearTimeout,document:global.document,window:global.window};
 global.document={visibilityState:'visible',addEventListener:(n,f)=>events[n]=f,removeEventListener(){}};global.window={addEventListener:(n,f)=>events[n]=f,removeEventListener(){}};
 Object.defineProperty(global,'navigator',{configurable:true,value:{onLine:true}});
 global.setTimeout=f=>{timers.set(++seq,f);return seq};global.clearTimeout=id=>timers.delete(id);
 const responses=[Response.json({revision:'a',accountKey:'a'}),new Response('',{status:401}),Response.json({revision:'b',accountKey:'b'})];
 global.fetch=async()=>{calls++;return responses.shift()};
 const tick=()=>new Promise(r=>setImmediate(r));
 const stop=h.load('lib/saved-progress-sync.ts').startSavedProgressSync(()=>{},()=>lost++,key=>changed.push(key),'a');
 try{await tick();await events.focus();await tick();assert.equal(lost,1);await events.focus();await tick();assert.equal(calls,3);assert.deepEqual(changed,['b']);}finally{stop();Object.assign(global,old)}
});
test('an old tab cannot save work or profile into a different signed-in account',async()=>{
 const fake=h.reset(),u={id:crypto.randomUUID(),email:'new-account@example.test',name:'B',confirmed:true};fake.users.set(u.email,u);const s=fake.session(u);
 await h.load('lib/auth/session.ts').setSessionCookies({accessToken:s.access_token,refreshToken:s.refresh_token,expiresIn:s.expires_in,user:{...u,emailConfirmed:true}},true);
 const headers={'x-whatslearn-account':'a-stale-account-key'};
 const profile=await h.load('app/api/profile/route.ts').POST(h.req('/api/profile',{headers,body:{...h.load('lib/personalization.ts').defaultProfile,name:'Old account name'}}));
 assert.equal(profile.status,409);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM learner_profiles WHERE user_id=?').get(u.id).n,0);
 const work=await h.load('app/api/work/route.ts').POST(h.req('/api/work',{headers,body:{missionId:'m1',body:'Old account practical draft should never be posted as B.',quiz:0,checks:[true,true,true,true,true]}}));assert.equal(work.status,409);
});
