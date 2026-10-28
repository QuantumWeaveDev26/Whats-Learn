'use client';
/** Thin client for the website's own APIs, so the app shares accounts, progress, points and AI review with whatslearn.in. */
export type Json=Record<string,unknown>;
export type ApiResult<T=Json>={ok:boolean;status:number;data:T&{error?:string}};
let account='';
export const setAccountKey=(key:string)=>{account=key};
export async function api<T=Json>(url:string,init?:{method?:string;body?:unknown}):Promise<ApiResult<T>>{
 try{
  const headers:Record<string,string>={};
  if(init?.body!==undefined)headers['Content-Type']='application/json';
  if(account)headers['x-whatslearn-account']=account;
  const r=await fetch(url,{method:init?.method||'GET',cache:'no-store',credentials:'same-origin',headers,body:init?.body===undefined?undefined:JSON.stringify(init.body)});
  let data={} as T&{error?:string};try{data=await r.json()}catch{}
  return {ok:r.ok,status:r.status,data};
 }catch{return {ok:false,status:0,data:{error:'You seem to be offline. Check your connection and try again.'} as T&{error?:string}}}
}
export type Profile={goal:string;track:string;level:string;language:string;minutes:string;style?:string};
export type WorkRow={mission_id:string;body:string;updated_at:string;evaluation?:string|null;quiz:number};
export type Points={balance:number;streak:{current:number;best:number};todayUsed:boolean;today:string;scores:{mission_id:string;points:number;day:string}[]};
export type EvidenceRow={mission_id:string;review:unknown;created_at:string;reviewKey?:string};
export type Snapshot={accountKey:string;name:string;profile:Profile|null;work:WorkRow[];points:Points|null;paidAccess:boolean;checkpoints:string[];hasContext:boolean;evidence?:EvidenceRow[]};
/** Loads everything the signed-in screens need in one go. */
export async function loadSnapshot():Promise<Snapshot|null>{
 const p=await api<{accountKey:string;name?:string;profile:Profile|null}>('/api/profile');
 if(!p.ok)return null;
 setAccountKey(p.data.accountKey);
 const [w,c]=await Promise.all([api<{work:WorkRow[];points:Points;paidAccess:boolean;checkpoints:string[];evidence?:EvidenceRow[]}>('/api/work'),api<{context?:unknown}>('/api/learner-context')]);
 return {accountKey:p.data.accountKey,name:p.data.name||'',profile:p.data.profile,work:w.ok?w.data.work:[],points:w.ok?w.data.points:null,paidAccess:w.ok?!!w.data.paidAccess:false,checkpoints:w.ok?w.data.checkpoints:[],hasContext:c.ok&&!!c.data.context,evidence:w.ok&&Array.isArray(w.data.evidence)?w.data.evidence:[]};
}
export function readLocal(key:string){try{return localStorage.getItem(key)}catch{return null}}
export function writeLocal(key:string,value:string){try{localStorage.setItem(key,value);return true}catch{return false}}
