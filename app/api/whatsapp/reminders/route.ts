import {sendReminders,whatsappConfig,WhatsAppError} from '@/lib/whatsapp';
/** Scheduler endpoint: POST with "Authorization: Bearer <REMINDER_CRON_SECRET>" once a day. */
export async function POST(request:Request){
 const secret=whatsappConfig().cronSecret;const auth=request.headers.get('authorization')||'';
 if(!secret||auth!=='Bearer '+secret)return Response.json({error:'Unauthorized'},{status:401});
 try{return Response.json(await sendReminders())}catch(e){return Response.json({error:e instanceof WhatsAppError?e.message:'Reminder run failed.'},{status:e instanceof WhatsAppError?e.status:500})}
}
