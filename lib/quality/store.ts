import {randomUUID,createHash} from 'node:crypto';
import {z} from 'zod';
import {database} from '@/lib/storage';

export class QualityError extends Error{constructor(message:string,public status=400){super(message)}}
export const reportReasons={wrong_answer:'Wrong answer',wrong_language:'Wrong language',too_long:'Too long',not_helpful:'Not helpful',other:'Other'} as const;
export const supportCategories={learning:'My task',account:'My account',mentor:'Mentor reply',reminder:'WhatsApp or reminder',other:'Other'} as const;
const key=z.string().min(12).max(100).regex(/^[a-zA-Z0-9:_-]+$/);
export const reportInput=z.object({replyId:z.string().uuid(),reason:z.enum(['wrong_answer','wrong_language','too_long','not_helpful','other']),note:z.string().trim().max(500).default(''),idempotencyKey:key}).strict();
export const supportInput=z.object({category:z.enum(['learning','account','mentor','reminder','other']),description:z.string().trim().min(10).max(2000),reportId:z.string().uuid().optional(),idempotencyKey:key}).strict();
export type ReportInput=z.input<typeof reportInput>;
export type SupportInput=z.input<typeof supportInput>;
function parse<T>(schema:z.ZodType<T>,raw:unknown){const r=schema.safeParse(raw);if(!r.success)throw new QualityError('Check the category, description and attached reply.',400);return r.data}
const cutoff=(at:Date,days:number)=>new Date(at.getTime()-days*864e5).toISOString();
export async function pruneQualityRecords(at=new Date()){
 const db=database();await db.batch([
  db.prepare('DELETE FROM quality_replies WHERE created_at<=?').bind(cutoff(at,7)),
  db.prepare('DELETE FROM quality_events WHERE created_at<=?').bind(cutoff(at,30)),
  db.prepare('DELETE FROM quality_audit WHERE created_at<=?').bind(cutoff(at,90)),
  db.prepare("DELETE FROM quality_reports WHERE status='resolved' AND resolved_at<=?").bind(cutoff(at,90)),
  db.prepare("DELETE FROM quality_support WHERE status='resolved' AND resolved_at<=?").bind(cutoff(at,90))
 ]);
}
export async function recordReply(userId:string,input:{channel:'web'|'whatsapp';missionId?:string;question:string;answer:string;sourceId?:string}){
 if(!userId||!['web','whatsapp'].includes(input.channel)||!input.answer.trim())throw new QualityError('No reply to record.');
 await pruneQualityRecords();const db=database();const hex=input.sourceId?createHash('sha256').update(userId+'|'+input.channel+'|'+input.sourceId).digest('hex'):null;const id=hex?hex.slice(0,8)+'-'+hex.slice(8,12)+'-5'+hex.slice(13,16)+'-a'+hex.slice(17,20)+'-'+hex.slice(20,32):randomUUID();
 await db.prepare('INSERT OR IGNORE INTO quality_replies(id,user_id,channel,mission_id,question,answer,created_at) VALUES (?,?,?,?,?,?,?)').bind(id,userId,input.channel,input.missionId||null,input.question.trim().slice(0,500),input.answer.trim().slice(0,1800),new Date().toISOString()).run();
 await db.prepare('DELETE FROM quality_replies WHERE user_id=? AND id NOT IN (SELECT id FROM quality_replies WHERE user_id=? ORDER BY created_at DESC,id DESC LIMIT 100)').bind(userId,userId).run();
 return {id};
}
export async function ownedReply(userId:string,id:string){return database().prepare('SELECT id,channel,mission_id,question,answer FROM quality_replies WHERE id=? AND user_id=? AND created_at>?').bind(id,userId,cutoff(new Date(),7)).first<{id:string;channel:string;mission_id:string|null;question:string;answer:string}>()}
export async function latestReply(userId:string,channel:'web'|'whatsapp'){return database().prepare('SELECT id,channel,mission_id,question,answer FROM quality_replies WHERE user_id=? AND channel=? AND created_at>? ORDER BY created_at DESC,id DESC LIMIT 1').bind(userId,channel,cutoff(new Date(),7)).first<{id:string;channel:string;mission_id:string|null;question:string;answer:string}>()}
export async function createReport(userId:string,raw:ReportInput){
 const p=parse(reportInput,raw);await pruneQualityRecords();const db=database();
 const existing=await db.prepare('SELECT id,status FROM quality_reports WHERE user_id=? AND idempotency_key=?').bind(userId,p.idempotencyKey).first<{id:string;status:string}>();if(existing)return existing;
 const reply=await ownedReply(userId,p.replyId);if(!reply)throw new QualityError('That reply is unavailable for this account.',404);
 const id=randomUUID(),at=new Date().toISOString();
 await db.prepare("INSERT OR IGNORE INTO quality_reports(id,user_id,reply_id,reason,note,channel,mission_id,question_excerpt,answer_excerpt,status,idempotency_key,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,'received',?,?,?)").bind(id,userId,p.replyId,p.reason,p.note,reply.channel,reply.mission_id,reply.question,reply.answer,p.idempotencyKey,at,at).run();
 return (await db.prepare('SELECT id,status FROM quality_reports WHERE user_id=? AND idempotency_key=?').bind(userId,p.idempotencyKey).first<{id:string;status:string}>())!;
}
export async function createSupportRequest(userId:string,raw:SupportInput){
 const p=parse(supportInput,raw);await pruneQualityRecords();const db=database();
 const existing=await db.prepare('SELECT id,status FROM quality_support WHERE user_id=? AND idempotency_key=?').bind(userId,p.idempotencyKey).first<{id:string;status:string}>();if(existing)return existing;
 if(p.reportId&&!await db.prepare('SELECT id FROM quality_reports WHERE id=? AND user_id=?').bind(p.reportId,userId).first())throw new QualityError('That report is unavailable for this account.',404);
 const id=randomUUID(),at=new Date().toISOString();await db.prepare("INSERT OR IGNORE INTO quality_support(id,user_id,category,description,report_id,status,idempotency_key,created_at,updated_at) VALUES (?,?,?,?,?,'received',?,?,?)").bind(id,userId,p.category,p.description,p.reportId||null,p.idempotencyKey,at,at).run();
 return (await db.prepare('SELECT id,status FROM quality_support WHERE user_id=? AND idempotency_key=?').bind(userId,p.idempotencyKey).first<{id:string;status:string}>())!;
}
