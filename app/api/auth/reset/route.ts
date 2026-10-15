import {z} from 'zod';
import {setPassword} from '@/lib/auth/gotrue';
import {accessTokenOnly} from '@/lib/auth/session';
import {failure,limited,newPassword,readBody,reply} from '@/lib/auth/http';
const schema=z.object({password:newPassword}).strict();
export const dynamic='force-dynamic';
/** Sets the new password at the provider. Only works for a learner who has just opened a valid reset link (that link signs them in for this one purpose). */
export async function POST(request:Request){
 const b=await readBody(request,schema);if(!b.ok)return b.res;
 const stop=await limited(request,'reset',null,10,0,3600);if(stop)return stop;
 const at=await accessTokenOnly();if(!at)return failure({code:'link_expired'},401);
 const r=await setPassword(at,b.data.password);
 if(!r.ok)return failure(r.code==='forbidden'?{code:'link_expired',status:401}:r);
 return reply({ok:true,message:'Your password has been changed.',redirect:'/learn'});
}
