export const SAVED_SYNC_MS=1000;
/** Serial polling: no overlapping requests; hidden/offline tabs pause; errors back off. */
export function startSavedProgressSync(onChange:()=>Promise<void>|void,onIdentityLost:()=>Promise<void>|void=()=>{},onIdentityChanged:(key:string)=>Promise<void>|void=()=>{},initialAccountKey=''){
 let stopped=false,timer:ReturnType<typeof setTimeout>|undefined,busy=false,revision:string|undefined,failures=0;
 const controller=new AbortController();let accountKey=initialAccountKey,signedOut=false;
 async function poll(){
  if(stopped||busy)return;
  if(timer)clearTimeout(timer);
  if(document.visibilityState!=='visible'||!navigator.onLine)return;
  busy=true;
  try{
   const r=await fetch('/api/sync',{cache:'no-store',signal:controller.signal});
   if(r.status===401){revision=undefined;if(!signedOut){signedOut=true;await onIdentityLost()}return}
   if(!r.ok)throw new Error('sync');
   const d=await r.json() as {revision?:string;accountKey?:string};
   if(d.accountKey){if(signedOut||(accountKey&&accountKey!==d.accountKey)){await onIdentityChanged(d.accountKey);revision=undefined}accountKey=d.accountKey}signedOut=false;
   if(typeof d.revision!=='string')throw new Error('sync');
   if(revision!==undefined&&revision!==d.revision)await onChange();
   revision=d.revision;failures=0;
  }catch{failures=Math.min(failures+1,4)}
  finally{busy=false;if(!stopped&&document.visibilityState==='visible'&&navigator.onLine)timer=setTimeout(poll,SAVED_SYNC_MS*2**failures)}
 }
 const wake=()=>{void poll()};
 document.addEventListener('visibilitychange',wake);window.addEventListener('online',wake);window.addEventListener('focus',wake);
 void poll();
 return()=>{stopped=true;controller.abort();if(timer)clearTimeout(timer);document.removeEventListener('visibilitychange',wake);window.removeEventListener('online',wake);window.removeEventListener('focus',wake)};
}
