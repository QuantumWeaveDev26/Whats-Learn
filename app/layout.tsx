import type { Metadata } from 'next';
import './globals.css';
import './motion.css';
import '@/components/whatslearn/quality.css';
import Reveal from '@/components/whatslearn/reveal';
import WhatsAppMentorWidget from '@/components/whatslearn/whatsapp-mentor-widget';
import WebsiteTour from '@/components/whatslearn/website-tour';
export const metadata: Metadata = { title:'WhatsLearn — From Chat to Change', description:'A WhatsApp-first skill studio for India’s workforce. Practise AI marketing, full-stack development, hybrid filmmaking and visual storytelling through short missions and build proof of your skills.',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}<Reveal/><WhatsAppMentorWidget/><WebsiteTour/></body></html>}
