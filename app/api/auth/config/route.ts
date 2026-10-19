import {authMode} from '@/lib/auth/config';
import {getChatGPTUser} from '@/app/chatgpt-auth';
export const dynamic='force-dynamic';
/** Which sign-in methods this site offers, so a page never shows a form that cannot work. */
export async function GET(){
 const mode=authMode();const user=await getChatGPTUser().catch(()=>null);
 return Response.json({mode,emailPassword:mode==='email',chatgpt:mode==='host',signedIn:!!user,googleAccount:user?.authProvider==='google'},{headers:{'Cache-Control':'private, no-store'}});
}
