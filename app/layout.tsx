import type { Metadata } from 'next';
import './globals.css';
import './membership/membership.css';
import './motion.css';
import '@/components/whatslearn/quality.css';
import Reveal from '@/components/whatslearn/reveal';
import WhatsAppMentorWidget from '@/components/whatslearn/whatsapp-mentor-widget';
import WebsiteTour from '@/components/whatslearn/website-tour';
export const metadata: Metadata = { openGraph:{title:'WhatsLearn — Learn a skill, make something real',description:'10-day foundation courses with practical missions and a linked WhatsApp mentor.',url:'https://whatslearn.in/',siteName:'WhatsLearn',type:'website',locale:'en_IN'},twitter:{card:'summary',title:'WhatsLearn — Learn a skill, make something real',description:'Short lessons. Real-world practice. Learn on the website and linked WhatsApp.'},other:{'whatslearn-release':'2026-10-27-checkout-auto-plans-v10.20'},title:'WhatsLearn: learn AI skills on WhatsApp and the web', description:'A WhatsApp-first skill studio for India’s workforce. Practise AI marketing, full-stack development, hybrid filmmaking and visual storytelling through short missions and build proof of your skills.',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}<Reveal/><WhatsAppMentorWidget/><WebsiteTour/></body></html>}
