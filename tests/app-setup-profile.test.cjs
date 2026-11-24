
const test=require('node:test');
const assert=require('node:assert/strict');
const {load,hooks}=require('./helpers/client-components.cjs');
const origin='https://whatslearn.in';
const storage={sameOrigin:r=>r.headers.get('origin')===origin};
const json=(path,body,key='a',method='POST')=>new Request(origin+path,{method,headers:{origin,'content-type':'application/json','x-whatslearn-account':key},body:body===undefined?undefined:JSON.stringify(body)});

test('app onboarding requires every answer except the explicitly optional nickname',async()=>{
 const saved=[];
 const {POST}=load('app/app/context/route.ts',hooks(),{
  '@/lib/storage':storage,
  '@/app/api/learner-context/route':{POST:async request=>{saved.push(await request.json());return Response.json({saved:true})}},
 });
 const answers={ageBand:'18-24',name:'Learner',stage:'student',hobbies:['music'],interests:['technology'],project:'A reading app',barrier:'time',device:'phone'};
 for(const field of Object.keys(answers)){
  const incomplete={...answers};delete incomplete[field];
  assert.equal((await POST(json('/app/context',{answers:incomplete}))).status,400,field);
 }
 assert.equal((await POST(json('/app/context',{answers:{...answers,name:'   '}}))).status,400);
 assert.equal((await POST(json('/app/context',{answers:{...answers,hobbies:[]}}))).status,400);
 assert.equal((await POST(json('/app/context',{answers}))).status,200);
 assert.deepEqual(saved,[{answers}]);
 assert.equal((await POST(json('/app/context',{answers:{ageBand:'under-18'}}))).status,200);
 assert.deepEqual(saved.at(-1),{answers:{ageBand:'under-18'}});
});

test('app profile photos require their owner and support replacement and removal',async()=>{
 const photos=new Map();
 let user='a';
 const {GET,POST,DELETE}=load('app/app/avatar/route.ts',hooks(),{
  '@/app/chatgpt-auth':{getChatGPTUser:async()=>user?{userId:user}:null},
  '@/lib/auth/account-key':{accountKey:id=>id},
  '@/lib/learning-session':{readSession:async id=>photos.get(id),writeSession:async(id,key,photo)=>photos.set(id,photo)},
  '@/lib/storage':{...storage,database:()=>({prepare:()=>({bind:id=>({run:async()=>photos.delete(id)})})})},
 });
 const photo='data:image/jpeg;base64,'+Buffer.from('ffd8ffc0000b080100010001011100ffd9','hex').toString('base64');
 const bad='data:image/jpeg;base64,'+Buffer.from('ffd8ffc0000b080110010001011100ffd9','hex').toString('base64');
 assert.equal((await POST(json('/app/avatar',{photo:bad}))).status,400);
 assert.equal((await POST(json('/app/avatar',{photo:'data:image/svg+xml,<svg/>'}))).status,400);
 assert.equal((await POST(json('/app/avatar',{photo},'wrong'))).status,409);
 assert.equal((await POST(json('/app/avatar',{photo}))).status,200);
 assert.deepEqual(await (await GET(json('/app/avatar',undefined,'a','GET'))).json(),{photo});
 user='b';
 assert.equal((await GET(json('/app/avatar',undefined,'a','GET'))).status,409);
 assert.deepEqual(await (await GET(json('/app/avatar',undefined,'b','GET'))).json(),{photo:null});
 user='a';
 assert.equal((await DELETE(json('/app/avatar',undefined,'a','DELETE'))).status,200);
 assert.deepEqual(await (await GET(json('/app/avatar',undefined,'a','GET'))).json(),{photo:null});
 user='';
 assert.equal((await GET(json('/app/avatar',undefined,'a','GET'))).status,401);
});
test('profile only offers Add profile photo when account storage confirms no photo',()=>{
 const {find,text}=require('./helpers/client-components.cjs');
 const h=hooks(),{Me}=load('components/whatslearn-app/tabs.tsx',h);
 const props={signedIn:true,s:{name:'Learner',paidAccess:false,work:[],points:null,profile:null}};
 for(const [src,ready,loadFailed,add] of [[null,false,false,false],[null,false,true,false],[null,true,false,true],['data:image/jpeg;base64,test',true,false,false]]){
  h.start();
  const view=Me({...props,avatar:{src,ready,loadFailed,busy:false,message:'',update(){},retry(){}}});
  assert.equal(text(view).includes('Add profile photo'),add);
  assert.equal(!!find(view,node=>node.props?.className==='wla-profile-plus'),add);
 }
});
