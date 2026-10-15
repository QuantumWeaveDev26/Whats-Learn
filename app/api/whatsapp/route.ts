import {z} from 'zod';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {sameOrigin} from '@/lib/storage';
import {languageCodes} from '@/lib/languages';
import {getContact,maskPhone,normalisePhone,whatsappConfig,whatsappReady,WhatsAppError,type Contact} from '@/lib/whatsapp';
import {startLink,unlink} from '@/lib/bridge/whatsapp-chat';
const input=z.discriminatedUnion('action',[
 z.object({action:z.literal('optin'),phone:z.string().max(25),language:z.enum(languageCodes),consent:z.literal(true)}).strict(),
 z.object({action:z.literal('optout')}).strict()
]);
const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const view=(c:Contact|null,link?:{code:string|null;expiresAt:string|null})=>c?{phone:maskPhone(c.phone),state:c.state,since:c.consent_at,verified:!!c.verified_at,...(link&&link.code?{linkCode:link.code,linkExpires:link.expiresAt}:{})}:null;
export async function GET(){if(!whatsappReady())return response({configured:false});const business=whatsappConfig().businessNumber;const user=await getChatGPTUser();if(!user)return response({configured:true,signInRequired:true,business});try{return response({configured:true,business,contact:view(await getContact(user.userId))})}catch{return response({configured:true,business,error:'Could not load your WhatsApp settings.'},503)}}
export async function POST(request:Request){
 if(!sameOrigin(request))return response({error:'Invalid origin.'},403);
 if(!whatsappReady())return response({error:'WhatsApp lessons are not connected yet.'},503);
 const user=await getChatGPTUser();if(!user)return response({error:'Sign in with ChatGPT to turn on WhatsApp lessons.'},401);
 try{const p=input.parse(await request.json());if(p.action==='optout'){await unlink(user.userId);return response({contact:view(await getContact(user.userId)),business:whatsappConfig().businessNumber})}const r=await startLink(user.userId,normalisePhone(p.phone),p.language);if(!r.ok)return response({error:r.message},r.status);return response({contact:view(await getContact(user.userId),r),business:whatsappConfig().businessNumber})}
 catch(e){if(e instanceof WhatsAppError)return response({error:e.message},e.status);if(e instanceof z.ZodError)return response({error:'Tick the consent box and enter your number.'},400);return response({error:'Could not save. Please try again.'},503)}
}
