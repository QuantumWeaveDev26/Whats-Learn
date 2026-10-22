/** Observe the destination's real DOM, including targets revealed after account loading. */
export function observeTourTarget(o:{find:()=>HTMLElement|null;routeReady:()=>boolean;onTarget:(target:HTMLElement,first:boolean)=>void;onWaiting:()=>void;onMissing:()=>void;timeoutMs?:number}){
 let stopped=false,frame=0,target:HTMLElement|null=null,watched:HTMLElement|null=null,found=false,expired=false,timer:number|undefined;
 const resize=typeof ResizeObserver==='undefined'?null:new ResizeObserver(schedule);
 function clearDeadline(){if(timer!==undefined)window.clearTimeout(timer);timer=undefined;}
 function check(){
  if(stopped)return;
  const candidate=o.routeReady()?o.find():null;
  if(candidate?.isConnected){let parent:HTMLElement|null=candidate;while(parent){if(parent.tagName==='DETAILS'&&!(parent as HTMLDetailsElement).open)(parent as HTMLDetailsElement).open=true;parent=parent.parentElement;}}
  if(watched!==candidate){resize?.disconnect();resize?.observe(document.body);if(candidate)resize?.observe(candidate);watched=candidate;}
  const box=candidate?.isConnected?candidate.getBoundingClientRect():null,style=candidate?getComputedStyle(candidate):null;
  if(candidate&&box&&box.width>0&&box.height>0&&style?.visibility!=='hidden'&&style?.display!=='none'){
   const first=!found||candidate!==target;target=candidate;found=true;expired=false;clearDeadline();o.onTarget(candidate,first);return;
  }
  found=false;target=null;if(!expired)o.onWaiting();
  if(timer===undefined&&!expired)timer=window.setTimeout(()=>{timer=undefined;if(!stopped){expired=true;o.onMissing();}},o.timeoutMs??8000);
 }
 function schedule(){if(stopped||frame)return;frame=requestAnimationFrame(()=>{frame=0;check();});}
 const observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','open','class','style','data-tour-view']});
 window.addEventListener('resize',schedule);window.addEventListener('scroll',schedule,true);check();
 return {retry(){if(stopped)return;expired=false;clearDeadline();o.onWaiting();check();},dispose(){stopped=true;cancelAnimationFrame(frame);clearDeadline();observer.disconnect();resize?.disconnect();window.removeEventListener('resize',schedule);window.removeEventListener('scroll',schedule,true);}};
}
