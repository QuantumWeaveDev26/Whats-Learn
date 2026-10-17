import {getChatGPTUser} from '@/app/chatgpt-auth';
import {loadEvidence} from '@/lib/learning-memory';
import {improvementStory} from '@/lib/improvement-story';
export async function GET(){const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in to see reviewed improvement.'},{status:401});try{return Response.json({changes:improvementStory(await loadEvidence(user.userId))},{headers:{'Cache-Control':'private, no-store'}})}catch{return Response.json({error:'Review history could not load.'},{status:503})}}
