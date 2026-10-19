import {database} from '../storage';
import {pointsBalance} from '../points';
import {whatsappConfig} from '../whatsapp';
import {missions} from '../missions';
import {inQuiet} from './whatsapp-chat';
import {learnerPerformance} from '../learner-performance';
/**
 * Scheduled and background jobs for the n8n workflows. WhatsLearn decides who is due, whether a free message or an approved template is allowed, and what the text says.
 * n8n only sends what it is given and reports back. At-most-once: a reminder slot or a notice is claimed before it is sent, so a retried workflow run cannot send it twice.
 */
const WINDOW_MS=24*36e5;
const ist=(d:Date)=>{const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',hourCycle:'h23',weekday:'short',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);const g=(t:string)=>p.find(x=>x.type===t)!.value;return {hour:Number(g('hour')),weekday:g('weekday'),day:`${g('year')}-${g('month')}-${g('day')}`}};
type C={user_id:string;phone:string;language:string;last_inbound_at:string|null;remind_hour:number;remind_freq:string;quiet_start:number;quiet_end:number};
const inWindow=(c:{last_inbound_at:string|null},at:Date)=>!!c.last_inbound_at&&at.getTime()-Date.parse(c.last_inbound_at)<WINDOW_MS;

export type ReminderItem={ref:string;to:string;mode:'text'|'template';text?:string;template?:{name:string;language:string;params:string[]}};
/** Signed, read-only operations view: no phone numbers, names, drafts or credentials. */
export async function reminderDiagnostics(at=new Date()){
 const db=database(),cfg=whatsappConfig();
 const contacts=(await db.prepare("SELECT state,remind_state,COUNT(*) count FROM whatsapp_contacts WHERE verified_at IS NOT NULL GROUP BY state,remind_state").all()).results;
 const schedules=(await db.prepare("SELECT remind_hour,remind_freq,quiet_start,quiet_end,COUNT(*) count FROM whatsapp_contacts WHERE state='opted_in' AND verified_at IS NOT NULL AND remind_state='on' GROUP BY remind_hour,remind_freq,quiet_start,quiet_end").all()).results;
 const recent=(await db.prepare("SELECT slot,state,COUNT(*) count FROM whatsapp_reminder_log WHERE slot>=? GROUP BY slot,state ORDER BY slot DESC LIMIT 30").bind(ist(new Date(at.getTime()-7*864e5)).day).all()).results;
 return {checkedAt:at.toISOString(),indiaTime:ist(at),contacts,schedules,recent,template:{configured:!!(cfg.progressTemplate||cfg.performanceTemplate),name:cfg.progressTemplate||cfg.performanceTemplate||null,language:cfg.templateLanguage,parameterCount:cfg.progressTemplate?2:cfg.performanceTemplate?4:0,approvalVerified:false},note:'Configured does not mean Meta-approved or delivered. This read-only check claims no reminders.'};
}
export async function claimReminders(limit=50,at=new Date()){
 const cfg=whatsappConfig(),t=ist(at),db=database();
 const rows=(await db.prepare("SELECT user_id,phone,language,last_inbound_at,remind_hour,remind_freq,quiet_start,quiet_end FROM whatsapp_contacts WHERE state='opted_in' AND verified_at IS NOT NULL AND remind_state='on' LIMIT 1000").all<C>()).results;
 const items:ReminderItem[]=[];let skipped=0;
 for(const c of rows){
  if(items.length>=limit)break;
  if(inQuiet(t.hour,c.quiet_start,c.quiet_end))continue;                      // quiet hours are never broken
  if(t.hour<c.remind_hour||t.hour>=c.remind_hour+2)continue;                  // due hour, plus one more hour so a late or retried run still delivers it once
  if(c.remind_freq==='weekdays'&&['Sat','Sun'].includes(t.weekday))continue;
  if(c.remind_freq==='weekly'&&t.weekday!=='Mon')continue;
  const slot=t.day,ref=`${c.user_id}|${slot}`;
  const claim=await db.prepare("INSERT OR IGNORE INTO whatsapp_reminder_log(user_id,slot,state,claimed_at) VALUES (?,?,'claimed',?)").bind(c.user_id,slot,Math.floor(at.getTime()/1000)).run();
  if(!claim.meta.changes){
   // Only a send that n8n reported as failed is tried again; claimed, sent and skipped slots never are.
   const re=await db.prepare("UPDATE whatsapp_reminder_log SET state='claimed',claimed_at=? WHERE user_id=? AND slot=? AND state='failed'").bind(Math.floor(at.getTime()/1000),c.user_id,slot).run();
   if(!re.meta.changes)continue;
  }
  const mark=(state:string)=>db.prepare('UPDATE whatsapp_reminder_log SET state=? WHERE user_id=? AND slot=?').bind(state,c.user_id,slot).run();
  // The performance recap replaces the nudge: one message at the chosen frequency/time.
  const performance=await learnerPerformance(c.user_id,at);
  if(inWindow(c,at)){items.push({ref,to:c.phone,mode:'text',text:performance.text+'\n*REMIND OFF* → pause'});continue}
  // Outside the service window the exact recap template must be approved; never reuse a lesson template.
  if(!cfg.progressTemplate&&!cfg.performanceTemplate){await mark('skipped_no_performance_template');skipped++;continue}
  items.push({ref,to:c.phone,mode:'template',template:{name:cfg.progressTemplate||cfg.performanceTemplate,language:cfg.templateLanguage,params:cfg.progressTemplate?[String(performance.count),performance.nextTitle]:[String(performance.todayPoints),String(performance.streak),String(performance.count),String(performance.weekMissions)]}});

 }
 return {items,skipped};
}
export async function reportReminders(results:{ref:string;ok:boolean}[]){
 const db=database();let updated=0;
 for(const r of results){
  const m=/^([^|]{1,128})\|(\d{4}-\d{2}-\d{2})$/.exec(r.ref||'');if(!m)continue;
  const x=await db.prepare("UPDATE whatsapp_reminder_log SET state=? WHERE user_id=? AND slot=? AND state='claimed'").bind(r.ok?'sent':'failed',m[1],m[2]).run();
  if(x.meta.changes){updated++;if(r.ok)await db.prepare('UPDATE whatsapp_contacts SET last_reminder_at=? WHERE user_id=?').bind(new Date().toISOString(),m[1]).run()}
 }
 return {updated};
}

// ---------- website to WhatsApp notices ----------
/** Queue a short notice for a learner who finished something on the website. Does nothing unless the learner has a verified, opted-in WhatsApp link. Once per (learner, kind, ref). */
export async function queueNotice(userId:string,kind:'mission'|'badge'|'recap',ref:string,payload:Record<string,unknown>){
 const db=database();
 const c=await db.prepare("SELECT 1 x FROM whatsapp_contacts WHERE user_id=? AND state='opted_in' AND verified_at IS NOT NULL").bind(userId).first();
 if(!c)return false;
 const r=await db.prepare('INSERT OR IGNORE INTO whatsapp_outbox(user_id,kind,ref,payload,created_at) VALUES (?,?,?,?,?)').bind(userId,kind,ref,JSON.stringify(payload),new Date().toISOString()).run();
 return !!r.meta.changes;
}
export async function claimNotices(limit=20,at=new Date(),noticeId?:number){
 const db=database();
 // A signed diagnostic can target one known notice without touching other learners.
 const rows=(await db.prepare("SELECT o.id,o.user_id,o.kind,o.payload,c.phone,c.last_inbound_at,c.state FROM whatsapp_outbox o JOIN whatsapp_contacts c ON c.user_id=o.user_id WHERE o.state='queued' AND o.created_at>? AND (? IS NULL OR o.id=?) ORDER BY o.id LIMIT ?").bind(new Date(at.getTime()-3*864e5).toISOString(),noticeId??null,noticeId??null,limit).all<{id:number;user_id:string;kind:string;payload:string;phone:string;last_inbound_at:string|null;state:string}>()).results;
 const items:{id:number;to:string;text:string}[]=[];
 for(const o of rows){
  const take=await db.prepare("UPDATE whatsapp_outbox SET state='claimed',claimed_at=? WHERE id=? AND state='queued'").bind(Math.floor(at.getTime()/1000),o.id).run();
  if(!take.meta.changes)continue;
  // Learner opted out since, or the 24-hour window is closed: no message (a notice is not worth an approved template).
  if(o.state!=='opted_in'||!inWindow(o,at)){await db.prepare("UPDATE whatsapp_outbox SET state=? WHERE id=?").bind(o.state!=='opted_in'?'skipped_opted_out':'skipped_window',o.id).run();continue}
  const p=JSON.parse(o.payload) as {recap?:string;title?:string;status?:string;points?:number};const balance=await pointsBalance(o.user_id);
  const title=p.title||missions.find(m=>m.id===(p as {missionId?:string}).missionId)?.title||'your mission';
  const performance=o.kind==='mission'&&p.status==='awarded'?await learnerPerformance(o.user_id,at):null;
  const star=performance?.star.earned?'\n🌟 *Star Learner unlocked!* 10 useful creations completed. Help and breaks are welcome.':'';
  const text=o.kind==='recap'?String(p.recap||'Continue your learning on the website.').slice(0,3900):o.kind==='badge'?`🏅 Checkpoint cleared: *${title}*\nWebsite synced. *TODAY* → next move.`
   :p.status==='awarded'?`✅ Built it. Saved it. *${title}*\n+${p.points??0} points · 🔥 ${performance?.streak||0}-day streak\n💎 ${balance} total · website synced${star}\n*TODAY* → what’s next.`
   :`🙌 Practice saved: *${title}*\n💎 ${balance} points · website synced\n*TODAY* → next step.`;
  items.push({id:o.id,to:o.phone,text});
 }
 return {items};
}
export async function reportNotices(results:{id:number;ok:boolean}[]){
 const db=database();let updated=0;
 for(const r of results){if(!Number.isInteger(r.id))continue;const x=await db.prepare("UPDATE whatsapp_outbox SET state=? WHERE id=? AND state='claimed'").bind(r.ok?'sent':'failed',r.id).run();if(x.meta.changes)updated++}
 return {updated};
}
