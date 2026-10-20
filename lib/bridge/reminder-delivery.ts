import {randomUUID} from 'node:crypto';
import {database} from '../storage';
import {recordQualityEvent} from '../quality/events';
export type DeliveryKind='reminder'|'notice';
export type DeliveryReport={ref?:string;id?:number;claimToken?:string;ok:boolean;messageId?:string;errorCategory?:'provider_rejected'|'pre_send'|'transport_unknown'};
const seconds=(at:Date)=>Math.floor(at.getTime()/1000);
function target(kind:DeliveryKind,key:string|number){if(kind==='notice'){if(!Number.isSafeInteger(Number(key))||Number(key)<1)throw Error('Invalid notice');return {table:'whatsapp_outbox',where:'id=?',args:[Number(key)]}}const m=/^([^|]{1,128})\|(\d{4}-\d{2}-\d{2})$/.exec(String(key));if(!m)throw Error('Invalid reminder');return {table:'whatsapp_reminder_log',where:'user_id=? AND slot=?',args:[m[1],m[2]]}}
type Row={user_id:string;state:string;claim_token:string|null;lease_expires_at:number|null;claimed_at:number;message_id:string|null;attempts:number};
export async function claimDelivery(kind:DeliveryKind,key:string|number,at=new Date()){
 const t=target(kind,key),db=database(),n=seconds(at);const old=await db.prepare(`SELECT user_id,state,claim_token,lease_expires_at,claimed_at,message_id,attempts FROM ${t.table} WHERE ${t.where}`).bind(...t.args).first<Row>();if(!old)return null;
 // Legacy claims might already have sent a message; they are not safe to reclaim.
 if((old.state==='sending'&&Number(old.lease_expires_at||old.claimed_at+600)<=n)||(old.state==='claimed'&&!old.claim_token&&old.claimed_at+600<=n)){
  const changed=await db.prepare(`UPDATE ${t.table} SET state='unknown',error_category='transport_unknown' WHERE ${t.where} AND state=? AND claimed_at=?`).bind(...t.args,old.state,old.claimed_at).run();
  if(changed.meta.changes)await recordQualityEvent({userId:old.user_id,channel:'whatsapp',category:'whatsapp_unknown',correlationId:randomUUID()});return null;
 }
 const claimToken=randomUUID(),expires=n+600;
 const r=await db.prepare(`UPDATE ${t.table} SET state='claimed',claim_token=?,lease_expires_at=?,claimed_at=?,sending_at=NULL,attempts=attempts+1,error_category=NULL WHERE ${t.where} AND message_id IS NULL AND attempts<3 AND (state='queued' OR state='failed' OR (state='claimed' AND claim_token IS NOT NULL AND lease_expires_at<=?))`).bind(claimToken,expires,n,...t.args,n).run();
 return r.meta.changes?{claimToken,leaseExpiresAt:new Date(expires*1000).toISOString()}:null;
}
export async function beginDelivery(kind:DeliveryKind,key:string|number,claimToken:string,at=new Date()){
 const t=target(kind,key),db=database(),n=seconds(at),row=await db.prepare(`SELECT user_id,state,claim_token,lease_expires_at FROM ${t.table} WHERE ${t.where}`).bind(...t.args).first<Row>();
 if(!row||row.state!=='claimed'||row.claim_token!==claimToken||Number(row.lease_expires_at)<=n)return {dispatch:false};
 const c=await db.prepare('SELECT state,remind_state,verified_at FROM whatsapp_contacts WHERE user_id=?').bind(row.user_id).first<{state:string;remind_state:string;verified_at:string|null}>();
 if(!c?.verified_at||c.state!=='opted_in'||(kind==='reminder'&&c.remind_state!=='on')){await db.prepare(`UPDATE ${t.table} SET state=? WHERE ${t.where} AND state='claimed' AND claim_token=?`).bind(c?.state==='opted_in'?'skipped_paused':'skipped_opted_out',...t.args,claimToken).run();return {dispatch:false}}
 const r=await db.prepare(`UPDATE ${t.table} SET state='sending',sending_at=? WHERE ${t.where} AND state='claimed' AND claim_token=? AND lease_expires_at>?`).bind(n,...t.args,claimToken,n).run();return {dispatch:!!r.meta.changes};
}
export async function reportDelivery(kind:DeliveryKind,input:DeliveryReport,at=new Date()){
 const t=target(kind,kind==='reminder'?input.ref||'':input.id||0),db=database(),row=await db.prepare(`SELECT user_id,state,claim_token,message_id FROM ${t.table} WHERE ${t.where}`).bind(...t.args).first<Row>();
 if(!row||!['claimed','sending','unknown'].includes(row.state))return {updated:false};
 if(input.claimToken?input.claimToken!==row.claim_token:row.state!=='claimed')return {updated:false};
 const messageId=input.ok&&input.messageId?input.messageId:null;
 if(messageId){for(const table of ['whatsapp_reminder_log','whatsapp_outbox'])if(await db.prepare(`SELECT message_id FROM ${table} WHERE message_id=?`).bind(messageId).first())return {updated:false}}
 const state=input.ok?'sent':input.errorCategory==='provider_rejected'||input.errorCategory==='pre_send'||!input.claimToken?'failed':'unknown';
 const r=await db.prepare(`UPDATE ${t.table} SET state=?,message_id=?,accepted_at=?,error_category=? WHERE ${t.where} AND state=? AND (claim_token=? OR (? IS NULL AND claim_token IS NULL))`).bind(state,messageId,input.ok?at.toISOString():null,input.ok?null:input.errorCategory||'transport_unknown',...t.args,row.state,row.claim_token,row.claim_token).run();
 if(r.meta.changes){if(input.ok&&kind==='reminder')await db.prepare('UPDATE whatsapp_contacts SET last_reminder_at=? WHERE user_id=?').bind(at.toISOString(),row.user_id).run();if(!input.ok)await recordQualityEvent({userId:row.user_id,channel:'whatsapp',category:state==='unknown'?'whatsapp_unknown':'whatsapp_send_failed',correlationId:randomUUID()})}
 return {updated:!!r.meta.changes};
}
