import {accountKey} from '@/lib/auth/account-key';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {SessionUnavailable} from '@/lib/auth/session';
export const dynamic = 'force-dynamic';
export async function GET(){
 const headers={'Cache-Control':'private, no-store','Vary':'Cookie'};
 try{const user=await getChatGPTUser();return Response.json({signedIn:!!user,...(user?{accountKey:accountKey(user.userId)}:{})},{headers});}
 catch(e){if(e instanceof SessionUnavailable)return Response.json({error:e.message,retry:true},{status:503,headers});throw e;}
}
