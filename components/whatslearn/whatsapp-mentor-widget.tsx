'use client';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {MessageCircle,ArrowUpRight} from 'lucide-react';
import {whatsappLearningUrl,whatsappLinkProps} from '@/lib/contact';

export default function WhatsAppMentorWidget(){
 const pathname=usePathname();
 const [href,setHref]=useState('/settings?connect=whatsapp#whatsapp');
 useEffect(()=>{fetch('/api/whatsapp').then(r=>r.json() as Promise<{contact?:{verified?:boolean;state?:string};signInRequired?:boolean}>).then(d=>{if(d.contact?.verified&&d.contact?.state==='opted_in')setHref(whatsappLearningUrl('TODAY'));else if(d.signInRequired)setHref('/signin?return_to='+encodeURIComponent('/settings?connect=whatsapp#whatsapp'))}).catch(()=>{})},[]);
 if(['/signin','/signup','/forgot-password','/reset-password','/verify-email'].includes(pathname||''))return null;
 return <a className="whatsapp-mentor-widget" href={href} {...(href.startsWith('https://wa.me/')?whatsappLinkProps:{})} aria-label="Chat with WhatsLearn Mentor on WhatsApp">
  <span className="mentor-widget-icon" aria-hidden="true"><MessageCircle size={26}/></span>
  <span><strong>WhatsLearn Mentor</strong><small>Chat on WhatsApp</small></span>
  <ArrowUpRight size={18} aria-hidden="true"/>
 </a>;
}
