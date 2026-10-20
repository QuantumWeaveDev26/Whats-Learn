import {z} from 'zod';
import {bridge} from '@/lib/bridge/auth';
import {database} from '@/lib/storage';
import {recordReply} from '@/lib/quality/store';
const input=z.object({action:z.literal('record-reply'),from:z.string().regex(/^\d{8,15}$/),sourceMessageId:z.string().min(1).max(200),messageId:z.string().min(1).max(300),question:z.string().max(4000),answer:z.string().min(1).max(4000)}).strict();
/** Called after Meta accepts an actual outgoing reply; never a model-selected account ID. */
export async function POST(request:Request){return bridge(request,async raw=>{
 const p=input.safeParse(raw);if(!p.success)return {status:400,json:{error:'Invalid reply receipt.'}};
 const db=database(),c=await db.prepare("SELECT user_id,current_mission FROM whatsapp_contacts WHERE phone=? AND state='opted_in' AND verified_at IS NOT NULL").bind(p.data.from).first<{user_id:string;current_mission:string|null}>();
 if(!c||p.data.sourceMessageId.startsWith('mentor-profile:')||!await db.prepare('SELECT id FROM whatsapp_events WHERE id=?').bind(p.data.sourceMessageId).first())return {status:200,json:{recorded:false}};
 const receipt=await recordReply(c.user_id,{channel:'whatsapp',missionId:c.current_mission||undefined,question:p.data.question,answer:p.data.answer,sourceId:p.data.messageId});
 return {status:200,json:{recorded:true,replyId:receipt.id}};
})}
