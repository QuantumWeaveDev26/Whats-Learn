import {randomUUID} from 'node:crypto';
import {env} from 'cloudflare:workers';
import {database} from '../storage';
const config=()=>{const e=env as unknown as Record<string,string|undefined>;let url='';try{const u=new URL(e.SUPPORT_ALERT_WEBHOOK_URL||'');if(u.protocol==='https:'&&!u.username&&!u.password&&!['localhost','127.0.0.1','[::1]'].includes(u.hostname))url=u.href}catch{}return {url,token:e.SUPPORT_ALERT_WEBHOOK_TOKEN||'',site:e.SITE_URL||'https://whatslearn.in'}};
export async function servicePulse(name:'notices'|'reminders',at=new Date()){await database().prepare('INSERT INTO service_pulses(name,checked_at) VALUES (?,?) ON CONFLICT(name) DO UPDATE SET checked_at=excluded.checked_at').bind(name,at.toISOString()).run()}
/** An explicit owner retry reopens exhausted failures; automatic polls never do. */
export async function retryFailedAlerts(at=new Date()){await database().prepare("UPDATE quality_alerts SET state='failed',attempts=0,next_at=0 WHERE state='failed' OR (state='sending' AND lease_until<=?)").bind(Math.floor(at.getTime()/1000)).run()}
export async function alertStatus(){const db=database(),c=config();const rows=(await db.prepare('SELECT state,COUNT(*) count FROM quality_alerts GROUP BY state').all<{state:string;count:number}>()).results;const pulses=(await db.prepare('SELECT name,checked_at FROM service_pulses').all<{name:string;checked_at:string}>()).results;return {configured:!!c.url&&c.token.length>=32,counts:Object.fromEntries(rows.map(r=>[r.state,Number(r.count)])),pulses:Object.fromEntries(pulses.map(r=>[r.name,r.checked_at])),note:'Accepted means the staff alert endpoint received it, not that a person has read it.'}}
/** Only opaque references leave the site. The receiver must deduplicate eventId. */
export async function dispatchAlerts(at=new Date()){
 const c=config();if(!c.url||c.token.length<32)return {configured:false,accepted:0};const db=database(),now=Math.floor(at.getTime()/1000);
 await db.prepare("UPDATE quality_alerts SET state='failed',lease_until=NULL WHERE state='sending' AND lease_until<=? AND attempts>=5").bind(now).run();
 const rows=(await db.prepare("SELECT id,kind,item_id FROM quality_alerts WHERE (state IN ('queued','failed') OR (state='sending' AND lease_until<=?)) AND attempts<5 AND next_at<=? ORDER BY created_at LIMIT 1").bind(now,now).all<{id:string;kind:string;item_id:string}>()).results;let accepted=0;
 for(const row of rows){const token=randomUUID();const claim=await db.prepare("UPDATE quality_alerts SET state='sending',attempts=attempts+1,lease_token=?,lease_until=? WHERE id=? AND (state IN ('queued','failed') OR (state='sending' AND lease_until<=?)) AND attempts<5 AND next_at<=?").bind(token,now+60,row.id,now,now).run();if(!claim.meta.changes)continue;
  let ok=false;try{const r=await fetch(c.url,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json',Authorization:'Bearer '+c.token,'Idempotency-Key':row.id},body:JSON.stringify({eventId:row.id,type:'whatslearn_support',kind:row.kind,reference:row.item_id,url:c.site.replace(/\/$/,'')+'/admin/quality'}),signal:AbortSignal.timeout(3000)});ok=r.ok;await r.body?.cancel()}catch{}
  await db.prepare("UPDATE quality_alerts SET state=?,accepted_at=?,lease_until=NULL,next_at=? WHERE id=? AND lease_token=?").bind(ok?'accepted':'failed',ok?at.toISOString():null,now+300,row.id,token).run();if(ok)accepted++;
 }
 return {configured:true,accepted};
}
