import {getChatGPTUser} from '@/app/chatgpt-auth';
import {loadLearning} from '@/lib/learning-service';
export async function GET(){const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in to open your shared learning path.'},{status:401});try{const state=await loadLearning(user.userId);return Response.json({path:state.path,hasProfile:state.hasProfile},{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'Your learning path could not load. Please try again.'},{status:503})}}
