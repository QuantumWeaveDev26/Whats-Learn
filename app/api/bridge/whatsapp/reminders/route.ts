import {z} from 'zod';
import {bridge} from '@/lib/bridge/auth';
import {claimReminders,reportReminders,reminderDiagnostics} from '@/lib/bridge/whatsapp-jobs';
const input=z.discriminatedUnion('action',[z.object({action:z.literal('status')}).strict(),z.object({action:z.literal('claim'),limit:z.number().int().min(1).max(100).default(50)}).strict(),z.object({action:z.literal('report'),results:z.array(z.object({ref:z.string().max(200),ok:z.boolean()}).strict()).max(200)}).strict()]);
/** Opt-in reminders (workflow 3). claim returns the reminders due now, once each; report says which were sent. */
export async function POST(request:Request){
 return bridge(request,async body=>{const p=input.safeParse(body);if(!p.success)return {status:400,json:{error:'Invalid request.'}};
  return {status:200,json:p.data.action==='status'?await reminderDiagnostics():p.data.action==='claim'?await claimReminders(p.data.limit):await reportReminders(p.data.results)}});
}
