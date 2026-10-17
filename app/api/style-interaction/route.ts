import {z} from 'zod';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {sameOrigin} from '@/lib/storage';
import {loadLearning} from '@/lib/learning-service';
import {missions} from '@/lib/missions';
import {missionForLevel} from '@/lib/mission-levels';
import {checkStyleExplanation} from '@/lib/style-coach';
import {canUseMission} from '@/lib/mission-access-server';
import {completedIds,clearedKeys} from '@/lib/mission-points';
import {lockFor} from '@/lib/progression';
import {FeedbackError} from '@/lib/ai-feedback';
const input=z.object({missionId:z.string(),answer:z.string().max(1200)}).strict();
export async function POST(request:Request){
 const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
 if(!sameOrigin(request))return response({error:'Invalid origin.'},403);
 const user=await getChatGPTUser();if(!user)return response({error:'Sign in for conversational AI checks. Your answer stays here.'},401);
 try{const raw=await request.text();if(raw.length>6000)return response({error:'Answer too large.'},413);const data=input.parse(JSON.parse(raw)),base=missions.find(m=>m.id===data.missionId);if(!base)return response({error:'Unknown mission.'},400);
 if(!await canUseMission(user.userId,base.id))return response({error:'This mission needs access.'},403);
 const lock=lockFor(base,await completedIds(user.userId),await clearedKeys(user.userId));if(lock.locked)return response({error:lock.message},403);
 const {profile,path}=await loadLearning(user.userId);if(!['casual','story'].includes(profile.style||'casual'))return response({error:'Use the current learning style’s checkpoints.'},409);
 const m=missionForLevel(base,path.nextMissionId===base.id?path.practiceLevel:profile.level),result=await checkStyleExplanation(user.userId,m,data.answer,profile.language,profile.style);
 return response({...result,courseCompleted:false});
 }catch(e){if(e instanceof FeedbackError)return response({error:e.message},e.status);if(e instanceof z.ZodError||e instanceof SyntaxError)return response({error:'Invalid answer.'},400);return response({error:'The coach could not check this. Keep your answer and retry.'},503);}
}
