import {providerKey,providerUrl,serviceKey} from './config';
/**
 * Minimal client for the managed provider's email/password API (Supabase Auth, "GoTrue").
 * Passwords are passed straight through over HTTPS in the request body and are never logged, stored, cached or returned.
 * Every call has a time limit; failures become a small set of codes with plain messages that are safe to show.
 */
export type AuthErrorCode='invalid_credentials'|'email_not_confirmed'|'weak_password'|'link_expired'|'rate_limited'|'network'|'not_configured'|'invalid_input'|'forbidden'|'unknown'|'email_delivery_failed';
export type Failure={ok:false;code:AuthErrorCode;message:string;status:number};
export type Ok<T>={ok:true;data:T};
export type Result<T>=Ok<T>|Failure;
export type Session={accessToken:string;refreshToken:string;expiresIn:number;user:ProviderUser};
export type ProviderUser={id:string;email:string;name:string|null;emailConfirmed:boolean;authProvider?:'email'|'google'};
export const messages:Record<AuthErrorCode,string>={
 invalid_credentials:'That email and password do not match. Check them and try again, or reset your password.',
 email_not_confirmed:'Please confirm your email first. We sent you a link; you can ask for a new one below.',
 weak_password:'That password is too weak. Use at least 10 characters that you do not use anywhere else.',
 link_expired:'This link has expired or was already used. Ask for a new one and use it within the hour.',
 rate_limited:'Too many attempts. Please wait a few minutes and try again.',
 network:'We could not reach the sign-in service. Check your connection and try again.',
 not_configured:'Email sign-in is not set up on this site yet.',
 invalid_input:'Please check what you typed and try again.',
 forbidden:'You need to sign in again to do that.',
 email_delivery_failed:'We could not send the email. Please contact the WhatsLearn team so we can check email delivery.',
 unknown:'Something went wrong. Please try again.'};
