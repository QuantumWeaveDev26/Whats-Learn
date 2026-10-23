import {afterSignIn,contextDestination} from '@/lib/learner-context-store';
import {z} from 'zod';
import {signIn} from '@/lib/auth/gotrue';
import {setSessionCookies} from '@/lib/auth/session';
import {ensureAccount} from '@/lib/points';
import {email,failure,limited,readBody,reply,returnTo,secureRequest} from '@/lib/auth/http';
const schema=z.object({email,password:z.string().min(1,'Enter your password.').max(200),returnTo}).strict();
export const dynamic='force-dynamic';
export async function POST(request:Request){
 const b=await readBody(request,schema);if(!b.ok)return b.res;const d=b.data;
 const stop=await limited(request,'signin',d.email,20,8,900);if(stop)return stop;
 const r=await signIn(d.email,d.password);
 if(!r.ok)return failure(r);
 await setSessionCookies(r.data,secureRequest(request));
 // The one-time welcome balance is keyed to the account id, so signing in again can never repeat it.
 try{await ensureAccount(r.data.user.id)}catch{}
 let destination=contextDestination(d.returnTo);try{destination=await afterSignIn(r.data.user.id,d.returnTo)}catch{}
 return reply({ok:true,redirect:destination});
}
