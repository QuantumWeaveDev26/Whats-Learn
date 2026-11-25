import {contextQuestions,contextSchema} from '@/lib/learner-context';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {accountKey} from '@/lib/auth/account-key';
import {restrictToGuest} from '@/lib/learner-eligibility';
import {database,sameOrigin} from '@/lib/storage';
import {POST as saveContext} from '@/app/api/learner-context/route';
import {readAppBody} from '../request-body';

const required=contextQuestions.filter(question=>question.key!=='nickname');
const response=(error:string,status:number)=>Response.json({error},{status,headers:{'Cache-Control':'private, no-store'}});

async function submit(request:Request,replace:boolean){
 if(!sameOrigin(request))return response('Invalid origin.',403);
 let parsed:ReturnType<typeof contextSchema.safeParse>;
 try{
  const text=await readAppBody(request,3000);
  if(text===null)return response('Setup is too large.',413);
  parsed=contextSchema.safeParse(JSON.parse(text)?.answers);
 }catch{return response('Invalid setup.',400)}
 if(!parsed.success)return response('Use a short plain-text name or idea and choose listed options.',400);
 const answers=parsed.data;
 // Apply the existing age restriction immediately, before collecting further answers.
 if(answers.ageBand!=='under-18'&&required.some(({key})=>{
  const value=answers[key];
  return Array.isArray(value)?!value.length:!value;
 }))return response('Answer the required questions to continue.',400);
 if(replace){
  const user=await getChatGPTUser();
  if(!user)return response('Sign in to save your personal setup.',401);
  if(request.headers.get('x-whatslearn-account')!==accountKey(user.userId))return response('Your account changed. Reload to continue.',409);
  try{
   if(answers.ageBand==='under-18'){
    await restrictToGuest(user.userId,true);
    return Response.json({guestOnly:true},{headers:{'Cache-Control':'private, no-store'}});
   }
   const result=await database().prepare("UPDATE learner_context SET answers=?, skipped=0 WHERE user_id=? AND COALESCE(json_extract(answers,'$.ageBand'),'')<>'under-18'").bind(JSON.stringify(answers),user.userId).run();
   if(!result.meta.changes)return response('Personal setup could not load. Please retry.',409);
   return Response.json({saved:true},{headers:{'Cache-Control':'private, no-store'}});
  }catch{return response('Could not save. Please try again.',503)}
 }
 return saveContext(new Request(request.url,{
  method:'POST',headers:request.headers,
  body:JSON.stringify({answers:answers.ageBand==='under-18'?{ageBand:answers.ageBand}:answers}),
 }));
}

export async function POST(request:Request){return submit(request,false)}
export async function PATCH(request:Request){return submit(request,true)}
