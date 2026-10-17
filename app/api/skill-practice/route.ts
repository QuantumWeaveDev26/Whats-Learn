import {z} from 'zod';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {sameOrigin} from '@/lib/storage';
import {checkSkillPractice} from '@/lib/skill-practice-service';
import {FeedbackError} from '@/lib/ai-feedback';
const input=z.object({key:z.string().min(1).max(400),answer:z.string().max(3000)}).strict();
export async function POST(request:Request){
 const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
 if(!sameOrigin(request))return response({error:'Invalid origin.'},403);
 const user=await getChatGPTUser();if(!user)return response({error:'Sign in for a practice check. Your main draft stays here.'},401);
 try{const text=await request.text();if(text.length>15000)return response({error:'Request too large.'},413);const p=input.parse(JSON.parse(text));return response(await checkSkillPractice(user.userId,p.key,p.answer));}
 catch(e){if(e instanceof FeedbackError)return response({error:e.message},e.status);if(e instanceof z.ZodError||e instanceof SyntaxError)return response({error:'Invalid practice answer.'},400);return response({error:'The practice check could not finish. Your main draft is safe; retry.'},503);}
}
