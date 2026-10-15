import {z} from 'zod';
import {recover} from '@/lib/auth/gotrue';
import {siteOrigin} from '@/lib/auth/config';
import {email,failure,limited,readBody,reply} from '@/lib/auth/http';
const schema=z.object({email}).strict();
export const dynamic='force-dynamic';
const SAME='If an account exists for that email, we have sent a link to choose a new password. It works once and expires in an hour.';
export async function POST(request:Request){
 const b=await readBody(request,schema);if(!b.ok)return b.res;
 const stop=await limited(request,'forgot',b.data.email,5,3,3600);if(stop)return stop;
 const origin=siteOrigin(request);if(!origin)return failure({code:'not_configured',message:'The site address is not set up yet, so reset emails cannot be sent.'},503);
 const r=await recover(b.data.email,`${origin}/auth/confirm?next=${encodeURIComponent('/reset-password')}`);
 if(!r.ok&&(r.code==='network'||r.code==='rate_limited'||r.code==='not_configured'))return failure(r);
 return reply({ok:true,message:SAME});
}
