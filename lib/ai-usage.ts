import {database} from './storage';
import {activeEntitlement} from './billing/service';
import {planAllowance} from './billing/allowances';
const day=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});
export async function aiAllowance(userId:string){
 const entitlement=await activeEntitlement(userId);
 const {dailyAi:limit}=planAllowance(entitlement?.sku);
 const row=await database().prepare('SELECT count FROM ai_feedback_usage WHERE user_id=? AND day=?').bind(userId,day()).first<{count:number}>();
 return {limit,used:row?.count||0,plan:entitlement?.plan||'Explore'};
}
/** Shared across website and linked WhatsApp. Reserve atomically before a provider call. */
export async function reserveAiUse(userId:string,limit:number){
 const r=await database().prepare('INSERT INTO ai_feedback_usage(user_id,day,count) VALUES (?,?,1) ON CONFLICT(user_id,day) DO UPDATE SET count=count+1 WHERE count<?').bind(userId,day(),limit).run();
 return !!r.meta.changes;
}
export async function releaseAiUse(userId:string){await database().prepare('UPDATE ai_feedback_usage SET count=MAX(0,count-1) WHERE user_id=? AND day=?').bind(userId,day()).run()}
