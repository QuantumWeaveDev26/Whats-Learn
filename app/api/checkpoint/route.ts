import {getChatGPTUser} from '@/app/chatgpt-auth';
import {sameOrigin} from '@/lib/storage';
import {attemptCheckpoint} from '@/lib/checkpoint-server';
import {z} from 'zod';
import {noticeBadge} from '@/lib/bridge/notify';
import {checkpointFor} from '@/lib/checkpoints';
const input=z.object({track:z.string().max(20),after:z.number().int().min(1).max(10),answers:z.array(z.number().int().min(0).max(5)).length(2)}).strict();
/** Check a mini challenge. Clearing one earns a badge once; it never adds points or uses the daily mission allowance. */
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Invalid origin.'},{status:403});
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in to save your badge. You can still practise as a guest on this device.'},{status:401});
 if(Number(request.headers.get('content-length')||0)>2000)return Response.json({error:'Request too large.'},{status:413});
 let raw:unknown;try{raw=await request.json()}catch{return Response.json({error:'Invalid answers.'},{status:400})}
 const parsed=input.safeParse(raw);if(!parsed.success)return Response.json({error:'Choose an answer for both questions.'},{status:400});
 try{const r=await attemptCheckpoint(user.userId,parsed.data.track,parsed.data.after,parsed.data.answers);
  if(!r.ok)return Response.json({error:r.message,cleared:r.cleared},{status:r.code});
  if(r.passed&&!r.alreadyCleared)await noticeBadge(user.userId,`${parsed.data.track}:${parsed.data.after}`,checkpointFor(parsed.data.track,parsed.data.after)?.title||'mini challenge');
  return Response.json({passed:r.passed,alreadyCleared:r.alreadyCleared,message:r.message,results:r.results,cleared:r.cleared},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'We could not check your answers. Your picks are still here; please retry.'},{status:503})}
}
