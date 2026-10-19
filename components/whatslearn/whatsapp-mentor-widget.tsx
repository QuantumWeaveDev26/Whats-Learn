'use client';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {MessageCircle,ArrowUpRight} from 'lucide-react';
import {whatsappLearningUrl,whatsappLinkProps} from '@/lib/contact';

export default function WhatsAppMentorWidget(){
 const pathname=usePathname();
 const [href,setHref]=useState('/settings?connect=whatsapp#whatsapp');
 const [linked,setLinked]=useState(false);
 useEffect(()=>{let alive=true;const refresh=()=>{fetch('/api/whatsapp',{cache:'no-store'}).then(r=>r.ok?r.json() as Promise<{contact?:{verified?:boolean;state?:string};signInRequired?:boolean}>:null).then(d=>{if(!alive||!d)return;const on=d.contact?.verified===true&&d.contact?.state==='opted_in';setLinked(on);setHref(on?whatsappLearningUrl('TODAY'):'/settings?connect=whatsapp#whatsapp')}).catch(()=>{})};refresh();window.addEventListener('focus',refresh);return()=>{alive=false;window.removeEventListener('focus',refresh)}},[pathname]);
 // Keep the setup's bottom-right Continue action unobstructed on phones.
 if(['/signin','/signup','/forgot-password','/reset-password','/verify-email','/find-my-path','/welcome'].includes(pathname||''))return null;
 return <a className="whatsapp-mentor-widget" href={href} {...(href.startsWith('https://wa.me/')?whatsappLinkProps:{})} aria-label="Chat with WhatsLearn Mentor on WhatsApp">
  <span className="mentor-widget-icon" aria-hidden="true"><MessageCircle size={26}/></span>
  <span><strong>WhatsLearn Mentor</strong><small>{linked?'Continue on WhatsApp':'Connect WhatsApp'}</small></span>
  <ArrowUpRight size={18} aria-hidden="true"/>
 </a>;
}
