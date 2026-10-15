import {z} from 'zod';
import {signUp} from '@/lib/auth/gotrue';
import {siteOrigin} from '@/lib/auth/config';
import {email,failure,limited,newPassword,readBody,reply,returnTo} from '@/lib/auth/http';
const schema=z.object({name:z.string().trim().min(1,'Enter your name.').max(80,'Use 80 characters or fewer.').regex(/^[^\u0000-\u001f\u007f<>]+$/,'Use letters and numbers only in your name.'),email,password:newPassword,returnTo}).strict();
export const dynamic='force-dynamic';
/** Creates an account at the managed provider. The answer is the same whether or not the address is already registered. No phone number is asked for. */
export async function POST(request:Request){
 const b=await readBody(request,schema);if(!b.ok)return b.res;const d=b.data;
 const stop=await limited(request,'signup',d.email,5,3,3600);if(stop)return stop;
 const origin=siteOrigin(request);if(!origin)return failure({code:'not_configured',message:'The site address is not set up yet, so confirmation emails cannot be sent.'},503);
 const r=await signUp({email:d.email,password:d.password,name:d.name,redirectTo:`${origin}/auth/confirm?next=${encodeURIComponent(d.returnTo)}`});
 if(!r.ok)return failure(r);
 return reply({ok:true,message:'Check your email. We sent a link to confirm your address. You can sign in once you have confirmed it.'});
}
