import {getChatGPTUser} from '@/app/chatgpt-auth';
import {pluginTools,callLearningTool} from '@/lib/plugin-tools';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
export async function GET(){return new Response(null,{status:405,headers:{Allow:'POST'}})}
export async function POST(request:Request){
 const origin=request.headers.get('origin');
 if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'Untrusted origin'},{status:403,headers});
 const text=await request.text();if(text.length>30000)return Response.json({error:'Request too large'},{status:413,headers});
 let rpc:any;try{rpc=JSON.parse(text)}catch{return Response.json({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Parse error'}},{headers})}
 const id=rpc?.id??null;
 const error=(code:number,message:string)=>Response.json({jsonrpc:'2.0',id,error:{code,message}},{headers});
 const result=(value:unknown)=>Response.json({jsonrpc:'2.0',id,result:value},{headers});
 if(!rpc||Array.isArray(rpc)||rpc.jsonrpc!=='2.0'||typeof rpc.method!=='string')return error(-32600,'Invalid request');
 if(rpc.id===undefined)return new Response(null,{status:202,headers});
 if(rpc.method==='initialize')return result({protocolVersion:['2024-11-05','2025-03-26','2025-06-18','2025-11-25'].includes(rpc.params?.protocolVersion)?rpc.params.protocolVersion:'2025-06-18',capabilities:{tools:{listChanged:false}},serverInfo:{name:'WhatsLearn',version:'1.0.0'},instructions:'WhatsLearn: from chat to change. Coach through short stories, active challenges, learner decisions, feedback and revisions. Use saved preferences, ask before changing them, and save only learner-requested work. Saved language preferences include English and all 22 scheduled Indian languages. Follow the learner’s chosen language for conversational coaching. Source lessons remain English, Kannada and Hindi; identify other explanations as conversational translations and preserve the meaning of every self-review and assessment choice. Never claim WhatsApp delivery, paid access, video generation or certified assessment is connected. Use concise context: load the path, then only the selected challenge. Do not reveal or request another learner’s data.'});
 if(rpc.method==='ping')return result({});
 if(rpc.method==='tools/list')return result({tools:pluginTools});
 if(rpc.method!=='tools/call')return error(-32601,'Method not found');
 if(!pluginTools.some(t=>t.name===rpc.params?.name))return error(-32602,'Unknown tool');
 const user=await getChatGPTUser();
 if(!user)return Response.json({jsonrpc:'2.0',id,error:{code:-32001,message:'Connect WhatsLearn with your ChatGPT account to use learning tools.'}},{status:401,headers});
 const args=rpc.params?.arguments??{};
 if(!args||typeof args!=='object'||Array.isArray(args))return error(-32602,'Arguments must be an object');
 try{const data=await callLearningTool(rpc.params.name,args,user.userId);return result({content:[{type:'text',text:JSON.stringify(data)}],structuredContent:data})}
 catch(e){const message=e instanceof Error&&e.name==='ZodError'?'Please use the listed options and provide all required fields.':e instanceof Error&&e.message.startsWith('Unknown')?e.message:'Could not complete this request. Your saved data has not been cleared. Please retry.';return result({isError:true,content:[{type:'text',text:message}]})}
}
