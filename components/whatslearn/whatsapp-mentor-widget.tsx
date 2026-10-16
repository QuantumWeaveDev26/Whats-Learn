import {MessageCircle,ArrowUpRight} from 'lucide-react';
import {whatsappLearningUrl,whatsappLinkProps} from '@/lib/contact';

export default function WhatsAppMentorWidget(){
 return <a className="whatsapp-mentor-widget" href={whatsappLearningUrl('Hi WhatsLearn Mentor, I’d like help with my learning journey.')} {...whatsappLinkProps} aria-label="Chat with WhatsLearn Mentor on WhatsApp">
  <span className="mentor-widget-icon" aria-hidden="true"><MessageCircle size={26}/></span>
  <span><strong>WhatsLearn Mentor</strong><small>Chat on WhatsApp</small></span>
  <ArrowUpRight size={18} aria-hidden="true"/>
 </a>;
}
