import Link from 'next/link';
import AccountShell from '@/components/whatslearn/account-shell';
import EmailOnly from '@/components/whatslearn/email-only';
import {ResetForm} from '@/components/whatslearn/auth-forms';
import {emailAuthConfigured} from '@/lib/auth/config';
import {getChatGPTUser} from '@/app/chatgpt-auth';
export const metadata={title:'Choose a new password · WhatsLearn'};
export const dynamic='force-dynamic';
/** Works only right after a valid reset link was opened (that link signs the learner in for this purpose). Anyone else is told how to get a link, not shown a dead form. */
export default async function Page(){
 if(!emailAuthConfigured())return <AccountShell><EmailOnly what="Password reset"/></AccountShell>;
 const user=await getChatGPTUser().catch(()=>null);
 if(!user)return <AccountShell><div className="join-grid"><section role="status"><h1>Open your reset link first</h1><p className="account-lead">This page works after you open the link we emailed you. Links work once and expire in an hour.</p><p><Link className="primary" href="/forgot-password">Send me a reset link</Link> <Link className="outline" href="/signin">Back to sign in</Link></p></section></div></AccountShell>;
 return <AccountShell><ResetForm/></AccountShell>;
}
