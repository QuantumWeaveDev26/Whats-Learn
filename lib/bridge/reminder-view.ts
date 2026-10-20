import {database} from '../storage';
import {getContact} from '../whatsapp';
import {nextReminderSlot} from '../reminder-schedule';
import {performanceTemplate} from '../reminder-copy';
export async function reminderView(userId:string,at=new Date()){
 const c=await getContact(userId);if(!c?.verified_at)return null;
 const latest=await database().prepare('SELECT slot,state,claimed_at,lease_expires_at,accepted_at,receipt_status,status_at,error_category,message_id,attempts FROM whatsapp_reminder_log WHERE user_id=? ORDER BY slot DESC LIMIT 1').bind(userId).first<{slot:string;state:string;claimed_at:number;lease_expires_at:number|null;accepted_at:string|null;receipt_status:string|null;status_at:number|null;error_category:string|null;message_id:string|null;attempts:number}>();
 const enabled=c.state==='opted_in'&&c.remind_state==='on',templateAvailable=!!performanceTemplate(c.language);
 const terminal=latest&&(latest.message_id||['sent','delivered','read','unknown'].includes(latest.state)||latest.attempts>=3||latest.state.startsWith('skipped_'));
 let next=nextReminderSlot({enabled,hour:c.remind_hour??19,frequency:c.remind_freq||'daily',quietStart:c.quiet_start??21,quietEnd:c.quiet_end??8,blockedSlots:terminal?[latest!.slot]:[]},at);
 if(next.at&&!templateAvailable&&(!c.last_inbound_at||Date.parse(next.at)-Date.parse(c.last_inbound_at)>=24*36e5))next={...next,at:null,reason:'An approved reminder template in your selected language is unavailable. Send the mentor a message to reopen the 24-hour chat window.'};
 const state=latest?.state==='sending'&&Number(latest.lease_expires_at||latest.claimed_at+600)<=at.getTime()/1000?'unknown':latest?.state;
 return {enabled,hour:c.remind_hour??19,frequency:c.remind_freq||'daily',quietStart:c.quiet_start??21,quietEnd:c.quiet_end??8,timeZone:'Asia/Kolkata',lastAcceptedAt:c.last_reminder_at,templateAvailable,next,latest:latest?{slot:latest.slot,state,acceptedAt:latest.accepted_at,statusAt:latest.status_at?new Date(latest.status_at*1000).toISOString():null}:null};
}
