export type PlaybackPosition={time:number;playing:boolean};
export function pauseAndCapture(video:HTMLVideoElement|null):PlaybackPosition{
 if(!video)return {time:0,playing:false};
 const position={time:Number.isFinite(video.currentTime)?video.currentTime:0,playing:!video.paused&&!video.ended};
 video.pause();return position;
}
export function restorePlayback(video:HTMLVideoElement|null,position:PlaybackPosition,resume=false){
 if(!video)return;
 const end=Number.isFinite(video.duration)?video.duration:position.time;
 try{video.currentTime=Math.max(0,Math.min(position.time,end))}catch{/* Metadata may still be loading. */}
 if(resume&&position.playing)void video.play().catch(()=>{});
}
