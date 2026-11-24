import {contextQuestions,contextSchema} from '@/lib/learner-context';
import {sameOrigin} from '@/lib/storage';
import {POST as saveContext} from '@/app/api/learner-context/route';
import {readAppBody} from '../request-body';

const required=contextQuestions.filter(question=>question.key!=='nickname');
const response=(error:string,status:number)=>Response.json({error},{status,headers:{'Cache-Control':'private, no-store'}});

export async function POST(request:Request){
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
 return saveContext(new Request(request.url,{
  method:'POST',headers:request.headers,
  body:JSON.stringify({answers:answers.ageBand==='under-18'?{ageBand:answers.ageBand}:answers}),
 }));
}
