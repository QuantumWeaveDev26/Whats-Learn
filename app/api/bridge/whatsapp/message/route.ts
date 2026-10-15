import {z} from 'zod';
import {bridge} from '@/lib/bridge/auth';
import {handleBridgeMessage} from '@/lib/bridge/whatsapp-chat';
import {whatsappConfig} from '@/lib/whatsapp';
import {verifyHmac} from '@/lib/billing/razorpay';
const input=z.object({wamid:z.string().min(8).max(200),from:z.string().min(8).max(20),type:z.string().max(30).default('text'),text:z.string().max(4096).default(''),metaRawBody:z.string().max(90000).optional(),metaSignature:z.string().max(100).optional()}).strict();
/** Signed endpoint for the "WhatsLearn incoming WhatsApp chat" workflow. Returns what n8n should do: reply, ask the tutor, or nothing. */
export async function POST(request:Request){
 return bridge(request,async body=>{
  const p=input.safeParse(body);if(!p.success)return {status:400,json:{error:'Invalid message.'}};
  // Second check of Meta's own signature (the workflow also checks it). Required whenever the app secret is set here.
  const secret=whatsappConfig().appSecret;
  if(secret){const sig=p.data.metaSignature||'';if(!p.data.metaRawBody||!sig.startsWith('sha256=')||!await verifyHmac(secret,p.data.metaRawBody,sig.slice(7)))return {status:401,json:{error:'Meta signature check failed.'}}}
  return {status:200,json:await handleBridgeMessage({wamid:p.data.wamid,from:p.data.from,type:p.data.type,text:p.data.text})};
 });
}
