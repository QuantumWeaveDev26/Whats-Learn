import {getChatGPTUser} from '@/app/chatgpt-auth';
import {sameOrigin} from '@/lib/storage';
import {markWelcomeSeen,pointsBalance} from '@/lib/points';
/** The page calls this once it has shown the welcome message, so the message is never shown again on this account. It grants nothing. */
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Invalid request origin.'},{status:403});
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in first.'},{status:401});
 try{await markWelcomeSeen(user.userId);return Response.json({ok:true,balance:await pointsBalance(user.userId)},{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'Please retry.'},{status:503})}
}
