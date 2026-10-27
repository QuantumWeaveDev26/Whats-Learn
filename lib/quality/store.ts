import {randomUUID,createHash} from 'node:crypto';
import {z} from 'zod';
import {database} from '@/lib/storage';
import {learningSummary} from './learning-summary';

export class QualityError extends Error{constructor(message:string,public status=400){super(message)}}
export const reportReasons={wrong_answer:'Wrong answer',wrong_language:'Wrong language',too_long:'Too long',not_helpful:'Not helpful',other:'Other'} as const;
export {supportCategories} from './options';
const key=z.string().min(12).max(100).regex(/^[a-zA-Z0-9:_-]+$/);
export const reportInput=z.object({replyId:z.string().uuid(),reason:z.enum(['wrong_answer','wrong_language','too_long','not_helpful','other']),note:z.string().trim().max(500).default(''),idempotencyKey:key}).strict();
export const supportInput=z.object({category:z.enum(['learning','account','mentor','reminder','other']),description:z.string().trim().min(10).max(2000),reportId:z.string().uuid().optional(),idempotencyKey:key}).strict();
export type ReportInput=z.input<typeof reportInput>;
export type SupportInput=z.input<typeof supportInput>;
function parse<S extends z.ZodTypeAny>(schema:S,raw:unknown):z.output<S>{const r=schema.safeParse(raw);if(!r.success)throw new QualityError('Check the category, description and attached reply.',400);return r.data}
const cutoff=(at:Date,days:number)=>new Date(at.getTime()-days*864e5).toISOString();
export async function pruneQualityRecords(at=new Date()){
 const db=database();await db.batch([
  db.prepare('DELETE FROM quality_alerts WHERE created_at<=?').bind(cutoff(at,90)),
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
 await db.batch([db.prepare("INSERT OR IGNORE INTO quality_reports(id,user_id,reply_id,reason,note,channel,mission_id,question_excerpt,answer_excerpt,status,idempotency_key,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,'received',?,?,?)").bind(id,userId,p.replyId,p.reason,p.note,reply.channel,reply.mission_id,reply.question,reply.answer,p.idempotencyKey,at,at),db.prepare("INSERT OR IGNORE INTO quality_alerts(id,user_id,kind,item_id,created_at) SELECT ?,user_id,'report',id,created_at FROM quality_reports WHERE user_id=? AND idempotency_key=?").bind(randomUUID(),userId,p.idempotencyKey)]);
 return (await db.prepare('SELECT id,status FROM quality_reports WHERE user_id=? AND idempotency_key=?').bind(userId,p.idempotencyKey).first<{id:string;status:string}>())!;
}
export async function createSupportRequest(userId:string,raw:SupportInput){
 const p=parse(supportInput,raw);await pruneQualityRecords();const db=database();
 const existing=await db.prepare('SELECT id,status FROM quality_support WHERE user_id=? AND idempotency_key=?').bind(userId,p.idempotencyKey).first<{id:string;status:string}>();if(existing)return existing;
 if(p.reportId&&!await db.prepare('SELECT id FROM quality_reports WHERE id=? AND user_id=?').bind(p.reportId,userId).first())throw new QualityError('That report is unavailable for this account.',404);
 const id=randomUUID(),at=new Date().toISOString();await db.batch([db.prepare("INSERT OR IGNORE INTO quality_support(id,user_id,category,description,report_id,status,idempotency_key,created_at,updated_at) VALUES (?,?,?,?,?,'received',?,?,?)").bind(id,userId,p.category,p.description,p.reportId||null,p.idempotencyKey,at,at),db.prepare("INSERT OR IGNORE INTO quality_alerts(id,user_id,kind,item_id,created_at) SELECT ?,user_id,'support',id,created_at FROM quality_support WHERE user_id=? AND idempotency_key=?").bind(randomUUID(),userId,p.idempotencyKey)]);
 return (await db.prepare('SELECT id,status FROM quality_support WHERE user_id=? AND idempotency_key=?').bind(userId,p.idempotencyKey).first<{id:string;status:string}>())!;
}

const ownerQuery=z.object({kind:z.enum(['reports','support','failures']).default('reports'),status:z.enum(['unresolved','all','received','acknowledged','resolved']).default('unresolved'),limit:z.coerce.number().int().min(1).max(50).default(20),cursor:z.string().max(200).optional()}).strict();
export const qualityUpdate=z.object({kind:z.enum(['reports','support']),id:z.string().uuid(),status:z.enum(['received','acknowledged','resolved']),resolution:z.string().trim().max(2000).default('')}).strict().refine(p=>p.status!=='resolved'||p.resolution.length>=5,{message:'Add a short learner-visible resolution.'});
type Owner={userId:string;email:string};
const tableFor={reports:'quality_reports',support:'quality_support',failures:'quality_events'} as const;
export async function learnerQualityItems(userId:string,reportId?:string){
 await pruneQualityRecords();const db=database(),since=cutoff(new Date(),90);
 const requests=(await db.prepare("SELECT id,category,description,report_id,status,resolution,created_at FROM quality_support WHERE user_id=? AND (status!='resolved' OR resolved_at>?) ORDER BY created_at DESC,id DESC LIMIT 30").bind(userId,since).all()).results;
 const reports=(await db.prepare("SELECT id,reason,answer_excerpt,status,resolution,created_at FROM quality_reports WHERE user_id=? AND (status!='resolved' OR resolved_at>?) ORDER BY created_at DESC,id DESC LIMIT 30").bind(userId,since).all()).results;
 const attachment=reportId?await db.prepare("SELECT id,reason,answer_excerpt FROM quality_reports WHERE user_id=? AND id=? AND (status!='resolved' OR resolved_at>?)").bind(userId,reportId,since).first():null;
 return {requests,reports,attachment};
}
export async function listQualityItems(_owner:Owner,raw:unknown){
 const p=parse(ownerQuery,raw);let cursor:{at:string;id:string}|null=null;
 if(p.cursor){try{cursor=JSON.parse(Buffer.from(p.cursor,'base64url').toString());if(!cursor||typeof cursor.at!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(cursor.at)||typeof cursor.id!=='string'||!z.string().uuid().safeParse(cursor.id).success)throw Error()}catch{throw new QualityError('Invalid page cursor.')}}
 await pruneQualityRecords();const args:unknown[]=[];const where:string[]=[];
 if(p.kind==='failures'){where.push('created_at>?');args.push(cutoff(new Date(),30))}else{where.push("(status!='resolved' OR resolved_at>?)");args.push(cutoff(new Date(),90));if(p.status==='unresolved'){where.push("status IN ('received','acknowledged')")}else if(p.status!=='all'){where.push('status=?');args.push(p.status)}}
 if(cursor){where.push('(created_at<? OR (created_at=? AND id<?))');args.push(cursor.at,cursor.at,cursor.id)}
 const fields=p.kind==='reports'?'id,user_id,reason,note,channel,mission_id,question_excerpt,answer_excerpt,status,resolution,created_at,updated_at':p.kind==='support'?'id,user_id,category,description,report_id,status,resolution,created_at,updated_at':'id,user_id,channel,category,correlation_id,created_at';
 const rows=(await database().prepare(`SELECT ${fields} FROM ${tableFor[p.kind]} WHERE ${where.join(' AND ')} ORDER BY created_at DESC,id DESC LIMIT ?`).bind(...args,p.limit+1).all<Record<string,string|null>>()).results;
 const more=rows.length>p.limit,items=rows.slice(0,p.limit),last=items.at(-1);
 const db=database();
 const reports=await db.prepare("SELECT COUNT(*) n FROM quality_reports WHERE status IN ('received','acknowledged')").first<{n:number}>();
 const support=await db.prepare("SELECT COUNT(*) n FROM quality_support WHERE status IN ('received','acknowledged')").first<{n:number}>();
 const failures=await db.prepare('SELECT COUNT(*) n FROM quality_events WHERE created_at>?').bind(cutoff(new Date(),30)).first<{n:number}>();
 const since=cutoff(new Date(),30);
 const [byReason,byFailure]=await Promise.all([
  db.prepare('SELECT reason,COUNT(*) count FROM quality_reports WHERE created_at>? GROUP BY reason').bind(since).all<{reason:string;count:number}>(),
  db.prepare('SELECT category,channel,COUNT(*) count FROM quality_events WHERE created_at>? GROUP BY category,channel').bind(since).all<{category:string;channel:string;count:number}>()
 ]);
 const learning=await learningSummary().catch(()=>null);
 return {learning,counts:{reports:Number(reports?.n||0),support:Number(support?.n||0),failures:Number(failures?.n||0)},breakdown:{windowDays:30,reportsByReason:byReason.results,failuresByChannel:byFailure.results,note:'Counts from existing retained reports and failure records; not failure rates, response times or conversion tracking.'},items,nextCursor:more&&last?Buffer.from(JSON.stringify({at:last.created_at,id:last.id})).toString('base64url'):null};
}
export async function updateQualityItem(owner:Owner,raw:unknown){
 const p=parse(qualityUpdate,raw),db=database(),table=tableFor[p.kind];await pruneQualityRecords();
 const old=await db.prepare(`SELECT user_id,status,resolution,updated_at FROM ${table} WHERE id=? AND (status!='resolved' OR resolved_at>?)`).bind(p.id,cutoff(new Date(),90)).first<{user_id:string;status:string;resolution:string;updated_at:string}>();if(!old)throw new QualityError('Request unavailable.',404);
 if(old.status===p.status&&old.resolution===p.resolution)return {updated:true};
 const at=new Date().toISOString();const result=await db.batch([
 db.prepare(`INSERT INTO quality_audit(id,user_id,item_kind,item_id,actor_user_id,actor_email,from_status,to_status,resolution,created_at) SELECT ?,user_id,?,?,?,?,status,?,?,? FROM ${table} WHERE id=? AND status=? AND updated_at=? AND resolution=?`).bind(randomUUID(),p.kind,p.id,owner.userId,owner.email,p.status,p.resolution,at,p.id,old.status,old.updated_at,old.resolution),
 db.prepare(`UPDATE ${table} SET status=?,resolution=?,updated_at=?,resolved_at=? WHERE id=? AND status=? AND updated_at=? AND resolution=?`).bind(p.status,p.resolution,at,p.status==='resolved'?at:null,p.id,old.status,old.updated_at,old.resolution)
 ]);if(!result[1].meta.changes)throw new QualityError('This request changed. Refresh before editing.',409);return {updated:true};
}
