import {z} from 'zod';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {sameOrigin} from '@/lib/storage';
import {allow} from '@/lib/auth/limits';
import {gameIds,recordScore,weeklyBoard,createSquad,joinSquad,leaveSquad,SquadError} from '@/lib/app-games';
const out=(d:unknown,status=200)=>Response.json(d,{status,headers:{'Cache-Control':'no-store'}});
const input=z.discriminatedUnion('action',[
 z.object({action:z.literal('score'),game:z.enum(gameIds as [string,...string[]]),score:z.number().int().min(0).max(100)}).strict(),
 z.object({action:z.literal('create'),name:z.string().max(60)}).strict(),
 z.object({action:z.literal('join'),code:z.string().max(12)}).strict(),
 z.object({action:z.literal('leave')}).strict()
]);
/** The weekly tournament board and squad standings. Guests can look; only signed-in learners appear on it. */
export async function GET(){
 const user=await getChatGPTUser();
 try{return out({...await weeklyBoard(user?.userId),signedIn:!!user})}catch{return out({error:'The leaderboard is unavailable right now. Please try again.'},503)}
}
/** Records a game score, or creates, joins or leaves a squad. */
export async function POST(request:Request){
 if(!sameOrigin(request))return out({error:'Invalid origin.'},403);
 const user=await getChatGPTUser();if(!user)return out({error:'Sign in to join the tournament and squads.'},401);
 if(Number(request.headers.get('content-length')||0)>1000)return out({error:'Request too large.'},413);
 let p:z.infer<typeof input>;try{p=input.parse(await request.json())}catch{return out({error:'Invalid request.'},400)}
 try{
  if(p.action==='score'){if(!await allow('game-score',user.userId,60,3600))return out({error:'Too many scores this hour. Take a short break.'},429);return out(await recordScore(user.userId,p.game as typeof gameIds[number],p.score))}
  if(!await allow('game-squad',user.userId,20,3600))return out({error:'Too many squad changes this hour. Try again later.'},429);
  if(p.action==='create')return out(await createSquad(user.userId,p.name));
  if(p.action==='join')return out(await joinSquad(user.userId,p.code));
  await leaveSquad(user.userId);return out({ok:true});
 }catch(e){if(e instanceof SquadError)return out({error:e.message},e.status);return out({error:'That did not work. Please try again.'},503)}
}
