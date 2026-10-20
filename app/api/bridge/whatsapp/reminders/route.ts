import {beginDelivery} from '@/lib/bridge/reminder-delivery';
import {z} from 'zod';
import {bridge} from '@/lib/bridge/auth';
import {claimReminders,reportReminders,reminderDiagnostics} from '@/lib/bridge/whatsapp-jobs';
const input=z.discriminatedUnion('action',[z.object({action:z.literal('begin'),ref:z.string().max(200),claimToken:z.string().uuid()}).strict(),z.object({action:z.literal('status')}).strict(),z.object({action:z.literal('claim'),protocol:z.literal('staged-v1').optional(),limit:z.number().int().min(1).max(100).default(50)}).strict(),z.object({action:z.literal('report'),results:z.array(z.object({ref:z.string().max(200),ok:z.boolean(),claimToken:z.string().uuid().optional(),messageId:z.string().min(1).max(300).optional(),errorCategory:z.enum(['provider_rejected','pre_send','transport_unknown']).optional()}).strict()).max(200)}).strict()]);
/** Opt-in reminders (workflow 3). claim returns the reminders due now, once each; report says which were sent. */
export async function POST(request:Request){
 return bridge(request,async body=>{const p=input.safeParse(body);if(!p.success)return {status:400,json:{error:'Invalid request.'}};
  if(p.data.action==='begin')return {status:200,json:await beginDelivery('reminder',p.data.ref,p.data.claimToken)};
  return {status:200,json:p.data.action==='status'?await reminderDiagnostics():p.data.action==='claim'?await claimReminders(p.data.limit,undefined,p.data.protocol==='staged-v1'):await reportReminders(p.data.results)}});
}
