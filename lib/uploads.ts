import {canUseMission} from './mission-access-server';
import {membershipRequired} from './mission-access';
import {env} from 'cloudflare:workers';
import {missions} from '@/lib/missions';
/**
 * Optional private file uploads for practical work (images, a PDF, a short video).
 * OFF unless UPLOADS_ENABLED=true AND a private R2 bucket is bound as BUCKET. Files are stored under a key made from the account id and a random id,
 * are never served from a public address, are only ever sent back to their owner as a download, are never opened or executed by the app,
 * and are NOT reviewed by AI. They are deleted with the learner's request or with the account.
 */
const e=()=>env as unknown as {DB:D1Database;BUCKET?:R2Bucket;UPLOADS_ENABLED?:string};
export const MAX_FILES_PER_MISSION=3,MAX_FILES_PER_ACCOUNT=30;
export const kinds={
 'image/png':{label:'image',max:5*1024**2},'image/jpeg':{label:'image',max:5*1024**2},'image/webp':{label:'image',max:5*1024**2},'image/gif':{label:'image',max:5*1024**2},
 'application/pdf':{label:'PDF',max:10*1024**2},'video/mp4':{label:'video',max:25*1024**2},'video/webm':{label:'video',max:25*1024**2}
} as const;
export type Mime=keyof typeof kinds;
export const uploadRules='PNG, JPEG, WebP or GIF images up to 5 MB, PDF files up to 10 MB, and MP4 or WebM videos up to 25 MB. Up to 3 files per mission. Files are stored privately for your reference, are not public, are not reviewed by AI, and are not run. You can delete a file at any time; all files are deleted with your account.';
export function uploadsEnabled(){const x=e();return x.UPLOADS_ENABLED==='true'&&!!x.BUCKET}
/** Decides the real file type from its first bytes, ignoring the name and the type the browser claimed. */
export function sniff(b:Uint8Array):Mime|null{
 const at=(i:number,...v:number[])=>v.every((x,k)=>b[i+k]===x);
 if(at(0,0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a))return 'image/png';
 if(at(0,0xff,0xd8,0xff))return 'image/jpeg';
 if(at(0,0x47,0x49,0x46,0x38)&&(b[4]===0x37||b[4]===0x39)&&b[5]===0x61)return 'image/gif';
 if(at(0,0x52,0x49,0x46,0x46)&&at(8,0x57,0x45,0x42,0x50))return 'image/webp';
 if(at(0,0x25,0x50,0x44,0x46,0x2d))return 'application/pdf';
 if(at(4,0x66,0x74,0x79,0x70))return 'video/mp4';
 if(at(0,0x1a,0x45,0xdf,0xa3))return 'video/webm';
 return null;
}
export function cleanName(n:string){const base=n.split(/[\\/]/).pop()||'file';return base.replace(/[^\w.\- ]+/g,'_').replace(/^\.+/,'').slice(0,80)||'file'}
export type Row={id:string;mission_id:string;name:string;mime:string;bytes:number;created_at:string};
export async function listUploads(userId:string,missionId?:string){
 const q=missionId?e().DB.prepare('SELECT id,mission_id,name,mime,bytes,created_at FROM uploads WHERE user_id=? AND mission_id=? ORDER BY created_at').bind(userId,missionId):e().DB.prepare('SELECT id,mission_id,name,mime,bytes,created_at FROM uploads WHERE user_id=? ORDER BY created_at').bind(userId);
 return (await q.all()).results as unknown as Row[];
}
export async function saveUpload(userId:string,missionId:string,file:{name:string;bytes:Uint8Array},now=new Date()){
 if(!uploadsEnabled())return {ok:false as const,status:503,message:'File uploads are not switched on yet.'};
 if(!missions.some(m=>m.id===missionId))return {ok:false as const,status:400,message:'Choose a valid mission.'};
 if(!await canUseMission(userId,missionId))return {ok:false as const,status:403,message:membershipRequired};
 const mime=sniff(file.bytes.subarray(0,16));if(!mime)return {ok:false as const,status:415,message:'This file type is not allowed. '+uploadRules};
 if(file.bytes.byteLength===0||file.bytes.byteLength>kinds[mime].max)return {ok:false as const,status:413,message:`This ${kinds[mime].label} is too large or empty. ${uploadRules}`};
 const db=e().DB,id=crypto.randomUUID(),key=`u/${userId}/${id}`;
 // Reserve the slot first so simultaneous uploads cannot pass the limits together; the row is removed again if the file cannot be stored.
 const slot=await db.prepare('INSERT INTO uploads (id,user_id,mission_id,r2_key,name,mime,bytes,created_at) SELECT ?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM uploads WHERE user_id=? AND mission_id=?)<? AND (SELECT COUNT(*) FROM uploads WHERE user_id=?)<?').bind(id,userId,missionId,key,cleanName(file.name),mime,file.bytes.byteLength,now.toISOString(),userId,missionId,MAX_FILES_PER_MISSION,userId,MAX_FILES_PER_ACCOUNT).run();
 if(!slot.meta?.changes)return {ok:false as const,status:409,message:`You can keep up to ${MAX_FILES_PER_MISSION} files per mission (${MAX_FILES_PER_ACCOUNT} in total). Delete one first.`};
 try{await e().BUCKET!.put(key,file.bytes,{httpMetadata:{contentType:mime}})}catch{await db.prepare('DELETE FROM uploads WHERE id=? AND user_id=?').bind(id,userId).run();return {ok:false as const,status:503,message:'The file could not be stored. Please try again.'}}
 return {ok:true as const,file:{id,mission_id:missionId,name:cleanName(file.name),mime,bytes:file.bytes.byteLength}};
}
/** Returns the file only to its owner. */
export async function readUpload(userId:string,id:string){
 const row=await e().DB.prepare('SELECT id,r2_key,name,mime FROM uploads WHERE id=? AND user_id=?').bind(id,userId).first<{id:string;r2_key:string;name:string;mime:string}>();
 const bucket=e().BUCKET;if(!row||!bucket)return null;const obj=await bucket.get(row.r2_key);return obj?{name:row.name,mime:row.mime,body:obj.body}:null;
}
export async function deleteUpload(userId:string,id:string){
 const row=await e().DB.prepare('SELECT r2_key FROM uploads WHERE id=? AND user_id=?').bind(id,userId).first<{r2_key:string}>();if(!row)return false;
 const bucket=e().BUCKET;if(!bucket)throw new Error('File storage unavailable');await bucket.delete(row.r2_key);await e().DB.prepare('DELETE FROM uploads WHERE id=? AND user_id=?').bind(id,userId).run();return true;
}
