import {recordQualityEvent} from '@/lib/quality/events';
import {matchesAccount} from '@/lib/auth/account-key';
import {recordReply} from '@/lib/quality/store';
import {mentorReply} from '@/lib/mentor';
import {missions} from '@/lib/missions';
import {canUseMission} from '@/lib/mission-access-server';
import {membershipRequired} from '@/lib/mission-access';
import {z} from 'zod';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {sameOrigin} from '@/lib/storage';
import {aiReady,FeedbackError} from '@/lib/ai-feedback';
import {aiAllowance} from '@/lib/ai-usage';
import {reviewedSubmission} from '@/lib/submission-review';
import {languageCodes} from '@/lib/languages';
const input=z.discriminatedUnion('action',[
 z.object({action:z.literal('review'),quiz:z.number().int().min(0).max(20),missionId:z.string().max(20),body:z.string().max(9000),language:z.enum(languageCodes)}).strict(),
 z.object({action:z.literal('ask'),missionId:z.string().max(20),question:z.string().max(500),body:z.string().max(9000).default(''),language:z.enum(languageCodes)}).strict()
]);
const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const allowance=aiAllowance;
export async function GET(){if(!aiReady())return response({enabled:false});const user=await getChatGPTUser();if(!user)return response({enabled:true,signInRequired:true});try{const a=await allowance(user.userId);return response({enabled:true,...a})}catch{return response({enabled:true,limit:0,used:0})}}
export async function POST(request:Request){
 if(!sameOrigin(request))return response({error:'Invalid origin.'},403);
 if(!aiReady())return response({error:'Live AI review is not connected yet.'},503);
 const user=await getChatGPTUser();if(!user)return response({error:'Sign in to get AI review.'},401);if(!matchesAccount(request,user.userId))return response({error:'Your signed-in account changed. Reload before asking or reviewing.'},409);
 let failureKind:'mentor_unavailable'|'evaluation_unavailable'='evaluation_unavailable';
 try{
  const text=await request.text();if(text.length>12000)return response({error:'Request too large.'},413);
  const p=input.parse(JSON.parse(text));failureKind=p.action==='ask'?'mentor_unavailable':'evaluation_unavailable';
  if(!missions.some(m=>m.id===p.missionId))return response({error:'Unknown challenge.'},404);
  if(p.action==='review'&&!await canUseMission(user.userId,p.missionId))return response({error:membershipRequired},403);
  if(p.action==='review'){const mission=missions.find(m=>m.id===p.missionId)!;if(p.quiz!==mission.answer)return response({error:'Answer the understanding question correctly before requesting review. Nothing was saved or reviewed.'},422);const review=await reviewedSubmission(user.userId,p.missionId,p.body,p.language,true);let replyId:string|undefined;try{replyId=(await recordReply(user.userId,{channel:'web',missionId:p.missionId,question:'Review my practical work',answer:[review.summary,...review.checks.map(c=>c.item+': '+c.note),review.nextStep||''].join('\n')})).id}catch{}return response({review,replyId,...await allowance(user.userId)})}
  const result=await mentorReply(user.userId,p.question,p.missionId,p.body);
  let replyId:string|undefined;try{replyId=(await recordReply(user.userId,{channel:'web',missionId:p.missionId,question:p.question,answer:result.answer})).id}catch{}return response({...result,replyId,...await allowance(user.userId),questionsUnlimited:true});
 }catch(e){if(!(e instanceof z.ZodError)&&!(e instanceof SyntaxError)&&(!(e instanceof FeedbackError)||e.status>=500))await recordQualityEvent({userId:user.userId,channel:'web',category:failureKind,correlationId:crypto.randomUUID()});if(e instanceof FeedbackError)return response({error:e.message},e.status);if(e instanceof z.ZodError||e instanceof SyntaxError)return response({error:'Invalid request.'},400);return response({error:'AI review could not finish. Your work is safe; please try again.'},503)}
}
