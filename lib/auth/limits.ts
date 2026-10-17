import {database} from '@/lib/storage';
/** Fixed-window counters in the database. The key is a hash, so no plaintext email address or address is kept. Returns false when the limit is used up. */
export async function sha256(t:string){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
export async function allow(kind:string,subject:string,max:number,windowSeconds:number,now=Date.now()):Promise<boolean>{
 const key=kind+':'+(await sha256(subject.toLowerCase().trim())).slice(0,32);const win=Math.floor(now/1000/windowSeconds)*windowSeconds;
 const row=await database().prepare('INSERT INTO auth_attempts (key,window_start,count) VALUES (?,?,1) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN window_start=excluded.window_start THEN count+1 ELSE 1 END, window_start=excluded.window_start RETURNING count').bind(key,win).first() as {count:number}|null;
 return Number(row?.count||0)<=max;
}
export const clientAddress=(request:Request)=>request.headers.get('cf-connecting-ip')||request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';

/** Read a counter without consuming an attempt. */
export async function attemptsUsed(kind:string,subject:string,windowSeconds:number,now=Date.now()){const key=kind+":"+(await sha256(subject.toLowerCase().trim())).slice(0,32),win=Math.floor(now/1000/windowSeconds)*windowSeconds;const row=await database().prepare("SELECT count,window_start FROM auth_attempts WHERE key=?").bind(key).first<{count:number;window_start:number}>();return row?.window_start===win?row.count:0;}
