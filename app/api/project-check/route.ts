import {sameOrigin} from '@/lib/storage';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {runBookingModel} from '@/lib/booking-model';
export async function POST(request:Request){if(!sameOrigin(request))return Response.json({error:'Invalid origin.'},{status:403});if(!await getChatGPTUser())return Response.json({error:'Sign in to run a model check.'},{status:401});try{const raw=await request.text();if(raw.length>1500)return Response.json({error:'Model too large.'},{status:413});return Response.json(runBookingModel(JSON.parse(raw)),{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'Use the four supported model settings. No code or URLs are executed.'},{status:400})}}
