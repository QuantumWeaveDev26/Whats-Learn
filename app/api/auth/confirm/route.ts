import {z} from 'zod';
import {verifyLink} from '@/lib/auth/gotrue';
import {setSessionCookies} from '@/lib/auth/session';
import {ensureAccount} from '@/lib/points';
import {failure,limited,readBody,reply,returnTo,secureRequest} from '@/lib/auth/http';
const schema=z.object({tokenHash:z.string().min(8).max(300).regex(/^[A-Za-z0-9_\-.]+$/,'This link is not valid.'),type:z.enum(['signup','recovery','email']),next:returnTo}).strict();
export const dynamic='force-dynamic';
/** Called when the learner presses the button on the confirmation page (a button, not the bare link, so mail scanners that open links cannot use the one-time token up). */
export async function POST(request:Request){
 const b=await readBody(request,schema);if(!b.ok)return b.res;
 const stop=await limited(request,'confirm',null,20,0,900);if(stop)return stop;
 const r=await verifyLink(b.data.type,b.data.tokenHash);if(!r.ok)return failure(r);
 await setSessionCookies(r.data,secureRequest(request));
 try{await ensureAccount(r.data.user.id)}catch{}
 return reply({ok:true,type:b.data.type,redirect:b.data.type==='recovery'?'/reset-password':b.data.next});
}
