import AccountShell from '@/components/whatslearn/account-shell';
import SupportRequest from '@/components/whatslearn/support-request';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {accountKey} from '@/lib/auth/account-key';
import {qualityOwner} from '@/lib/quality/access';
export const metadata={title:'Get help | WhatsLearn',description:'Ask the WhatsLearn team for help and follow your support request.'};
export default async function SupportPage(){const user=await getChatGPTUser(),owner=user?await qualityOwner():null;return <AccountShell><span className="label">NEED A PERSON?</span><h1>Let’s get you unstuck.</h1><p>Describe what happened. Your learning draft stays where you left it.</p>{user?<SupportRequest accountKey={accountKey(user.userId)}/>:<p><a className="primary" href="/signin?return_to=%2Fsupport">Sign in to track a request</a></p>}<p>Prefer email? <a href="mailto:connect@brandmintai.io">connect@brandmintai.io</a></p><p className="small">Requests are saved for team review. This is not live chat.</p>{owner&&<a className="text-button" href="/admin/quality">Open quality dashboard →</a>}<p><a href="/learn">Back to my journey</a></p></AccountShell>}
