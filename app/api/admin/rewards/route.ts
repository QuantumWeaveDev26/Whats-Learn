import {getChatGPTUser} from '@/app/chatgpt-auth';
import {sameOrigin} from '@/lib/storage';
import {isBillingAdmin} from '@/lib/billing/razorpay';
import {decideClaim,listClaims} from '@/lib/rewards';
import {z} from 'zod';
const headers={'Cache-Control':'no-store'};
/** Owner only (BILLING_ADMIN_EMAIL). Everyone else gets a plain 404, so the route is not discoverable. */
async function owner(){const u=await getChatGPTUser();return u?.email&&isBillingAdmin(u.email)?u:null}
export async function GET(){
 if(!await owner())return new Response('Not found',{status:404});
 try{return Response.json({claims:await listClaims()},{headers})}catch{return Response.json({error:'Claims could not load.'},{status:503})}
}
const input=z.object({userId:z.string().min(1).max(100),action:z.enum(['approve','decline','revoke'])}).strict();
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Invalid request origin.'},{status:403});
 if(!await owner())return new Response('Not found',{status:404});
 let raw:unknown;try{raw=await request.json()}catch{return Response.json({error:'Invalid request.'},{status:400})}
 const p=input.safeParse(raw);if(!p.success)return Response.json({error:'Send a userId and an action: approve, decline or revoke.'},{status:400});
 try{const r=await decideClaim(p.data.userId,p.data.action);return Response.json(r.ok?{message:r.message,endsAt:'endsAt' in r?r.endsAt:undefined}:{error:r.message},{status:r.status,headers})}catch{return Response.json({error:'The decision could not be saved.'},{status:503})}
}
