import {getChatGPTUser} from '@/app/chatgpt-auth';
import {accountKey} from '@/lib/auth/account-key';
import {database,sameOrigin} from '@/lib/storage';
import {readAppBody} from '../request-body';
import {readSession,writeSession} from '@/lib/learning-session';

const key='app-profile-photo-v1';
const prefix='data:image/jpeg;base64,';
const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});

function validPhoto(photo:unknown):photo is string{
 if(typeof photo!=='string'||photo.length>110000||!photo.startsWith(prefix))return false;
 const base64=photo.slice(prefix.length);
 if(!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)||base64.length%4!==0)return false;
 const bytes=Buffer.from(base64,'base64');
 if(bytes.length<10||bytes[0]!==255||bytes[1]!==216||bytes.at(-2)!==255||bytes.at(-1)!==217)return false;
 // The browser sends a 256px JPEG. Check the frame dimensions before storing it.
 for(let i=2;i+4<bytes.length;){
  if(bytes[i++]!==255)return false;
  while(bytes[i]===255)i++;
  const marker=bytes[i++];
  if(marker===0xda||marker===0xd9||i+2>bytes.length)return false;
  const length=bytes.readUInt16BE(i);
  if(length<2||i+length>bytes.length)return false;
  if(marker===0xc0||marker===0xc1||marker===0xc2){
   return length>=8&&bytes.readUInt16BE(i+3)===256&&bytes.readUInt16BE(i+5)===256;
  }
  i+=length;
 }
 return false;
}

async function handle(request:Request,method:'GET'|'POST'|'DELETE'){
 if(method!=='GET'&&!sameOrigin(request))return response({error:'Invalid origin.'},403);
 const user=await getChatGPTUser();
 if(!user)return response({error:'Sign in to manage your photo.'},401);
 if(request.headers.get('x-whatslearn-account')!==accountKey(user.userId))return response({error:'Your account changed. Reload to continue.'},409);
 try{
  if(method==='GET'){
   const photo=await readSession<string>(user.userId,key);
   return response({photo:validPhoto(photo)?photo:null});
  }
  if(method==='DELETE'){
   await database().prepare('DELETE FROM learning_sessions WHERE user_id=? AND session_key=?').bind(user.userId,key).run();
   return response({saved:true});
  }
  let photo:unknown;
  try{
   const text=await readAppBody(request,112000);
   if(text===null)return response({error:'This photo is too large.'},413);
   photo=JSON.parse(text)?.photo;
  }catch{return response({error:'Choose a supported image under 12 MB.'},400)}
  if(!validPhoto(photo))return response({error:'Choose a supported image under 12 MB.'},400);
  await writeSession(user.userId,key,photo);
  return response({saved:true});
 }catch{return response({error:'Could not update your photo. Try again.'},503)}
}
export const GET=(request:Request)=>handle(request,'GET');
export const POST=(request:Request)=>handle(request,'POST');
export const DELETE=(request:Request)=>handle(request,'DELETE');
