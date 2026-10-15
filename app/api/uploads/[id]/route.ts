import {getChatGPTUser} from '@/app/chatgpt-auth';
import {sameOrigin} from '@/lib/storage';
import {deleteUpload,readUpload} from '@/lib/uploads';
const idOk=(id:string)=>/^[0-9a-f-]{36}$/.test(id);
/** Only the owner can download a file. It is always sent as an attachment and never as a page, so it cannot run in the site's origin. */
export async function GET(_r:Request,{params}:{params:Promise<{id:string}>}){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in to open your files.'},{status:401});
 const {id}=await params;if(!idOk(id))return Response.json({error:'Not found.'},{status:404});
 try{const f=await readUpload(user.userId,id);if(!f)return Response.json({error:'Not found.'},{status:404});
  return new Response(f.body as BodyInit,{headers:{'Content-Type':f.mime,'Content-Disposition':`attachment; filename="${f.name.replace(/"/g,'')}"`,'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store','Content-Security-Policy':"default-src 'none'; sandbox"}})}
 catch{return Response.json({error:'The file could not load.'},{status:503})}
}
export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!sameOrigin(request))return Response.json({error:'Invalid request origin.'},{status:403});
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in to manage your files.'},{status:401});
 const {id}=await params;if(!idOk(id))return Response.json({error:'Not found.'},{status:404});
 try{return (await deleteUpload(user.userId,id))?Response.json({deleted:true},{headers:{'Cache-Control':'no-store'}}):Response.json({error:'Not found.'},{status:404})}catch{return Response.json({error:'The file could not be deleted. Please try again.'},{status:503})}
}
