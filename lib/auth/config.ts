import {env} from 'cloudflare:workers';
/**
 * Settings for email and password accounts. Accounts are handled by a managed provider (Supabase Auth); this app never stores or sees a password after handing it to the provider.
 *   SUPABASE_URL                 the project address, https://<project>.supabase.co (an http address is accepted only for this computer: 127.0.0.1 or localhost)
 *   SUPABASE_PUBLISHABLE_KEY     the project's public (anon / publishable) key. It is meant to be public, but is still kept in server settings.
 *   SUPABASE_SERVICE_ROLE_KEY    optional secret. Only used to delete a learner's login when they delete their account. Never sent to the browser.
 *   SITE_URL                     the public address of this site, used in the links inside emails
 * When SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are both set, the site is in "email" mode: email and password accounts work and the host's ChatGPT sign-in headers are ignored.
 * When they are not set, the site is in "host" mode: the only sign-in is the host's own (Sign in with ChatGPT on OpenAI Sites).
 */
const raw=()=>env as unknown as Record<string,string|undefined>;
const clean=(v:string|undefined)=>(v??'').trim();
const LOOPBACK=new Set(['127.0.0.1','localhost','[::1]']);
export function providerUrl():string|null{
 const v=clean(raw().SUPABASE_URL);if(!v)return null;
 try{const u=new URL(v);if(u.protocol==='https:'||(u.protocol==='http:'&&LOOPBACK.has(u.hostname)))return u.origin}catch{}
 return null;
}
export const providerKey=()=>clean(raw().SUPABASE_PUBLISHABLE_KEY)||null;
export const serviceKey=()=>clean(raw().SUPABASE_SERVICE_ROLE_KEY)||null;
export const emailAuthConfigured=()=>!!providerUrl()&&!!providerKey();
export type AuthMode='email'|'host';
export const authMode=():AuthMode=>emailAuthConfigured()?'email':'host';
/** The address used inside emailed links. SITE_URL when set; otherwise the request's own address, but only on this computer. */
export function siteOrigin(request:Request):string|null{
 const v=clean(raw().SITE_URL);
 if(v){try{const u=new URL(v);if(u.protocol==='https:'||(u.protocol==='http:'&&LOOPBACK.has(u.hostname)))return u.origin}catch{}return null}
 const u=new URL(request.url);return LOOPBACK.has(u.hostname)?u.origin:null;
}
