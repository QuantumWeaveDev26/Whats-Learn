import {briefFocus} from '@/lib/chat-copy';
import {queueNotice} from '@/lib/bridge/whatsapp-jobs';
import {z} from 'zod';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {sameOrigin,database} from '@/lib/storage';
import {languageCodes} from '@/lib/languages';
import {getContact,maskPhone,normalisePhone,sendText,whatsappConfig,whatsappReady,whatsappLinkReady,WhatsAppError,type Contact} from '@/lib/whatsapp';
import {loadLearning} from '@/lib/learning-service';
import {feedbackSummary} from '@/lib/review-summary';
import {allow} from '@/lib/auth/limits';
import {startLink,unlink} from '@/lib/bridge/whatsapp-chat';
const input=z.discriminatedUnion('action',[
 z.object({action:z.literal('optin'),phone:z.string().max(25),language:z.enum(languageCodes),consent:z.literal(true)}).strict(),
 z.object({action:z.literal('optout')}).strict(),
 z.object({action:z.literal('recap')}).strict()
]);
const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const view=(c:Contact|null,link?:{code:string|null;expiresAt:string|null})=>c?{phone:maskPhone(c.phone),state:c.state,since:c.consent_at,verified:!!c.verified_at,...(link&&link.code?{linkCode:link.code,linkExpires:link.expiresAt}:{})}:null;
async function reminderStatus(userId:string){
 const c=await getContact(userId);if(!c?.verified_at)return null;
 const latest=await database().prepare('SELECT slot,state FROM whatsapp_reminder_log WHERE user_id=? ORDER BY slot DESC LIMIT 1').bind(userId).first<{slot:string;state:string}>();
 return {enabled:c.state==='opted_in'&&c.remind_state==='on',hour:c.remind_hour??19,frequency:c.remind_freq||'daily',quietStart:c.quiet_start??21,quietEnd:c.quiet_end??8,timeZone:'Asia/Kolkata',lastInboundAt:c.last_inbound_at,lastAcceptedAt:c.last_reminder_at,latest:latest||null};
}
export async function GET(){if(!whatsappLinkReady())return response({configured:false});const business=whatsappConfig().businessNumber;const user=await getChatGPTUser();if(!user)return response({configured:true,signInRequired:true,business});try{const recap=await database().prepare("SELECT id,state FROM whatsapp_outbox WHERE user_id=? AND kind='recap' ORDER BY id DESC LIMIT 1").bind(user.userId).first<{id:number;state:string}>();return response({configured:true,business,recapStatus:recap?.state,recapId:recap?.id,performanceRemindersReady:!!(whatsappConfig().progressTemplate||whatsappConfig().performanceTemplate),contact:view(await getContact(user.userId)),reminder:await reminderStatus(user.userId)})}catch{return response({configured:true,business,error:'Could not load your WhatsApp settings.'},503)}}
export async function POST(request:Request){
 if(!sameOrigin(request))return response({error:'Invalid origin.'},403);
 if(!whatsappLinkReady())return response({error:'WhatsApp lessons are not connected yet.'},503);
 const user=await getChatGPTUser();if(!user)return response({error:'Sign in to connect your WhatsApp lessons.'},401);
 try{const p=input.parse(await request.json());if(p.action==='recap'){
 const contact=await getContact(user.userId);
 if(!contact?.verified_at||contact.state!=='opted_in')return response({error:'Link and verify your own WhatsApp number first.'},403);
 const elapsed=Date.now()-Date.parse(contact.last_inbound_at||'');
 if(!Number.isFinite(elapsed)||elapsed<0||elapsed>=24*60*60*1000)return response({error:'Send TODAY to the WhatsLearn mentor from your WhatsApp first, then retry. WhatsApp requires a recent message from you before we can send this recap.'},409);
 if(!await allow('whatsapp-recap',user.userId,1,60))return response({error:'A recap was requested recently. Wait a minute before retrying.'},429);
 const {path}=await loadLearning(user.userId);const feedback=path.lastFeedback?feedbackSummary(path.lastFeedback):null;
 const focus=path.focus?.instruction||feedback?.next||path.reason;
 const text=`*Your WhatsLearn continuation*\n${path.progress.creations}/10 saved\nNext task: *${path.challenge.title}*\nFocus: ${briefFocus(focus)}\n${whatsappConfig().siteUrl}/learn?mission=${path.nextMissionId}\n*TODAY* → continue · *STOP* → pause`;
 if(!whatsappReady()){const queued=await queueNotice(user.userId,'recap','manual-'+Math.floor(Date.now()/60000),{recap:text});if(!queued)return response({error:'This recap is already queued, or your WhatsApp link changed. Refresh and check your connection.'},409);return response({queued:true,recapStatus:'queued',message:'Your learning recap is queued for the WhatsLearn mentor connection. Delivery has not yet been confirmed.',contact:view(contact)});}
 await sendText(contact.phone,text);
 return response({accepted:true,message:'WhatsApp accepted your learning recap. Check your linked phone; delivery has not yet been confirmed.',contact:view(contact)});
 }if(p.action==='optout'){await unlink(user.userId);return response({performanceRemindersReady:!!(whatsappConfig().progressTemplate||whatsappConfig().performanceTemplate),contact:view(await getContact(user.userId)),business:whatsappConfig().businessNumber})}const r=await startLink(user.userId,normalisePhone(p.phone),p.language,undefined,user.fullName||user.displayName);if(!r.ok)return response({error:r.message},r.status);return response({contact:view(await getContact(user.userId),r),business:whatsappConfig().businessNumber})}
 catch(e){if(e instanceof WhatsAppError)return response({error:e.message},e.status);if(e instanceof z.ZodError)return response({error:'Tick the consent box and enter your number.'},400);return response({error:'Could not save. Please try again.'},503)}
}
