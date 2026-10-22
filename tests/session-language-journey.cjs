const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const h=require('./helpers/harness.cjs');
async function login(){const fake=h.reset();const u={id:crypto.randomUUID(),email:'learner@example.test',name:'Learner',confirmed:true};fake.users.set(u.email,u);const s=fake.session(u);await h.load('lib/auth/session.ts').setSessionCookies({accessToken:s.access_token,refreshToken:s.refresh_token,expiresIn:s.expires_in,user:{...u,emailConfirmed:true}},true);h.jar.delete('__Host-wl-at');return {fake,u,s};}

test('parallel requests renew one expired session without signing out another section',async()=>{
 const {fake,u}=await login();const current=h.load('lib/auth/session.ts').currentEmailUser;
 const users=await Promise.all(Array.from({length:6},()=>current()));
 assert.ok(users.every(x=>x?.userId===u.id));assert.equal(fake.calls.filter(c=>c.query?.grant_type==='refresh_token').length,1);assert.ok(h.jar.get('__Host-wl-rt'));
});
test('a temporary refresh failure preserves cookies and reports unavailable, not signed out',async()=>{
 const {fake,u}=await login();fake.down=true;const before=h.jar.get('__Host-wl-rt').value;
 const response=await h.load('app/api/session/route.ts').GET();assert.equal(response.status,503);assert.equal(h.jar.get('__Host-wl-rt')?.value,before);
 fake.down=false;assert.equal((await h.load('lib/auth/session.ts').currentEmailUser())?.userId,u.id);
});
test('a page unable to set cookies can hand its renewed session to the next route',async()=>{
 const {fake,u}=await login();const setter=h.cookieApi.set;h.cookieApi.set=()=>{throw Error('render is read only')};
 try{assert.equal((await h.load('lib/auth/session.ts').currentEmailUser())?.userId,u.id)}finally{h.cookieApi.set=setter}
 assert.equal((await h.load('lib/auth/session.ts').currentEmailUser())?.userId,u.id);assert.equal(fake.calls.filter(c=>c.query?.grant_type==='refresh_token').length,1);
});
test('protected account sections share a renewal and confirmed revocation still signs out',async()=>{
 const {fake}=await login();const routes=['app/api/session/route.ts','app/api/profile/route.ts','app/api/work/route.ts','app/api/play/route.ts'];
 const responses=await Promise.all(routes.map(p=>h.load(p).GET()));assert.ok(responses.every(r=>r.status===200));assert.equal(fake.calls.filter(c=>c.query?.grant_type==='refresh_token').length,1);
 await h.load('lib/auth/session.ts').clearSessionCookies();h.jar.set('__Host-wl-rt',{value:'rt_invalid'});assert.equal(await h.load('lib/auth/session.ts').currentEmailUser(),null);assert.equal(h.jar.size,0);
});
test('provider rate limits do not remove the login cookie',async()=>{
 const {fake}=await login();const before=h.jar.get('__Host-wl-rt').value;fake.rateLimited=true;
 assert.equal((await h.load('app/api/session/route.ts').GET()).status,503);assert.equal(h.jar.get('__Host-wl-rt').value,before);
});
test('sign-out invalidates the short refresh handoff as well as the browser cookies',async()=>{
 const {s}=await login();await h.load('lib/auth/session.ts').currentEmailUser();
 const r=await h.load('app/api/auth/signout/route.ts').POST(h.req('/api/auth/signout',{body:{}}));assert.equal(r.status,200);
 h.jar.set('__Host-wl-rt',{value:s.refresh_token});assert.equal(await h.load('lib/auth/session.ts').currentEmailUser(),null);
});
test('selected English is not overridden by Kannada source text or an old draft',async()=>{
 h.reset({env:{OPENAI_API_KEY:'fake-language'}});const ai=h.load('lib/ai-feedback.ts');assert.equal(ai.feedbackLanguage('en','ನಾನು ಸರ್ವರ್ ಪರೀಕ್ಷೆ ಮಾಡಿ ಫಲಿತಾಂಶ ಬರೆದಿದ್ದೇನೆ'),'English');assert.equal(ai.feedbackLanguage('en','Nanu server test maadide nanna app beku'),'English');
 let calls=0;global.fetch=async(url,o)=>{const request=JSON.parse(o.body);assert.match(request.messages[0].content,/selected language/i);return Response.json({choices:[{message:{content:++calls===1?'Use the server. ನಂತರ సెలెక్ట్ ಮಾಡಿ.':'Wait for the server to confirm the save.'}}]})};
 const out=await ai.answerMentor('What should I do next?','en',{profile:{language:'en'},recentConversation:{answer:'ಹಿಂದಿನ ಉತ್ತರ'}});assert.equal(calls,2);assert.equal(out.answer,'Wait for the server to confirm the save.');
});
test('an old lesson URL cannot override a saved account language',()=>{global.localStorage={getItem:()=> 'kn'};assert.equal(h.load('lib/languages.ts').resolveLearningLanguage('en','kn'),'en')});
test('changing the homepage language updates only language and syncs the linked contact',async()=>{
 const {u}=await login();const p={...h.load('lib/personalization.ts').defaultProfile,track:'filmmaking',language:'kn'};await h.load('lib/learning-service.ts').saveProfile(u.id,p);
 h.db.prepare("INSERT INTO whatsapp_contacts(user_id,phone,state,language,consent_at,updated_at) VALUES (?,?,'opted_in','kn',?,?)").run(u.id,'919990000099',new Date().toISOString(),new Date().toISOString());
 const response=await h.load('app/api/profile/route.ts').PATCH(h.req('/api/profile',{method:'PATCH',body:{language:'en'}}));assert.equal(response.status,200);
 const saved=h.db.prepare('SELECT language,track FROM learner_profiles WHERE user_id=?').get(u.id);assert.deepEqual({...saved},{language:'en',track:'filmmaking'});assert.equal(h.db.prepare('SELECT language FROM whatsapp_contacts WHERE user_id=?').get(u.id).language,'en');
});
test('a first account can save its language before choosing a course',async()=>{const {u}=await login();const r=await h.load('app/api/profile/route.ts').PATCH(h.req('/api/profile',{method:'PATCH',body:{language:'hi'}}));assert.equal(r.status,200);assert.equal(h.db.prepare('SELECT language FROM learner_profiles WHERE user_id=?').get(u.id).language,'hi')});
test('homepage identity is recognised before a course exists, and the picker waits for account load',()=>{const s=fs.readFileSync('components/whatslearn/visual-start.tsx','utf8');assert.ok(s.indexOf('setAccount({name:d.name')<s.indexOf('const work=await fetch'));assert.match(s,/agencyTracks.find\(l=>l.id===d.profile\?\.track\)\|\|agencyTracks\[0\]/);assert.match(s,/disabled=\{!accountReady\}/)});
test('the connected mentor blocks a wrong-script reply instead of delivering it',()=>{
 const compose=new Function('$input','$',fs.readFileSync('n8n/code/wa-compose-connected-reply.js','utf8'));
 const out=compose({all:()=>[{json:{output:'Try this. ನಂತರ సెలెక్ట್ ಮಾಡಿ.'}}]},()=>({all:()=>[{json:{input:'Explain an API',language:'English',material:{profile:{language:'en'}},fallback:'Please retry in English.'}}]}))[0].json.reply;
 assert.equal(out,'Please retry in English.');
});
test('signed-in auth links resume their destination and the WhatsApp handoff explains linking',()=>{
 for(const page of ['signin','signup']){const s=fs.readFileSync(`app/${page}/page.tsx`,'utf8');assert.match(s,/getChatGPTUser/);assert.match(s,/afterSignIn/);}
 const widget=fs.readFileSync('components/whatslearn/whatsapp-mentor-widget.tsx','utf8');assert.match(widget,/Connect WhatsApp/);assert.match(widget,/\[pathname\]/);
 const source=fs.readFileSync('components/whatslearn/whatsapp-optin.tsx','utf8');assert.match(source,/optional/i);assert.match(source,/Keep learning on the website/);
});
