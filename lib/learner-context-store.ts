import {database} from './storage';
import {contextSchema} from './learner-context';
import {safeReturnTo} from './return-to';
export async function readContext(userId:string){const row=await database().prepare('SELECT answers,skipped,completed_at FROM learner_context WHERE user_id=?').bind(userId).first<{answers:string;skipped:number;completed_at:string}>();if(!row)return null;return {answers:contextSchema.parse(JSON.parse(row.answers)),skipped:!!row.skipped,completedAt:row.completed_at}}
export async function finishContext(userId:string,raw:unknown,skipped=false){const answers=contextSchema.parse(raw);const result=await database().prepare('INSERT OR IGNORE INTO learner_context(user_id,answers,skipped,completed_at) VALUES (?,?,?,?)').bind(userId,JSON.stringify(answers),skipped?1:0,new Date().toISOString()).run();if(!result.meta.changes)throw new Error('These answers were already submitted and cannot be edited.');return {answers,skipped}}
export function contextDestination(next='/learn'){let safe=safeReturnTo(next);for(let i=0;i<4;i++){const u=new URL(safe,'https://app.local');if(u.pathname!=='/welcome')return safe;safe=safeReturnTo(u.searchParams.get('next'))}return '/learn'}
export function welcomeUrl(next='/learn'){return '/welcome?next='+encodeURIComponent(contextDestination(next))}
export async function afterSignIn(userId:string,next='/learn'){const safe=contextDestination(next);return await readContext(userId)?safe:welcomeUrl(safe)}
