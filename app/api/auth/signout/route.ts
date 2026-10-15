import {z} from 'zod';
import {signOut} from '@/lib/auth/gotrue';
import {accessTokenOnly,clearSessionCookies,forgetToken} from '@/lib/auth/session';
import {readBody,reply} from '@/lib/auth/http';
import {safeReturnTo} from '@/lib/return-to';
const schema=z.object({returnTo:z.string().max(500).optional().transform(v=>safeReturnTo(v,'/'))}).strict();
export const dynamic='force-dynamic';
/** Always clears the login cookies here, even if the provider cannot be reached, so signing out never leaves a learner signed in. */
export async function POST(request:Request){
 const b=await readBody(request,schema);if(!b.ok)return b.res;
 const at=await accessTokenOnly();
 if(at){await forgetToken(at);try{await signOut(at)}catch{}}
 await clearSessionCookies();
 return reply({ok:true,redirect:b.data.returnTo});
}
