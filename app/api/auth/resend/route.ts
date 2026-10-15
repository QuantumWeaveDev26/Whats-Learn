import {z} from 'zod';
import {resend} from '@/lib/auth/gotrue';
import {siteOrigin} from '@/lib/auth/config';
import {email,failure,limited,readBody,reply,returnTo} from '@/lib/auth/http';
const schema=z.object({email,returnTo}).strict();
export const dynamic='force-dynamic';
export async function POST(request:Request){
 const b=await readBody(request,schema);if(!b.ok)return b.res;
 const stop=await limited(request,'resend',b.data.email,5,3,3600);if(stop)return stop;
 const origin=siteOrigin(request);if(!origin)return failure({code:'not_configured',message:'The site address is not set up yet, so emails cannot be sent.'},503);
 const r=await resend(b.data.email,`${origin}/auth/confirm?next=${encodeURIComponent(b.data.returnTo)}`);
 if(!r.ok&&(r.code==='network'||r.code==='rate_limited'||r.code==='not_configured'))return failure(r);
 return reply({ok:true,message:'If that address has an account waiting for confirmation, we have sent a new link.'});
}
