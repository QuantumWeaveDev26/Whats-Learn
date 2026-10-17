import {z} from 'zod';
import {bridge} from '@/lib/bridge/auth';
import {claimNotices,reportNotices} from '@/lib/bridge/whatsapp-jobs';
const input=z.discriminatedUnion('action',[z.object({action:z.literal('claim'),limit:z.number().int().min(1).max(50).default(20),id:z.number().int().positive().optional()}).strict(),z.object({action:z.literal('report'),results:z.array(z.object({id:z.number().int(),ok:z.boolean()}).strict()).max(100)}).strict()]);
/** Website-to-WhatsApp notices (workflow 2). claim hands out queued notices once; report says which were sent. */
export async function POST(request:Request){
 return bridge(request,async body=>{const p=input.safeParse(body);if(!p.success)return {status:400,json:{error:'Invalid request.'}};
  return {status:200,json:p.data.action==='claim'?await claimNotices(p.data.limit,undefined,p.data.id):await reportNotices(p.data.results)}});
}
