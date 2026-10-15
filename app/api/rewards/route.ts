import {getChatGPTUser} from '@/app/chatgpt-auth';
import {sameOrigin} from '@/lib/storage';
import {claimReward,rewardStatus} from '@/lib/rewards';
const headers={'Cache-Control':'no-store'};
/** The learner's reward state: whether the owner has switched the reward on, whether the title is earned, and the claim state. */
export async function GET(){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in to see your reward.'},{status:401});
 try{return Response.json(await rewardStatus(user.userId),{headers})}catch{return Response.json({error:'The reward status could not load. Please retry.'},{status:503})}
}
/** Requests the reward once. The body is ignored: what is earned is decided on the server from stored work, never from anything the page sends. */
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Invalid request origin.'},{status:403});
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in to request your reward.'},{status:401});
 try{const r=await claimReward(user.userId,user.email||'');return Response.json(r.ok?{state:r.state,created:r.created,message:r.message}:{error:r.message},{status:r.ok?200:r.status,headers})}catch{return Response.json({error:'The request could not be saved. Please retry.'},{status:503})}
}