const fail=(code:AuthErrorCode,status:number,message?:string):Failure=>({ok:false,code,status,message:message??messages[code]});
const TIMEOUT_MS=8000;
type Call={method?:string;path:string;query?:Record<string,string>;body?:unknown;token?:string;admin?:boolean};
async function call(c:Call):Promise<Result<Record<string,unknown>>>{
 const base=providerUrl(),key=providerKey();if(!base||!key)return fail('not_configured',503);
 const url=new URL('/auth/v1/'+c.path,base);for(const [k,v] of Object.entries(c.query||{}))url.searchParams.set(k,v);
 const bearer=c.admin?serviceKey():(c.token??key);if(!bearer)return fail('not_configured',503);
 const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),TIMEOUT_MS);
 try{
  const res=await fetch(url,{method:c.method||'POST',headers:{apikey:key,Authorization:'Bearer '+bearer,'Content-Type':'application/json'},body:c.body===undefined?undefined:JSON.stringify(c.body),signal:ctl.signal,redirect:'manual'});
  // The Workers runtime has no strict-redirect mode. A redirect from the provider is never followed and counts as a failed call.
  if(res.status>=300&&res.status<400)return fail('network',502);
  let data:Record<string,unknown>={};try{const t=await res.text();data=t?JSON.parse(t):{}}catch{}
  if(res.ok)return {ok:true,data};
  return mapError(res.status,data);
 }catch{return fail('network',503)}finally{clearTimeout(timer)}
}
function mapError(status:number,d:Record<string,unknown>):Failure{
 const code=String(d.error_code||d.code||'');const text=String(d.msg||d.message||d.error_description||'').toLowerCase();
 if(code==='email_address_not_authorized'||(status>=500&&(/send.*(?:email|mail)|smtp/.test(text))))return fail('email_delivery_failed',502);
 if(code==='over_email_send_rate_limit')return fail('rate_limited',429,'The email sending limit has been reached. Please try again later, or contact the WhatsLearn team if it keeps happening.');
 if(status===429||code==='over_request_rate_limit')return fail('rate_limited',429);
 if(code==='invalid_credentials'||text.includes('invalid login credentials'))return fail('invalid_credentials',401);
 if(code==='email_not_confirmed'||text.includes('email not confirmed'))return fail('email_not_confirmed',403);
 if(code==='weak_password'||text.includes('password should'))return fail('weak_password',422);
 if(code==='otp_expired'||code==='flow_state_expired'||text.includes('expired')||text.includes('token has expired')||(code==='validation_failed'&&text.includes('token')))return fail('link_expired',400);
 if(status===401||status===403)return fail('forbidden',status);
 if(status>=400&&status<500)return fail('invalid_input',status);
 return fail('unknown',status>=500?502:status);
}
const str=(v:unknown)=>typeof v==='string'?v:'';
function toUser(u:unknown):ProviderUser|null{
 const o=u as Record<string,unknown>|null;if(!o||!str(o.id))return null;
 const meta=(o.user_metadata as Record<string,unknown>|undefined)||{};
 return {id:str(o.id),email:str(o.email).toLowerCase(),name:str(meta.full_name)||str(meta.name)||null,emailConfirmed:!!(o.email_confirmed_at||o.confirmed_at),authProvider:(o.app_metadata as Record<string,unknown>|undefined)?.provider==='google'?'google':'email'};
}
function toSession(d:Record<string,unknown>):Session|null{
 const user=toUser(d.user);if(!user||!str(d.access_token)||!str(d.refresh_token))return null;
 return {accessToken:str(d.access_token),refreshToken:str(d.refresh_token),expiresIn:Math.max(60,Number(d.expires_in)||3600),user};
}
/** Creates the account and makes the provider email a confirmation link. The result never says whether the address was already registered. */
export async function signUp(p:{email:string;password:string;name:string;redirectTo:string}):Promise<Result<{needsConfirmation:true}>>{
 const r=await call({path:'signup',query:{redirect_to:p.redirectTo},body:{email:p.email,password:p.password,data:{full_name:p.name}}});
 return r.ok?{ok:true,data:{needsConfirmation:true}}:r;
}
export async function signIn(email:string,password:string):Promise<Result<Session>>{
 const r=await call({path:'token',query:{grant_type:'password'},body:{email,password}});if(!r.ok)return r;
 const s=toSession(r.data);if(!s)return fail('unknown',502);
 // Never accept an unconfirmed address, even if the provider was set up without email confirmation.
 if(!s.user.emailConfirmed)return fail('email_not_confirmed',403);
 return {ok:true,data:s};
}
export async function refresh(refreshToken:string):Promise<Result<Session>>{
 const r=await call({path:'token',query:{grant_type:'refresh_token'},body:{refresh_token:refreshToken}});if(!r.ok)return r;
 const s=toSession(r.data);return s&&s.user.emailConfirmed?{ok:true,data:s}:fail('forbidden',401);
}
/** Google uses the same provider accounts and session cookies as email sign-in. */
export async function googleEnabled():Promise<Result<boolean>>{const r=await call({method:'GET',path:'settings'});return r.ok?{ok:true,data:(r.data.external as Record<string,unknown>|undefined)?.google===true}:r;}
export async function exchangeGoogleCode(code:string,verifier:string):Promise<Result<Session>>{
 const r=await call({path:'token',query:{grant_type:'pkce'},body:{auth_code:code,code_verifier:verifier}});if(!r.ok)return r;
 const s=toSession(r.data);return s&&s.user.emailConfirmed?{ok:true,data:s}:fail('forbidden',401);
}
/** The provider is the authority on whether an access token is valid right now. */
export async function userFor(accessToken:string):Promise<Result<ProviderUser>>{
 const r=await call({method:'GET',path:'user',token:accessToken});if(!r.ok)return r;
 const u=toUser(r.data);return u&&u.emailConfirmed?{ok:true,data:u}:fail('forbidden',401);
}
export async function recover(email:string,redirectTo:string):Promise<Result<true>>{
 const r=await call({path:'recover',query:{redirect_to:redirectTo},body:{email}});return r.ok?{ok:true,data:true}:r;
}
export async function resend(email:string,redirectTo:string):Promise<Result<true>>{
 const r=await call({path:'resend',query:{redirect_to:redirectTo},body:{type:'signup',email}});return r.ok?{ok:true,data:true}:r;
}
export async function verifyLink(type:'signup'|'recovery'|'email',tokenHash:string):Promise<Result<Session>>{
 const r=await call({path:'verify',body:{type,token_hash:tokenHash}});if(!r.ok)return r;
 const s=toSession(r.data);return s?{ok:true,data:s}:fail('link_expired',400);
}
export async function setPassword(accessToken:string,password:string):Promise<Result<true>>{
 const r=await call({method:'PUT',path:'user',token:accessToken,body:{password}});return r.ok?{ok:true,data:true}:r;
}
export async function signOut(accessToken:string):Promise<Result<true>>{
 const r=await call({path:'logout',token:accessToken});return r.ok?{ok:true,data:true}:r;
}
/** Removes the learner's login at the provider. Needs the optional service key; without it the caller falls back to the support-based process. */
export async function deleteProviderUser(userId:string):Promise<Result<true>>{
 if(!serviceKey())return fail('not_configured',501,'Login removal needs the owner to finish setup.');
 const r=await call({method:'DELETE',path:'admin/users/'+encodeURIComponent(userId),admin:true});return r.ok?{ok:true,data:true}:r;
}
