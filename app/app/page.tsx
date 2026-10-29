import type {Metadata,Viewport} from 'next';
import WhatsLearnApp from '@/components/whatslearn-app/app';
import InstallSupport from '@/components/whatslearn-app/install';
import './app.css';
export const metadata:Metadata={title:'WhatsLearn app',description:'Learn AI skills in 15 minutes a day. Real tasks, AI feedback and your WhatsApp mentor.',manifest:'/app.webmanifest',appleWebApp:{capable:true,title:'WhatsLearn',statusBarStyle:'default'},icons:{icon:'/images/app-icon-192.png',apple:'/images/app-icon-192.png'},robots:{index:false}};
export const viewport:Viewport={themeColor:'#125C43',width:'device-width',initialScale:1,viewportFit:'cover',interactiveWidget:'resizes-content'};
export const dynamic='force-dynamic';
/** The installable WhatsLearn app. It lives only at /app and uses the website's own accounts and APIs. */
export default function AppPage(){return <><WhatsLearnApp/><InstallSupport/></>}
