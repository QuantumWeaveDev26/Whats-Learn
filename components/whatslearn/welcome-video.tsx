'use client';
import {useRef,useState} from 'react';
import {Maximize2} from 'lucide-react';
import {Dialog,DialogContent,DialogDescription,DialogTitle,DialogTrigger} from '@/components/ui/dialog';
import {pauseAndCapture,restorePlayback,type PlaybackPosition} from '@/lib/video-playback';

export default function WelcomeVideo(){
 const [open,setOpen]=useState(false),inline=useRef<HTMLVideoElement>(null),expanded=useRef<HTMLVideoElement>(null);
 const position=useRef<PlaybackPosition>({time:0,playing:false});
 function changeOpen(value:boolean){
  if(value)position.current=pauseAndCapture(inline.current);
  else{if(expanded.current)position.current=pauseAndCapture(expanded.current);restorePlayback(inline.current,position.current)}
  setOpen(value);
 }
 return <Dialog open={open} onOpenChange={changeOpen}><div className="welcome-video-inline">
  <video ref={inline} src="/videos/whatslearn-welcome.mp4#t=0.1" controls playsInline preload="metadata" aria-label="WhatsLearn welcome video">
   Your browser does not support this video. <a href="/videos/whatslearn-welcome.mp4">Open the welcome video</a>.
  </video>
  <DialogTrigger asChild><button type="button" className="welcome-video-enlarge" aria-label="Enlarge welcome video"><Maximize2 size={17}/><span>Enlarge</span></button></DialogTrigger>
 </div><DialogContent className="welcome-video-expanded">
  <DialogTitle>Welcome to WhatsLearn</DialogTitle>
  <DialogDescription>Watch in a larger player. Close with X or Escape to return.</DialogDescription>
  {open&&<video ref={expanded} src="/videos/whatslearn-welcome.mp4#t=0.1" controls playsInline preload="metadata" aria-label="Enlarged WhatsLearn welcome video" onLoadedMetadata={()=>restorePlayback(expanded.current,position.current,true)}/>}
 </DialogContent></Dialog>;
}
