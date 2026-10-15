import {getChatGPTUser} from '@/app/chatgpt-auth';
import {sameOrigin} from '@/lib/storage';
import {recordClue} from '@/lib/mission-points';
import {clueIds} from '@/lib/mission-score';
import {missions} from '@/lib/missions';
import {z} from 'zod';
const input=z.object({missionId:z.string().max(20),clue:z.enum(clueIds)}).strict();
/** Records that the signed-in learner used a clue on a mission. Only the clue count changes; practice days and streaks are untouched. */
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Invalid request origin.'},{status:403});
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in to keep clue counts with your account.'},{status:401});
 if(Number(request.headers.get('content-length')||0)>1000)return Response.json({error:'Request too large.'},{status:413});
 let raw:unknown;try{raw=await request.json()}catch{return Response.json({error:'Invalid request.'},{status:400})}
 const parsed=input.safeParse(raw);if(!parsed.success||!missions.some(m=>m.id===parsed.data.missionId))return Response.json({error:'Choose a valid mission and clue.'},{status:400});
 try{return Response.json(await recordClue(user.userId,parsed.data.missionId,parsed.data.clue),{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'The clue could not be recorded. Please retry.'},{status:503})}
}
