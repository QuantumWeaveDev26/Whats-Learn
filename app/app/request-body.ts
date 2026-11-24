/** Read app JSON with a hard byte limit, including requests without Content-Length. */
export async function readAppBody(request:Request,limit:number){
 const stream=request.body?.getReader();
 if(!stream)return '';
 const decoder=new TextDecoder('utf-8',{fatal:true});
 let result='',bytes=0;
 try{
  while(true){
   const {value,done}=await stream.read();
   if(done)return result+decoder.decode();
   bytes+=value.byteLength;
   if(bytes>limit){await stream.cancel();return null}
   result+=decoder.decode(value,{stream:true});
  }
 }finally{stream.releaseLock()}
}
