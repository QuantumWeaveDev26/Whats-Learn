import {getChatGPTUser} from '@/app/chatgpt-auth';
import {sameOrigin} from '@/lib/storage';
import {listUploads,saveUpload,uploadRules,uploadsEnabled} from '@/lib/uploads';
const headers={'Cache-Control':'no-store'};
export async function GET(request:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in to use file uploads.'},{status:401});
 const mission=new URL(request.url).searchParams.get('mission')||undefined;
 try{return Response.json({enabled:uploadsEnabled(),rules:uploadRules,files:uploadsEnabled()?await listUploads(user.userId,mission?.slice(0,20)):[]},{headers})}catch{return Response.json({error:'Files could not load.'},{status:503})}
}
/** multipart/form-data with `mission` and `file`. The type is decided from the file's own bytes; the name and claimed type are not trusted. */
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Invalid request origin.'},{status:403});
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in to use file uploads.'},{status:401});
 if(!uploadsEnabled())return Response.json({error:'File uploads are not switched on yet.'},{status:503});
 if(Number(request.headers.get('content-length')||0)>26*1024**2)return Response.json({error:'The file is too large. '+uploadRules},{status:413});
 let form:FormData;try{form=await request.formData()}catch{return Response.json({error:'Invalid upload.'},{status:400})}
 const mission=form.get('mission'),file=form.get('file');
 if(typeof mission!=='string'||!(file instanceof File))return Response.json({error:'Choose a mission and a file.'},{status:400});
 try{const r=await saveUpload(user.userId,mission.slice(0,20),{name:file.name,bytes:new Uint8Array(await file.arrayBuffer())});return Response.json(r.ok?{file:r.file}:{error:r.message},{status:r.ok?200:r.status,headers})}catch{return Response.json({error:'The file could not be saved. Please try again.'},{status:503})}
}
