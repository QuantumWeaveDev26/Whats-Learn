'use client';
/** Thin client for the website's own APIs, so the app shares accounts, progress, points and AI review with whatslearn.in. */
export type Json=Record<string,unknown>;
export type ApiResult<T=Json>={ok:boolean;status:number;data:T&{error?:string}};
let account='';
export const setAccountKey=(key:string)=>{account=key};
export async function api<T=Json>(url:string,init?:{method?:string;body?:unknown;timeoutMs?:number;accountKey?:string}):Promise<ApiResult<T>>{
 const controller=init?.timeoutMs?new AbortController():undefined;
 const timer=controller?setTimeout(()=>controller.abort(),init!.timeoutMs):undefined;
 try{
  const headers:Record<string,string>={};
  if(init?.body!==undefined)headers['Content-Type']='application/json';
  const key=init?.accountKey??account;if(key)headers['x-whatslearn-account']=key;
  const r=await fetch(url,{method:init?.method||'GET',cache:'no-store',credentials:'same-origin',headers,body:init?.body===undefined?undefined:JSON.stringify(init.body),signal:controller?.signal});
  let data={} as T&{error?:string};
  if(r.status!==204){
   try{data=await r.json();if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Invalid response')}
   catch(error){if(controller?.signal.aborted)throw error;return {ok:false,status:r.status,data:{error:'The response could not be read. Please try again.'} as T&{error?:string}}}
  }
  return {ok:r.ok,status:r.status,data};
 }catch{return {ok:false,status:0,data:{error:controller?.signal.aborted?'Loading is taking longer than expected. Please try again.':'Check your connection and try again.'} as T&{error?:string}}}
 finally{if(timer!==undefined)clearTimeout(timer)}
}
export type Profile={goal:string;track:string;level:string;language:string;minutes:string;style?:string};
export type WorkRow={mission_id:string;body:string;updated_at:string;evaluation?:string|null;quiz:number};
export type Points={balance:number;streak:{current:number;best:number};todayUsed:boolean;today:string;scores:{mission_id:string;points:number;day:string}[]};
export type EvidenceRow={mission_id:string;review:unknown;created_at:string;reviewKey?:string};
export type Snapshot={accountKey:string;name:string;profile:Profile|null;work:WorkRow[];points:Points|null;paidAccess:boolean;checkpoints:string[];hasContext:boolean;evidence?:EvidenceRow[]};
/** Loads everything the signed-in screens need in one go. */
export async function loadSnapshot():Promise<Snapshot|null>{
 const p=await api<{accountKey:string;name?:string;profile:Profile|null}>('/api/profile',{timeoutMs:15000,accountKey:''});
 if(p.status===401||p.status===403)return null;
 if(!p.ok||!p.data.accountKey)throw new Error(p.data.error||'Your account could not load. Please try again.');
 const init={timeoutMs:15000,accountKey:p.data.accountKey};
 const [w,c]=await Promise.all([api<{accountKey:string;work:WorkRow[];points:Points;paidAccess:boolean;checkpoints:string[];evidence?:EvidenceRow[]}>('/api/work',init),api<{accountKey:string;context?:unknown}>('/api/learner-context',init)]);
 if(w.status===401||w.status===403||c.status===401||c.status===403)return null;
 const changed=[w,c].find(result=>result.ok&&typeof result.data.accountKey==='string'&&result.data.accountKey!==p.data.accountKey);
 if(changed)throw Object.assign(new Error('Your account changed. Please try again.'),{accountKey:changed.data.accountKey});
 if(w.status===409||c.status===409)throw Object.assign(new Error('Your account changed. Please try again.'),{accountChanged:true,accountKey:p.data.accountKey});
 if(!w.ok||!c.ok||!Array.isArray(w.data.work)||!Array.isArray(w.data.checkpoints))throw Object.assign(new Error('Your progress could not load. Check your connection and try again.'),{accountKey:p.data.accountKey});
 if(w.data.accountKey!==p.data.accountKey||c.data.accountKey!==p.data.accountKey||!Object.prototype.hasOwnProperty.call(c.data,'context'))throw Object.assign(new Error('Your progress could not load. Please try again.'),{accountKey:p.data.accountKey});
 return {accountKey:p.data.accountKey,name:p.data.name||'',profile:p.data.profile,work:w.ok?w.data.work:[],points:w.ok?w.data.points:null,paidAccess:w.ok?!!w.data.paidAccess:false,checkpoints:w.ok?w.data.checkpoints:[],hasContext:c.ok&&!!c.data.context,evidence:w.ok&&Array.isArray(w.data.evidence)?w.data.evidence:[]};
}
export function readLocal(key:string){try{return localStorage.getItem(key)}catch{return null}}
export function writeLocal(key:string,value:string){try{localStorage.setItem(key,value);return true}catch{return false}}
