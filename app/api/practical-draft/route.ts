import {z} from 'zod';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {matchesAccount} from '@/lib/auth/account-key';
import {sameOrigin} from '@/lib/storage';
import {allow} from '@/lib/auth/limits';
import {readPracticalDraft,writePracticalDraft,DraftError} from '@/lib/practical-draft-store';
const key=z.object({missionId:z.string().max(12),level:z.enum(['beginner','practising','experienced'])}).strict();
const input=key.extend({body:z.string().max(9000),baseRevision:z.number().int().min(0).max(Number.MAX_SAFE_INTEGER-1)}).strict();
const out=(d:unknown,status=200)=>Response.json(d,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});
const fail=(e:unknown)=>out({error:e instanceof DraftError?e.message:e instanceof z.ZodError?'Check the draft and mission.':'Draft sync is unavailable. Your open text is kept.'},e instanceof DraftError?e.status:e instanceof z.ZodError||e instanceof SyntaxError?400:503);
export async function GET(request:Request){const user=await getChatGPTUser();if(!user)return out({error:'Sign in to sync your draft.'},401);if(!matchesAccount(request,user.userId))return out({error:'Your account changed. Reload before syncing.'},409);try{const p=key.parse(Object.fromEntries(new URL(request.url).searchParams));return out({draft:await readPracticalDraft(user.userId,p.missionId,p.level),assessed:false})}catch(e){return fail(e)}}
export async function POST(request:Request){if(!sameOrigin(request))return out({error:'Invalid request origin.'},403);const user=await getChatGPTUser();if(!user)return out({error:'Sign in to sync your draft.'},401);if(!matchesAccount(request,user.userId))return out({error:'Your account changed. Reload before syncing.'},409);try{const raw=await request.text();if(raw.length>17000)return out({error:'Draft too large.'},413);const p=input.parse(JSON.parse(raw));if(!await allow('practical-draft',user.userId,300,3600))return out({error:'Draft sync is busy. Keep writing and retry shortly.'},429);return out({draft:await writePracticalDraft(user.userId,{...p,source:'web'}),assessed:false,courseCompleted:false})}catch(e){return fail(e)}}
