import {getChatGPTUser} from '@/app/chatgpt-auth';
import {sameOrigin} from '@/lib/storage';
import {allow} from '@/lib/auth/limits';
import {matchesAccount} from '@/lib/auth/account-key';
import {createReport,ownedReply,reportInput,QualityError} from '@/lib/quality/store';
const out=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});
export async function GET(request:Request){const user=await getChatGPTUser();if(!user)return out({error:'Sign in to report a reply.'},401);const id=new URL(request.url).searchParams.get('reply')||'';if(id.length>100)return out({error:'Reply unavailable.'},404);try{const reply=await ownedReply(user.userId,id);return reply?out({reply}):out({error:'That reply is unavailable for this account.'},404)}catch{return out({error:'Reply preview could not load. Retry.'},503)}}
export async function POST(request:Request){
 if(!sameOrigin(request))return out({error:'Invalid request origin.'},403);
 const user=await getChatGPTUser();if(!user)return out({error:'Sign in to report a reply.'},401);
 if(!matchesAccount(request,user.userId))return out({error:'Your account changed. Reload before reporting.'},409);
 try{const raw=await request.text();if(raw.length>3500)return out({error:'Keep the note under 500 characters.'},413);const p=reportInput.safeParse(JSON.parse(raw));if(!p.success)return out({error:'Choose a reason and keep the note under 500 characters.'},400);
  if(!await allow('quality-report',user.userId,20,3600))return out({error:'Several reports were received recently. Please try again later.'},429);
  return out(await createReport(user.userId,p.data));
 }catch(e){if(e instanceof QualityError)return out({error:e.message},e.status);if(e instanceof SyntaxError)return out({error:'Invalid report.'},400);return out({error:'Your report could not save. Keep your note and retry.'},503)}
}
