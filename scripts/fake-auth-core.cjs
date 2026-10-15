/**
 * A stand-in for the managed auth provider's email/password API (Supabase Auth, "GoTrue"), used ONLY for automated tests and for trying the sign-up journey on this computer.
 * It is not a login system for the site: the site talks to a provider only when SUPABASE_URL points at one, and an http address is accepted only for 127.0.0.1/localhost.
 * It keeps users in memory, and "sends" emails by recording them in `outbox`. Passwords here are plain strings because this is a test double that never leaves the test process.
 */
const crypto=require('node:crypto');
const rand=(p)=>p+crypto.randomBytes(18).toString('base64url');
class FakeGoTrue{
 constructor(o={}){this.minPassword=o.minPassword||6;this.serviceKey=o.serviceKey||'svc-test-key';this.publishableKey=o.publishableKey||'pub-test-key';this.now=o.now||(()=>Date.now());this.users=new Map();this.access=new Map();this.refresh=new Map();this.tokens=new Map();this.outbox=[];this.rateLimited=false;this.requireConfirm=o.requireConfirm!==false;this.calls=[]}
 pub(u){return {id:u.id,email:u.email,email_confirmed_at:u.confirmed?new Date(this.now()).toISOString():null,user_metadata:{full_name:u.name}}}
 session(u){const at=rand('at_'),rt=rand('rt_');this.access.set(at,{id:u.id,exp:this.now()+3600e3});this.refresh.set(rt,u.id);return {access_token:at,refresh_token:rt,expires_in:3600,token_type:'bearer',user:this.pub(u)}}
 mail(u,type,redirect){const t=rand('th_');this.tokens.set(t,{id:u.id,type,exp:this.now()+3600e3});this.outbox.push({to:u.email,type,link:redirect+(redirect.includes('?')?'&':'?')+'token_hash='+t+'&type='+type,tokenHash:t})}
 err(status,code,msg){return {status,json:{code:status,error_code:code,msg}}}
 bearer(h){const a=h['authorization']||h['Authorization']||'';return a.replace(/^Bearer\s+/i,'')}
 handle(method,path,query,body,headers={}){
  this.calls.push({method,path,query});
  if(this.rateLimited)return this.err(429,'over_request_rate_limit','Request rate limit reached');
  const apikey=headers['apikey']||headers['Apikey'];if(apikey!==this.publishableKey)return this.err(401,'no_authorization','Invalid API key');
  body=body||{};
  if(path==='signup'&&method==='POST'){
   if(String(body.password||'').length<this.minPassword)return this.err(422,'weak_password','Password should be at least '+this.minPassword+' characters.');
   const email=String(body.email||'').toLowerCase();let u=this.users.get(email);
   if(u){const fake={id:crypto.randomUUID(),email,confirmed:false,name:''};return {status:200,json:this.pub(fake)}}
   u={id:crypto.randomUUID(),email,password:body.password,confirmed:!this.requireConfirm,name:(body.data&&body.data.full_name)||''};this.users.set(email,u);
   if(this.requireConfirm)this.mail(u,'signup',query.redirect_to||'http://site.invalid/');
   return {status:200,json:this.requireConfirm?this.pub(u):this.session(u)};
  }
  if(path==='token'&&method==='POST'&&query.grant_type==='password'){
   const u=this.users.get(String(body.email||'').toLowerCase());
   if(!u||u.password!==body.password)return this.err(400,'invalid_credentials','Invalid login credentials');
   if(!u.confirmed)return this.err(400,'email_not_confirmed','Email not confirmed');
   return {status:200,json:this.session(u)};
  }
  if(path==='token'&&method==='POST'&&query.grant_type==='refresh_token'){
   const id=this.refresh.get(body.refresh_token);if(!id)return this.err(400,'refresh_token_not_found','Invalid Refresh Token');
   this.refresh.delete(body.refresh_token);const u=[...this.users.values()].find(x=>x.id===id);if(!u)return this.err(400,'refresh_token_not_found','Invalid Refresh Token');return {status:200,json:this.session(u)};
  }
  if(path==='user'&&method==='GET'){
   const s=this.access.get(this.bearer(headers));if(!s||s.exp<=this.now())return this.err(401,'bad_jwt','invalid JWT: token is expired or invalid');
   const u=[...this.users.values()].find(x=>x.id===s.id);if(!u)return this.err(403,'user_not_found','User from sub claim in JWT does not exist');return {status:200,json:this.pub(u)};
  }
  if(path==='user'&&method==='PUT'){
   const s=this.access.get(this.bearer(headers));if(!s||s.exp<=this.now())return this.err(401,'bad_jwt','invalid JWT');
   if(String(body.password||'').length<this.minPassword)return this.err(422,'weak_password','Password should be at least '+this.minPassword+' characters.');
   const u=[...this.users.values()].find(x=>x.id===s.id);u.password=body.password;return {status:200,json:this.pub(u)};
  }
  if(path==='recover'&&method==='POST'){const u=this.users.get(String(body.email||'').toLowerCase());if(u&&u.confirmed)this.mail(u,'recovery',query.redirect_to||'http://site.invalid/');return {status:200,json:{}}}
  if(path==='resend'&&method==='POST'){const u=this.users.get(String(body.email||'').toLowerCase());if(u&&!u.confirmed)this.mail(u,'signup',query.redirect_to||'http://site.invalid/');return {status:200,json:{}}}
  if(path==='verify'&&method==='POST'){
   const t=this.tokens.get(body.token_hash);if(!t||t.exp<=this.now()||t.type!==(body.type==='email'?'signup':body.type))return this.err(403,'otp_expired','Email link is invalid or has expired');
   this.tokens.delete(body.token_hash);const u=[...this.users.values()].find(x=>x.id===t.id);u.confirmed=true;return {status:200,json:this.session(u)};
  }
  if(path==='logout'&&method==='POST'){const at=this.bearer(headers);const s=this.access.get(at);if(s){for(const [k,v] of this.access)if(v.id===s.id)this.access.delete(k);for(const [k,v] of this.refresh)if(v===s.id)this.refresh.delete(k)}return {status:204,json:{}}}
  if(path.startsWith('admin/users/')&&method==='DELETE'){
   if(this.bearer(headers)!==this.serviceKey)return this.err(403,'not_admin','User not allowed');
   const id=decodeURIComponent(path.slice('admin/users/'.length));for(const [k,u] of this.users)if(u.id===id){this.users.delete(k);for(const [a,v] of this.access)if(v.id===id)this.access.delete(a);for(const [a,v] of this.refresh)if(v===id)this.refresh.delete(a);return {status:200,json:{}}}
   return this.err(404,'user_not_found','User not found');
  }
  return this.err(404,'not_found','Not found');
 }
 /** A fetch() that answers from this object, for tests. */
 fetch(base,next){return async(url,init={})=>{const u=new URL(String(url));if(!u.href.startsWith(base)){if(next)return next(url,init);throw new TypeError('blocked')}
   if(this.down)throw new TypeError('network down');
   const headers={};for(const [k,v] of Object.entries(init.headers||{}))headers[k.toLowerCase()]=v;
   const q=Object.fromEntries(u.searchParams);const r=this.handle(init.method||'GET',u.pathname.replace('/auth/v1/',''),q,init.body?JSON.parse(init.body):undefined,headers);
   return new Response(r.status===204?null:JSON.stringify(r.json),{status:r.status,headers:{'Content-Type':'application/json'}})}}
}
module.exports={FakeGoTrue};
