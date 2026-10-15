import {z} from 'zod';
import {deleteProviderUser,signIn} from '@/lib/auth/gotrue';
import {serviceKey} from '@/lib/auth/config';
import {clearSessionCookies,forgetToken,accessTokenOnly} from '@/lib/auth/session';
import {failure,limited,readBody,reply} from '@/lib/auth/http';
import {deleteAccountData} from '@/lib/account-delete';
import {getChatGPTUser} from '@/app/chatgpt-auth';
const schema=z.object({password:z.string().min(1,'Enter your password to confirm.').max(200),confirm:z.literal(true,{message:'Tick the box to confirm.'})}).strict();
export const dynamic='force-dynamic';
/** Self-service account deletion: confirm with the password, erase the learner's data here, then remove the login at the provider. Without the optional provider admin key the data is erased and the owner is told to remove the login (documented support process). */
export async function POST(request:Request){
 const b=await readBody(request,schema);if(!b.ok)return b.res;
 const user=await getChatGPTUser();if(!user)return failure({code:'forbidden'},401);
 const stop=await limited(request,'delete',user.userId,5,5,3600);if(stop)return stop;
 const again=await signIn(user.email,b.data.password);
 if(!again.ok)return failure(again);
 if(again.data.user.id!==user.userId)return failure({code:'forbidden'},403);
 try{await deleteAccountData(user.userId)}catch{return failure({code:'unknown',message:'We could not erase your data just now. Nothing was changed. Please try again, or email the support address on the Privacy page.'},503)}
 let loginRemoved=false;
 if(serviceKey()){const r=await deleteProviderUser(user.userId);loginRemoved=r.ok}
 const at=await accessTokenOnly();await forgetToken(at);await clearSessionCookies();
 return reply({ok:true,loginRemoved,message:loginRemoved?'Your account and data have been deleted.':'Your data has been deleted and you are signed out. Your login will be removed by our team within 30 days; you can also email the support address on the Privacy page to speed this up.'});
}
