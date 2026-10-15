import {cookies} from 'next/headers';
import {refresh,userFor,type Session} from './gotrue';
/**
 * Login sessions. The provider's access and refresh tokens live in HttpOnly cookies (JavaScript on the page can never read them), Secure on https, SameSite=Lax.
 * Every request that needs an account asks the provider whether the access token is valid (cached for 30 seconds in memory only), and renews it with the refresh token when it has run out.
 * Nothing is trusted from the browser except these two tokens, and the provider decides whether they are good.
 */
export type SessionUser={userId:string;displayName:string;email:string;fullName:string|null};
const AT='wl-at',RT='wl-rt',REFRESH_DAYS=30;
const names=(secure:boolean)=>secure?{at:'__Host-'+AT,rt:'__Host-'+RT}:{at:AT,rt:RT};
const opts=(secure:boolean,maxAge:number)=>({httpOnly:true,secure,sameSite:'lax' as const,path:'/',maxAge});
const cache=new Map<string,{user:SessionUser;until:number}>();
const CACHE_MS=30_000;
async function sha(t:string){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
export const toSessionUser=(u:{id:string;email:string;name:string|null}):SessionUser=>({userId:u.id,displayName:u.name||u.email,email:u.email,fullName:u.name});
export async function setSessionCookies(s:Session,secure:boolean){
 const jar=await cookies();const n=names(secure);
 jar.set(n.at,s.accessToken,opts(secure,s.expiresIn));jar.set(n.rt,s.refreshToken,opts(secure,REFRESH_DAYS*86400));
}
export async function clearSessionCookies(){
 const jar=await cookies();for(const secure of [true,false]){const n=names(secure);for(const k of [n.at,n.rt])jar.set(k,'',{httpOnly:true,secure,sameSite:'lax',path:'/',maxAge:0})}
}
function readTokens(jar:Awaited<ReturnType<typeof cookies>>){
 for(const secure of [true,false]){const n=names(secure);const at=jar.get(n.at)?.value,rt=jar.get(n.rt)?.value;if(at||rt)return {at,rt,secure}}
 return {at:undefined,rt:undefined,secure:true};
}
export async function accessTokenOnly(){const t=readTokens(await cookies());return t.at||null}
/** The signed-in learner for this request, or null. */
export async function currentEmailUser(secureHint?:boolean):Promise<SessionUser|null>{
 const jar=await cookies();const {at,rt,secure}=readTokens(jar);
 if(at){
  const key=await sha(at);const hit=cache.get(key);if(hit&&hit.until>Date.now())return hit.user;
  const r=await userFor(at);
  if(r.ok){const user=toSessionUser(r.data);if(cache.size>500)cache.clear();cache.set(key,{user,until:Date.now()+CACHE_MS});return user}
  if(r.code==='network'||r.code==='rate_limited'||r.code==='unknown')return null;
 }
 if(!rt)return null;
 const renewed=await refresh(rt);
 if(!renewed.ok){try{await clearSessionCookies()}catch{}return null}
 // Cookies can only be changed from a route handler; on a page render the learner is still recognised and the next API call stores the new tokens.
 try{await setSessionCookies(renewed.data,secureHint??secure)}catch{}
 return toSessionUser(renewed.data.user);
}
export async function forgetToken(at:string|null){if(at)cache.delete(await sha(at))}
