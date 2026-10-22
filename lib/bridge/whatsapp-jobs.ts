import {messageCopy} from '../question-translations';
import {localizeMission} from '../personalization';
import {guestOnlyLearner} from '../learner-eligibility';
import {performanceTemplate,reminderCopy} from '../reminder-copy';
import {claimDelivery,reportDelivery,type DeliveryReport} from './reminder-delivery';
import {recordQualityEvent} from '../quality/events';
import {database} from '../storage';
import {pointsBalance} from '../points';
import {whatsappConfig} from '../whatsapp';
import {missions} from '../missions';
import {inQuiet} from './whatsapp-chat';
import {learnerPerformance} from '../learner-performance';
/**
 * Scheduled and background jobs for the n8n workflows. WhatsLearn decides who is due, whether a free message or an approved template is allowed, and what the text says.
 * n8n only sends what it is given and reports back. Claim leases recover interrupted pre-send work. Ambiguous accepted sends are not retried automatically.
 */
const WINDOW_MS=24*36e5;
const ist=(d:Date)=>{const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',hourCycle:'h23',weekday:'short',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);const g=(t:string)=>p.find(x=>x.type===t)!.value;return {hour:Number(g('hour')),weekday:g('weekday'),day:`${g('year')}-${g('month')}-${g('day')}`}};
type C={user_id:string;phone:string;language:string;last_inbound_at:string|null;remind_hour:number;remind_freq:string;quiet_start:number;quiet_end:number};
const inWindow=(c:{last_inbound_at:string|null},at:Date)=>!!c.last_inbound_at&&at.getTime()-Date.parse(c.last_inbound_at)<WINDOW_MS;

export type ReminderItem={ref:string;to:string;mode:'text'|'template';text?:string;template?:{name:string;language:string;params:string[]};claimToken:string;leaseExpiresAt:string};
/** Signed, read-only operations view: no phone numbers, names, drafts or credentials. */
export async function reminderDiagnostics(at=new Date()){
 const db=database(),cfg=whatsappConfig();
 const contacts=(await db.prepare("SELECT state,remind_state,COUNT(*) count FROM whatsapp_contacts WHERE verified_at IS NOT NULL GROUP BY state,remind_state").all()).results;
 const schedules=(await db.prepare("SELECT remind_hour,remind_freq,quiet_start,quiet_end,COUNT(*) count FROM whatsapp_contacts WHERE state='opted_in' AND verified_at IS NOT NULL AND remind_state='on' GROUP BY remind_hour,remind_freq,quiet_start,quiet_end").all()).results;
 const recent=(await db.prepare("SELECT slot,state,COUNT(*) count FROM whatsapp_reminder_log WHERE slot>=? GROUP BY slot,state ORDER BY slot DESC LIMIT 30").bind(ist(new Date(at.getTime()-7*864e5)).day).all()).results;
 return {checkedAt:at.toISOString(),indiaTime:ist(at),contacts,schedules,recent,template:{configured:!!(cfg.progressTemplate||cfg.performanceTemplate),name:cfg.progressTemplate||cfg.performanceTemplate||null,language:cfg.templateLanguage,parameterCount:cfg.progressTemplate?2:cfg.performanceTemplate?4:0,approvalVerified:false},note:'Configured does not mean Meta-approved or delivered. This read-only check claims no reminders.'};
}
export async function claimReminders(limit=50,at=new Date(),staged=true){
 const cfg=whatsappConfig(),t=ist(at),db=database();
 const rows=(await db.prepare("SELECT c.user_id,c.phone,c.language,c.last_inbound_at,c.remind_hour,c.remind_freq,c.quiet_start,c.quiet_end FROM whatsapp_contacts c WHERE c.state='opted_in' AND c.verified_at IS NOT NULL AND c.remind_state='on' AND NOT EXISTS (SELECT 1 FROM learner_context a WHERE a.user_id=c.user_id AND json_extract(a.answers,'$.ageBand')='under-18') AND c.remind_hour<=? AND c.remind_hour>? AND (c.remind_freq!='weekly' OR ?='Mon') AND (c.remind_freq!='weekdays' OR ? NOT IN ('Sat','Sun')) AND (c.quiet_start=c.quiet_end OR c.quiet_start<c.quiet_end AND NOT (? >= c.quiet_start AND ? < c.quiet_end) OR c.quiet_start>c.quiet_end AND NOT (? >= c.quiet_start OR ? < c.quiet_end)) AND NOT EXISTS (SELECT 1 FROM whatsapp_reminder_log l WHERE l.user_id=c.user_id AND l.slot=? AND (l.state NOT IN ('queued','failed','claimed','sending') OR l.state IN ('claimed','sending') AND COALESCE(l.lease_expires_at,l.claimed_at+600)>? OR l.state IN ('failed','claimed') AND l.attempts>=3)) ORDER BY c.user_id LIMIT 1000").bind(t.hour,t.hour-2,t.weekday,t.weekday,t.hour,t.hour,t.hour,t.hour,t.day,Math.floor(at.getTime()/1000)).all<C>()).results;
 const items:ReminderItem[]=[];let skipped=0;
 for(const c of rows){
  if(items.length>=limit)break;
  if(inQuiet(t.hour,c.quiet_start,c.quiet_end))continue;                      // quiet hours are never broken
  if(t.hour<c.remind_hour||t.hour>=c.remind_hour+2)continue;                  // due hour, plus one more hour so a late or retried run still delivers it once
  if(c.remind_freq==='weekdays'&&['Sat','Sun'].includes(t.weekday))continue;
  if(c.remind_freq==='weekly'&&t.weekday!=='Mon')continue;
  const slot=t.day,ref=`${c.user_id}|${slot}`;
  await db.prepare("INSERT OR IGNORE INTO whatsapp_reminder_log(user_id,slot,state,claimed_at) VALUES (?,?,'queued',?)").bind(c.user_id,slot,Math.floor(at.getTime()/1000)).run();
  const claim=await claimDelivery('reminder',ref,at,staged);if(!claim)continue;
  const mark=(state:string)=>db.prepare('UPDATE whatsapp_reminder_log SET state=? WHERE user_id=? AND slot=?').bind(state,c.user_id,slot).run();
  // The performance recap replaces the nudge: one message at the chosen frequency/time.
  const performance=await learnerPerformance(c.user_id,at);const template=performanceTemplate(c.language);const copy=reminderCopy(c.language);
  if(inWindow(c,at)){items.push({ref,...claim,to:c.phone,mode:'text',text:performance.text+'\n'+copy.pause});continue}
  // Outside the service window the exact recap template must be approved; never reuse a lesson template.
  if(!template){await mark('skipped_no_performance_template');skipped++;continue}
  items.push({ref,...claim,to:c.phone,mode:'template',template:{name:template!.name,language:template!.language,params:template!.kind==='progress'?[String(performance.count),performance.nextTitle]:[String(performance.todayPoints),String(performance.streak),String(performance.count),String(performance.weekMissions)]}});

 }
 return {items,skipped};
}
export async function reportReminders(results:DeliveryReport[]){let updated=0;for(const r of results){if(!/^([^|]{1,128})\|(\d{4}-\d{2}-\d{2})$/.test(r.ref||''))continue;if((await reportDelivery('reminder',r)).updated)updated++}return {updated}}

// ---------- website to WhatsApp notices ----------
/** Queue a short notice for a learner who finished something on the website. Does nothing unless the learner has a verified, opted-in WhatsApp link. Once per (learner, kind, ref). */
export async function queueNotice(userId:string,kind:'mission'|'badge'|'recap',ref:string,payload:Record<string,unknown>){
 const db=database();
 const c=await db.prepare("SELECT 1 x FROM whatsapp_contacts WHERE user_id=? AND state='opted_in' AND verified_at IS NOT NULL").bind(userId).first();
 if(!c||await guestOnlyLearner(userId))return false;
 const r=await db.prepare('INSERT OR IGNORE INTO whatsapp_outbox(user_id,kind,ref,payload,created_at) VALUES (?,?,?,?,?)').bind(userId,kind,ref,JSON.stringify(payload),new Date().toISOString()).run();
 return !!r.meta.changes;
}
export async function claimNotices(limit=20,at=new Date(),noticeId?:number,staged=true){
 const db=database();
 // A signed diagnostic can target one known notice without touching other learners.
 const rows=(await db.prepare("SELECT o.id,o.user_id,o.kind,o.payload,c.phone,c.language,c.last_inbound_at,c.state FROM whatsapp_outbox o JOIN whatsapp_contacts c ON c.user_id=o.user_id WHERE (o.state='queued' OR (o.state='failed' AND o.message_id IS NULL AND o.attempts<3) OR (o.state IN ('claimed','sending') AND COALESCE(o.lease_expires_at,o.claimed_at+600)<=?)) AND o.created_at>? AND (? IS NULL OR o.id=?) ORDER BY o.id LIMIT ?").bind(Math.floor(at.getTime()/1000),new Date(at.getTime()-3*864e5).toISOString(),noticeId??null,noticeId??null,limit).all<{id:number;user_id:string;kind:string;payload:string;phone:string;language:string;last_inbound_at:string|null;state:string}>()).results;
 const items:{id:number;to:string;text:string;claimToken:string;leaseExpiresAt:string}[]=[];
 for(const o of rows){
  const claim=await claimDelivery('notice',o.id,at,staged);if(!claim)continue;
  // Learner opted out since, or the 24-hour window is closed: no message (a notice is not worth an approved template).
  const ageRestricted=await guestOnlyLearner(o.user_id);if(ageRestricted||o.state!=='opted_in'||!inWindow(o,at)){await db.prepare("UPDATE whatsapp_outbox SET state=? WHERE id=?").bind(ageRestricted?'skipped_age_restricted':o.state!=='opted_in'?'skipped_opted_out':'skipped_window',o.id).run();continue}
  const p=JSON.parse(o.payload) as {recap?:string;title?:string;status?:string;points?:number};const balance=await pointsBalance(o.user_id);
  const mission=missions.find(m=>m.id===(p as {missionId?:string}).missionId),copy=messageCopy(o.language);
  const title=mission?localizeMission(mission,o.language).title:p.title||'';
  const performance=o.kind==='mission'&&p.status==='awarded'?await learnerPerformance(o.user_id,at):null;
  const star=performance?.star.earned?'\n🌟 '+copy.star:'';
  const text=o.kind==='recap'?String(p.recap||copy.continue).slice(0,3900):o.kind==='badge'?`🏅 ${copy.checkpoint}: *${title}*\n${copy.synced}\n${copy.continue}`
   :p.status==='awarded'?`✅ ${copy.saved}: *${title}*\n+${p.points??0} · 🔥 ${performance?.streak||0} ${copy.streak}\n💎 ${balance} ${copy.total} · ${copy.synced}${star}\n${copy.continue}`
   :`✅ ${copy.practiceSaved}: *${title}*\n💎 ${balance} ${copy.total} · ${copy.synced}\n${copy.continue}`;
  items.push({id:o.id,...claim,to:o.phone,text});
 }
 return {items};
}
export async function reportNotices(results:DeliveryReport[]){let updated=0;for(const r of results){if(!Number.isInteger(r.id)||r.id!<1)continue;if((await reportDelivery('notice',r)).updated)updated++}return {updated}}
