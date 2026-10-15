import {z} from 'zod';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {database,sameOrigin} from '@/lib/storage';
import {aiConfig,aiReady,askCoach,reviewWork,FeedbackError} from '@/lib/ai-feedback';
import {hasPaidAccess} from '@/lib/billing/service';
import {languageCodes} from '@/lib/languages';
const input=z.discriminatedUnion('action',[
 z.object({action:z.literal('review'),missionId:z.string().max(20),body:z.string().max(9000),language:z.enum(languageCodes)}).strict(),
 z.object({action:z.literal('ask'),missionId:z.string().max(20),question:z.string().max(500),body:z.string().max(9000).default(''),language:z.enum(languageCodes)}).strict()
]);
const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});
async function allowance(userId:string){let paid=false;try{paid=await hasPaidAccess(userId)}catch{}const c=aiConfig();const limit=paid?c.paidLimit:c.freeLimit;const row=await database().prepare('SELECT count FROM ai_feedback_usage WHERE user_id=? AND day=?').bind(userId,today()).first<{count:number}>();return {limit,used:row?.count||0}}
export async function GET(){if(!aiReady())return response({enabled:false});const user=await getChatGPTUser();if(!user)return response({enabled:true,signInRequired:true});try{const a=await allowance(user.userId);return response({enabled:true,...a})}catch{return response({enabled:true,limit:0,used:0})}}
export async function POST(request:Request){
 if(!sameOrigin(request))return response({error:'Invalid origin.'},403);
 if(!aiReady())return response({error:'Live AI review is not connected yet.'},503);
 const user=await getChatGPTUser();if(!user)return response({error:'Sign in with ChatGPT to get AI review.'},401);
 try{
  const text=await request.text();if(text.length>12000)return response({error:'Request too large.'},413);
  const p=input.parse(JSON.parse(text));
  const a=await allowance(user.userId);if(a.used>=a.limit)return response({error:`You have used today’s ${a.limit} AI reviews. They reset at midnight (India time).`,...a},429);
  const result=p.action==='review'?{review:await reviewWork(p.missionId,p.body,p.language)}:await askCoach(p.missionId,p.question,p.body,p.language);
  await database().prepare('INSERT INTO ai_feedback_usage(user_id,day,count) VALUES (?,?,1) ON CONFLICT(user_id,day) DO UPDATE SET count=count+1').bind(user.userId,today()).run();
  return response({...result,limit:a.limit,used:a.used+1});
 }catch(e){if(e instanceof FeedbackError)return response({error:e.message},e.status);if(e instanceof z.ZodError||e instanceof SyntaxError)return response({error:'Invalid request.'},400);return response({error:'AI review could not finish. Your work is safe; please try again.'},503)}
}
