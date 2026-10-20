import {normalizeControlCommand,pauseReminders} from './reminder-control';
import {canUseMission} from './mission-access-server';
import {membershipRequired} from './mission-access';
import {env} from 'cloudflare:workers';
import {aiAllowance,reserveAiUse,releaseAiUse} from './ai-usage';
import {bridgeSecret} from './bridge/auth';
import {database} from './storage';
import {loadLearning} from './learning-service';
import {verifyHmac} from './billing/razorpay';
import {aiReady,reviewWork,FeedbackError} from './ai-feedback';
/**
 * WhatsApp lessons and reminders through Meta's WhatsApp Cloud API.
 * Nothing is sent until the WHATSAPP_* settings are present and the learner opts in on the site.
 */
export class WhatsAppError extends Error{constructor(message:string,public status=400,public definiteRejected=false){super(message)}}
export function whatsappConfig(){const e=env as unknown as Record<string,string|undefined>;return {token:e.WHATSAPP_TOKEN||'',phoneNumberId:e.WHATSAPP_PHONE_NUMBER_ID||'',verifyToken:e.WHATSAPP_VERIFY_TOKEN||'',appSecret:e.WHATSAPP_APP_SECRET||'',progressTemplate:e.WHATSAPP_PROGRESS_TEMPLATE||'',performanceTemplate:e.WHATSAPP_PERFORMANCE_TEMPLATE||'',template:e.WHATSAPP_REMINDER_TEMPLATE||'',templateLanguage:e.WHATSAPP_TEMPLATE_LANGUAGE||'en',businessNumber:(e.WHATSAPP_BUSINESS_NUMBER||'').replace(/\D/g,''),cronSecret:e.REMINDER_CRON_SECRET||'',graphVersion:e.WHATSAPP_GRAPH_VERSION||'v23.0',siteUrl:(e.SITE_URL||'https://whatslearn.in').replace(/\/$/,'')}}
export function whatsappReady(){const c=whatsappConfig();return !!(c.token&&c.phoneNumberId&&c.verifyToken&&c.appSecret)}
export function whatsappLinkReady(){const c=whatsappConfig();return whatsappReady()||(bridgeSecret().length>=32&&!!c.appSecret&&!!c.phoneNumberId&&!!c.businessNumber)}
export type Contact={user_id:string;phone:string;state:string;language:string;consent_at:string;opted_out_at:string|null;last_inbound_at:string|null;last_reminder_at:string|null;current_mission:string|null;updated_at:string;verified_at?:string|null;remind_state?:string;remind_hour?:number;remind_freq?:string;quiet_start?:number;quiet_end?:number};
/** Indian mobile numbers may be typed with or without +91; other countries need the country code. */
export function normalisePhone(input:string){const d=input.replace(/[\s()+-]/g,'').replace(/^00/,'');if(!/^\d+$/.test(d))throw new WhatsAppError('Enter digits only, for example 98765 43210.');if(/^[6-9]\d{9}$/.test(d))return '91'+d;if(/^0[6-9]\d{9}$/.test(d))return '91'+d.slice(1);if(/^\d{11,15}$/.test(d))return d;throw new WhatsAppError('Enter a valid WhatsApp number with country code.')}
export const maskPhone=(p:string)=>'+'+p.slice(0,2)+' ••••• '+p.slice(-4);
async function graph(body:Record<string,unknown>){
 const c=whatsappConfig();if(!whatsappReady())throw new WhatsAppError('WhatsApp is not connected yet.',503);
 const r=await fetch(`https://graph.facebook.com/${c.graphVersion}/${c.phoneNumberId}/messages`,{method:'POST',headers:{Authorization:'Bearer '+c.token,'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',...body}),signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw new WhatsAppError('WhatsApp did not accept the message.',502,r.status>=400&&r.status<500);
 return await r.json() as Record<string,unknown>;
}
/** Free-form text. Only allowed within 24 hours of the learner's last message. */
export const sendText=(to:string,text:string)=>graph({to,type:'text',text:{preview_url:true,body:text.slice(0,4000)}});
/** Pre-approved template, required for messages that start a conversation (daily reminders). */
export const sendTemplate=(to:string,name:string,language:string,params:string[])=>graph({to,type:'template',template:{name,language:{code:language},...(params.length?{components:[{type:'body',parameters:params.map(text=>({type:'text',text}))}]}:{})}});
export async function getContact(userId:string){return database().prepare('SELECT * FROM whatsapp_contacts WHERE user_id=?').bind(userId).first<Contact>()}
export async function optIn(userId:string,rawPhone:string,language:string){
 const phone=normalisePhone(rawPhone);const db=database();const now=new Date().toISOString();
 const taken=await db.prepare('SELECT user_id FROM whatsapp_contacts WHERE phone=? AND user_id<>?').bind(phone,userId).first();
 if(taken)throw new WhatsAppError('This number is already linked to another WhatsLearn account.',409);
 await db.prepare("INSERT INTO whatsapp_contacts(user_id,phone,state,language,consent_at,updated_at) VALUES (?,?,'opted_in',?,?,?) ON CONFLICT(user_id) DO UPDATE SET phone=excluded.phone,state='opted_in',language=excluded.language,consent_at=excluded.consent_at,opted_out_at=NULL,updated_at=excluded.updated_at").bind(userId,phone,language,now,now).run();
 return getContact(userId);
}
export async function optOut(userId:string){const now=new Date().toISOString();await database().prepare("UPDATE whatsapp_contacts SET state='opted_out',opted_out_at=?,updated_at=? WHERE user_id=?").bind(now,now,userId).run();return getContact(userId)}
async function lessonMessage(contact:Contact){
 const {path}=await loadLearning(contact.user_id);const c=path.challenge;const url=`${whatsappConfig().siteUrl}/learn?mission=${path.nextMissionId}`;
 if(!await canUseMission(contact.user_id,path.nextMissionId))return {missionId:path.nextMissionId,title:c.title,text:membershipRequired+'\n'+whatsappConfig().siteUrl+'/membership'};
 await database().prepare('UPDATE whatsapp_contacts SET current_mission=?,updated_at=? WHERE user_id=?').bind(path.nextMissionId,new Date().toISOString(),contact.user_id).run();
 return {missionId:path.nextMissionId,title:c.title,text:`*${c.title}* · ${path.sessionMinutes} min\n\n${c.brief}\n\n${c.lesson}\n\n*Your task:* ${c.task}\n\n${c.guidance}\n\nReply here with your answer${aiReady()?' for quick AI feedback':''}, or open it on the site to save it to your portfolio:\n${url}\n\nReply LESSON for the next challenge · STOP to pause messages.`};
}
const STOP=['stop','unsubscribe','cancel','रुको','बंद','ನಿಲ್ಲಿಸಿ'];
const START=['start','resume','unstop'];
const LESSON=['hi','hello','lesson','next','start lesson','menu','नमस्ते','ನಮಸ್ಕಾರ'];
/** Handles one inbound WhatsApp text and returns the reply text (or null for no reply). */
export async function handleInbound(from:string,text:string):Promise<string|null>{
 const db=database();const now=new Date().toISOString();const word=normalizeControlCommand(text);
 const contact=await db.prepare('SELECT * FROM whatsapp_contacts WHERE phone=? AND verified_at IS NOT NULL').bind(from).first<Contact>();
 const site=whatsappConfig().siteUrl;
 if(!contact)return `Welcome to WhatsLearn! To get lessons here, link this number first: sign in at ${site}/settings, switch on WhatsApp lessons, then send the code you see (LINK CODE) from this number.`;
 await db.prepare('UPDATE whatsapp_contacts SET last_inbound_at=?,updated_at=? WHERE user_id=?').bind(now,now,contact.user_id).run();
 if(STOP.includes(word)){await optOut(contact.user_id);return 'You will not get more WhatsLearn reminders. Reply START anytime to turn them back on.'}
 if(word==='pause'){await pauseReminders(contact.user_id);return 'Reminders paused. Your draft is kept.'}
 if(START.includes(word)){await db.prepare("UPDATE whatsapp_contacts SET state='opted_in',opted_out_at=NULL,updated_at=? WHERE user_id=?").bind(now,contact.user_id).run();return 'Welcome back! Reply LESSON for your next challenge.'}
 if(contact.state!=='opted_in')return null;
 if(LESSON.includes(word)||!contact.current_mission)return (await lessonMessage(contact)).text;
 if(word==='help')return 'Reply LESSON for your next challenge, send your answer as a message to get feedback, or STOP to pause messages.';
 if(text.trim().length<20)return 'Send a few sentences as your answer, or reply LESSON for the next challenge.';
 const url=`${site}/learn?mission=${contact.current_mission}`;
 if(!aiReady())return `Thanks! Your answer is saved in this chat. To add it to your portfolio and check it against the self-review list, open:\n${url}`;
 if(!await canUseMission(contact.user_id,contact.current_mission))return membershipRequired+'\n'+site+'/membership';
 const allowance=await aiAllowance(contact.user_id);
 if(!await reserveAiUse(contact.user_id,allowance.limit))return `Today's ${allowance.limit} AI requests are used. Continue your lesson on the website; AI help resets at midnight India time.`;
 try{
  const r=await reviewWork(contact.current_mission,text,contact.language,(await loadLearning(contact.user_id)).profile.level);
  const checks=r.checks.map(c=>`${c.met?'✅':'▫️'} ${c.item}${c.note?' · '+c.note:''}`).join('\n');
  return `${r.summary}\n\n${checks}${r.nextStep?`\n\n*Next:* ${r.nextStep}`:''}\n\nSave your improved version here:\n${url}\n\nAI feedback can be wrong. Reply LESSON for the next challenge.`;
 }catch(e){await releaseAiUse(contact.user_id);if(e instanceof FeedbackError&&e.status===422)return e.message;return `I couldn't review that just now. Your answer is safe in this chat; you can also open the challenge here:\n${url}`}
}
export async function processWebhook(raw:string,signature:string){
 const c=whatsappConfig();if(!whatsappReady())throw new WhatsAppError('WhatsApp is not connected yet.',503);
 if(!signature.startsWith('sha256=')||!await verifyHmac(c.appSecret,raw,signature.slice(7)))throw new WhatsAppError('Invalid signature.',401);
 const body=JSON.parse(raw) as {entry?:{changes?:{value?:{messages?:{id:string;from:string;type:string;text?:{body:string};button?:{text:string}}[]}}[]}[]};
 await (await import('./bridge/reminder-delivery')).receiveStatusWebhook(raw,signature);
 const db=database();let handled=0;
 for(const entry of body.entry||[])for(const change of entry.changes||[])for(const m of change.value?.messages||[]){
  const seen=await db.prepare('INSERT OR IGNORE INTO whatsapp_events(id,kind,processed_at) VALUES (?,?,?)').bind(m.id,m.type,new Date().toISOString()).run();
  if(!seen.meta.changes)continue;
  const text=m.type==='text'?m.text?.body||'':m.type==='button'?m.button?.text||'':'';
  const reply=text?await handleInbound(m.from,text):'Please send text. Reply LESSON for your next challenge.';
  if(reply)await sendText(m.from,reply).catch(()=>null);handled++;
 }
 return {received:true,handled};
}
/** Reminder run without n8n (the old scheduler endpoint). It uses the same rules as the n8n workflow: opt-in, chosen hour and frequency, quiet hours, one per day, template outside the 24-hour window. */
export async function sendReminders(limit=100){
 const c=whatsappConfig();if(!whatsappReady())throw new WhatsAppError('WhatsApp reminders are not configured.',503);
 const {claimReminders,reportReminders}=await import('./bridge/whatsapp-jobs');
 const {beginDelivery}=await import('./bridge/reminder-delivery');
 const {items,skipped}=await claimReminders(limit);const results:import('./bridge/reminder-delivery').DeliveryReport[]=[];
 for(const it of items){
  if(!(await beginDelivery('reminder',it.ref,it.claimToken)).dispatch)continue;
  try{const response=it.mode==='text'?await sendText(it.to,it.text!):await sendTemplate(it.to,it.template!.name,it.template!.language,it.template!.params);const id=(response.messages as {id?:string}[]|undefined)?.[0]?.id;results.push({ref:it.ref,claimToken:it.claimToken,ok:!!id,...(id?{messageId:id}:{errorCategory:'transport_unknown' as const})})}
  catch(e){results.push({ref:it.ref,claimToken:it.claimToken,ok:false,errorCategory:e instanceof WhatsAppError&&e.definiteRejected?'provider_rejected':'transport_unknown'})}
 }
 await reportReminders(results);void c;
 return {due:items.length,sent:results.filter(r=>r.ok).length,failed:results.filter(r=>!r.ok).length,skipped};
}
