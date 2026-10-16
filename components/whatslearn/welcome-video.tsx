'use client';

import {useState} from 'react';
import {Play} from 'lucide-react';
import {Dialog,DialogContent,DialogDescription,DialogTitle,DialogTrigger} from '@/components/ui/dialog';

export default function WelcomeVideo(){
 const [open,setOpen]=useState(false);
 return <div className="welcome-video-launcher">
  <Dialog open={open} onOpenChange={setOpen}>
   <DialogTrigger asChild>
  <button className="welcome-video-trigger" onClick={()=>setOpen(true)}>
   <span className="welcome-play-icon" aria-hidden="true"><Play size={20} fill="currentColor"/></span>
   <span>Watch the WhatsLearn welcome video<small>A quick introduction to your learning journey</small></span>
  </button>
   </DialogTrigger>
   <DialogContent className="welcome-video-dialog">
    <DialogTitle>Welcome to WhatsLearn</DialogTitle>
    <DialogDescription>Get to know the website, then explore at your own pace.</DialogDescription>
    {open&&<video src="/videos/whatslearn-welcome.mp4" controls autoPlay playsInline preload="none" aria-label="WhatsLearn welcome video"/>}
   </DialogContent>
  </Dialog>
 </div>;
}
