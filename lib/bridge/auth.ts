import {env} from 'cloudflare:workers';
import {database} from '../storage';
/**
 * Signed requests between the n8n workflows and WhatsLearn. n8n signs every request; WhatsLearn checks the signature, the clock and a one-time id before doing anything.
 *   string to sign = timestamp + "\n" + nonce + "\n" + METHOD + "\n" + path + "\n" + raw body       (HMAC-SHA256, hex, key = N8N_BRIDGE_SECRET)
 *   headers: x-wl-timestamp (unix seconds, within 5 minutes), x-wl-nonce (16 to 64 characters, new for each request), x-wl-signature
 * Replay protection: a nonce is accepted once. The same nonce with the same body is a safe retry and gets the first answer back without running again; the same nonce with a different body is refused.
 */
export const BRIDGE_WINDOW_SECONDS=300;
export const bridgeSecret=()=>String((env as unknown as Record<string,string|undefined>).N8N_BRIDGE_SECRET||'');
const hex=(b:ArrayBuffer)=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
export const sha256Hex=async(s:string)=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
export async function hmacHex(secret:string,message:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(message)))}
/** Constant-time comparison of two hex strings. */
export function sameHex(a:string,b:string){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0}
export const signingString=(ts:string,nonce:string,method:string,path:string,raw:string)=>`${ts}\n${nonce}\n${method.toUpperCase()}\n${path}\n${raw}`;
const json=(body:unknown,status:number,extra:Record<string,string>={})=>Response.json(body,{status,headers:{'Cache-Control':'no-store',...extra}});
export type BridgeResult={status:number;json:unknown};
/** Runs a bridge handler for a verified request. The handler gets the parsed JSON body. */
export async function bridge(request:Request,handler:(body:unknown)=>Promise<BridgeResult>,now=Date.now()):Promise<Response>{
 const secret=bridgeSecret();if(!secret)return json({error:'The n8n bridge is not configured.'},503);
 if(request.method!=='POST')return json({error:'POST only.'},405);
 const raw=await request.text();if(raw.length>100000)return json({error:'Payload too large.'},413);
 const ts=request.headers.get('x-wl-timestamp')||'',nonce=request.headers.get('x-wl-nonce')||'',sig=(request.headers.get('x-wl-signature')||'').toLowerCase();
 if(!/^\d{10}$/.test(ts)||!/^[A-Za-z0-9_-]{16,64}$/.test(nonce)||!/^[a-f0-9]{64}$/.test(sig))return json({error:'Unsigned request.'},401);
 if(Math.abs(now/1000-Number(ts))>BRIDGE_WINDOW_SECONDS)return json({error:'Request expired. Check the clock on the n8n server.'},401);
 const want=await hmacHex(secret,signingString(ts,nonce,request.method,new URL(request.url).pathname,raw));
 if(!sameHex(want,sig))return json({error:'Bad signature.'},401);
 const db=database(),hash=await sha256Hex(raw);
 await db.prepare('DELETE FROM bridge_nonces WHERE seen_at<?').bind(Math.floor(now/1000)-900).run();
 const claimed=await db.prepare('INSERT OR IGNORE INTO bridge_nonces(nonce,seen_at,body_hash) VALUES (?,?,?)').bind(nonce,Math.floor(now/1000),hash).run();
 if(!claimed.meta.changes){
  const old=await db.prepare('SELECT body_hash,status,response FROM bridge_nonces WHERE nonce=?').bind(nonce).first<{body_hash:string;status:number|null;response:string|null}>();
  if(old&&old.body_hash===hash&&old.response!==null)return json(JSON.parse(old.response),old.status||200,{'x-wl-replayed':'1'});
  return json({error:old&&old.body_hash===hash?'Still working on this request.':'This request id was already used.'},409);
 }
 let body:unknown;try{body=raw?JSON.parse(raw):{}}catch{const r={error:'Invalid JSON.'};await db.prepare('UPDATE bridge_nonces SET status=400,response=? WHERE nonce=?').bind(JSON.stringify(r),nonce).run();return json(r,400)}
 let result:BridgeResult;
 try{result=await handler(body)}catch{
  // A failed run is not remembered, so a signed retry with a new request id (or the same one) can run again.
  await db.prepare('DELETE FROM bridge_nonces WHERE nonce=?').bind(nonce).run();
  return json({error:'The bridge could not finish. Nothing was saved twice; try again.'},500);
 }
 await db.prepare('UPDATE bridge_nonces SET status=?,response=? WHERE nonce=?').bind(result.status,JSON.stringify(result.json),nonce).run();
 return json(result.json,result.status);
}
