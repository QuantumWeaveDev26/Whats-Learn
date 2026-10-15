import {sameOrigin} from '@/lib/storage';
import {safeReturnTo} from '@/lib/return-to';
import {allow,clientAddress} from './limits';
import {messages,type AuthErrorCode,type Failure} from './gotrue';
import {emailAuthConfigured} from './config';
import {z} from 'zod';
/** Shared checks for the account routes: same-site POST only, small JSON bodies, provider configured, attempt limits, and answers that never echo secrets. */
export const noStore={'Cache-Control':'private, no-store'};
export const reply=(body:unknown,status=200,extra:Record<string,string>={})=>Response.json(body,{status,headers:{...noStore,...extra}});
export const failure=(f:{code:AuthErrorCode|string;message?:string;status?:number},status?:number)=>reply({ok:false,code:f.code,error:f.message||messages[f.code as AuthErrorCode]||messages.unknown},status??f.status??400);
export async function readBody<T extends z.ZodTypeAny>(request:Request,schema:T):Promise<{ok:true;data:z.infer<T>}|{ok:false;res:Response}>{
 if(!sameOrigin(request))return {ok:false,res:failure({code:'forbidden',message:'This request did not come from this site.'},403)};
 if(!emailAuthConfigured())return {ok:false,res:failure({code:'not_configured'},503)};
 if(Number(request.headers.get('content-length')||0)>4000)return {ok:false,res:failure({code:'invalid_input',message:'That request is too large.'},413)};
 let raw:unknown;try{raw=await request.json()}catch{return {ok:false,res:failure({code:'invalid_input'},400)}}
 const parsed=schema.safeParse(raw);if(!parsed.success)return {ok:false,res:failure({code:'invalid_input',message:parsed.error.issues[0]?.message||messages.invalid_input},400)};
 return {ok:true,data:parsed.data};
}
/** Returns a 429 response when this address or this email has used up its attempts, otherwise null. Fails closed if the database cannot be reached. */
export async function limited(request:Request,kind:string,email:string|null,perAddress:number,perEmail:number,windowSeconds:number){
 try{
  const now=Date.now(),retryAfterSeconds=windowSeconds-Math.floor(now/1000)%windowSeconds;
  const minutes=Math.ceil(retryAfterSeconds/60);
  const blocked=()=>reply({ok:false,code:'rate_limited',error:`Too many attempts. Try again in ${minutes} minute${minutes===1?'':'s'}.`,retryAfterSeconds},429,{'Retry-After':String(retryAfterSeconds)});
  if(!(await allow(kind+'-ip',clientAddress(request),perAddress,windowSeconds,now)))return blocked();
  if(email&&!(await allow(kind+'-email',email,perEmail,windowSeconds,now)))return blocked();
  return null;
 }catch{return failure({code:'unknown',message:'We could not check this request. Please try again in a moment.'},503)}
}
export const email=z.string().trim().toLowerCase().email('Enter a valid email address.').max(254,'That email address is too long.');
/** Provider-side rules still apply; this is the minimum we ask for so the learner gets a clear message first. */
export const newPassword=z.string().min(10,'Use at least 10 characters.').max(72,'Use at most 72 characters.');
export const returnTo=z.string().max(500).optional().transform(v=>safeReturnTo(v,'/learn'));
export const secureRequest=(request:Request)=>new URL(request.url).protocol==='https:';
export type {Failure};
