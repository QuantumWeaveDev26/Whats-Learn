import './support.css';
import AccountShell from '@/components/whatslearn/account-shell';
import SupportRequest from '@/components/whatslearn/support-request';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {accountKey} from '@/lib/auth/account-key';
import {qualityOwner} from '@/lib/quality/access';
import {ArrowLeft,Mail,MessageCircle} from 'lucide-react';
export const metadata={title:'Get help | WhatsLearn',description:'Ask the WhatsLearn team for help and follow your support request.'};
export default async function SupportPage(){
 const user=await getChatGPTUser(),owner=user?await qualityOwner():null;
 return <AccountShell className="support-page"><header className="support-heading"><span className="label">WE’RE HERE TO HELP</span><h1>How can we help?</h1><p>Tell us where you got stuck.</p></header>
  {user?<SupportRequest key={accountKey(user.userId)} accountKey={accountKey(user.userId)}/>:<div className="support-guest-grid"><section className="account-card support-signin"><MessageCircle size={28}/><h2>Talk to our team</h2><p>Sign in to send a request and see replies.</p><a className="primary" href="/signin?return_to=%2Fsupport">Sign in to get help</a></section><aside className="account-card support-email"><Mail size={22}/><div><h2>Prefer email?</h2><a href="mailto:connect@brandmintai.io">connect@brandmintai.io</a><p className="small">You can email without signing in.</p></div></aside></div>}
  <div className="support-page-footer"><a href="/learn"><ArrowLeft size={16}/> Back to learning</a>{owner&&<a href="/admin/quality">Open quality dashboard →</a>}</div>
 </AccountShell>;
}
