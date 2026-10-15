import {getChatGPTUser} from '@/app/chatgpt-auth';
import {database,sameOrigin} from '@/lib/storage';
import {miniChallenge,practiceDay} from '@/lib/play';
import {missions} from '@/lib/missions';
import {z} from 'zod';
const input=z.object({missionId:z.string().max(20),choice:z.number().int().min(0).max(1)}).strict();
export async function GET(){const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in to sync your practice rewards.'},{status:401});try{const rows=await database().prepare('SELECT event_id,mission_id,kind,created_at FROM practice_events WHERE user_id=?').bind(user.userId).all();return Response.json({events:rows.results},{headers:{'Cache-Control':'private, no-store'}});}catch{return Response.json({error:'Rewards could not load. Your creations are still available.'},{status:503});}}
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Invalid origin.'},{status:403});
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in to sync your rewards.'},{status:401});
 if(Number(request.headers.get('content-length')||0)>2000)return Response.json({error:'Request too large.'},{status:413});
 let raw:unknown;try{raw=await request.json()}catch{return Response.json({error:'Invalid choice.'},{status:400})}
 const parsed=input.safeParse(raw);if(!parsed.success||!missions.some(m=>m.id===parsed.data.missionId))return Response.json({error:'Choose a valid mini challenge.'},{status:400});
 const {missionId,choice}=parsed.data;
 if(choice!==miniChallenge(missionId).answer)return Response.json({error:'That answer is not correct. A wrong answer costs no points and does not lock anything, so choose the other answer to try again.'},{status:400});
 try{const db=database(),now=new Date().toISOString();await db.batch([db.prepare('INSERT INTO practice_events (user_id,event_id,mission_id,kind,created_at) VALUES (?,?,?,?,?) ON CONFLICT(user_id,event_id) DO NOTHING').bind(user.userId,`discover:${missionId}`,missionId,'discover',now),db.prepare('INSERT INTO practice_events (user_id,event_id,mission_id,kind,created_at) VALUES (?,?,?,?,?) ON CONFLICT(user_id,event_id) DO NOTHING').bind(user.userId,`practice:${practiceDay(now)}`,missionId,'practice',now)]);return Response.json({saved:true,createdAt:now});}catch{return Response.json({error:'Could not save this reward. Please retry.'},{status:503});}
}
