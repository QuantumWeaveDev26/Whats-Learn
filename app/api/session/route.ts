import {getChatGPTUser} from '@/app/chatgpt-auth';
export const dynamic = 'force-dynamic';
export async function GET(){
 const user=await getChatGPTUser();
 return Response.json({signedIn:!!user},{headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});
}
