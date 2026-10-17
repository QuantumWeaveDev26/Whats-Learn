import {getChatGPTUser} from '@/app/chatgpt-auth';
import {agencyTracks} from '@/lib/agency-story';
import {readSession} from '@/lib/learning-session';
export async function GET(){const u=await getChatGPTUser();if(!u)return Response.json({error:'Sign in.'},{status:401});try{const starters=(await Promise.all(agencyTracks.map(async t=>({track:t.id,draft:await readSession(u.userId,'starter:'+t.id)})))).filter(x=>x.draft);return Response.json({starters},{headers:{'Cache-Control':'private, no-store'}})}catch{return Response.json({error:'Account starters could not load.'},{status:503})}}
