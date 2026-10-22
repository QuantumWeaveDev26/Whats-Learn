'use client';
import {useWhatsAppConnection} from './use-whatsapp-connection';
import {usePathname} from 'next/navigation';
import {MessageCircle,ArrowUpRight} from 'lucide-react';
import {whatsappLearningUrl,whatsappLinkProps} from '@/lib/contact';

export default function WhatsAppMentorWidget(){
 const pathname=usePathname();
 const {linked,label}=useWhatsAppConnection();const href=linked?whatsappLearningUrl('TODAY'):'/settings?connect=whatsapp#whatsapp';
 // Keep the setup's bottom-right Continue action unobstructed on phones.
 if(['/signin','/signup','/forgot-password','/reset-password','/verify-email','/find-my-path','/welcome'].includes(pathname||''))return null;
 return <a className="whatsapp-mentor-widget" href={href} {...(href.startsWith('https://wa.me/')?whatsappLinkProps:{})} aria-label={label}>
  <span className="mentor-widget-icon" aria-hidden="true"><MessageCircle size={26}/></span>
  <span><strong>WhatsLearn Mentor</strong><small>{label}</small></span>
  <ArrowUpRight size={18} aria-hidden="true"/>
 </a>;
}
