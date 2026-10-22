import {servicePulse,dispatchAlerts} from '@/lib/quality/alerts';
import {beginDelivery} from '@/lib/bridge/reminder-delivery';
import {z} from 'zod';
import {bridge} from '@/lib/bridge/auth';
import {claimNotices,reportNotices} from '@/lib/bridge/whatsapp-jobs';
const input=z.discriminatedUnion('action',[z.object({action:z.literal('begin'),id:z.number().int().positive(),claimToken:z.string().uuid()}).strict(),z.object({action:z.literal('claim'),protocol:z.literal('staged-v1').optional(),limit:z.number().int().min(1).max(50).default(20),id:z.number().int().positive().optional()}).strict(),z.object({action:z.literal('report'),results:z.array(z.object({id:z.number().int(),ok:z.boolean(),claimToken:z.string().uuid().optional(),messageId:z.string().min(1).max(300).optional(),errorCategory:z.enum(['provider_rejected','pre_send','transport_unknown']).optional()}).strict()).max(100)}).strict()]);
/** Website-to-WhatsApp notices (workflow 2). claim hands out queued notices once; report says which were sent. */
export async function POST(request:Request){
 return bridge(request,async body=>{const p=input.safeParse(body);if(!p.success)return {status:400,json:{error:'Invalid request.'}};
  if(p.data.action==='claim'){await servicePulse('notices');try{await dispatchAlerts()}catch{}}
  if(p.data.action==='begin')return {status:200,json:await beginDelivery('notice',p.data.id,p.data.claimToken)};
  return {status:200,json:p.data.action==='claim'?await claimNotices(p.data.limit,undefined,p.data.id,p.data.protocol==='staged-v1'):await reportNotices(p.data.results)}});
}
