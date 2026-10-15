import AccountShell from '@/components/whatslearn/account-shell';
import EmailOnly from '@/components/whatslearn/email-only';
import {ForgotForm} from '@/components/whatslearn/auth-forms';
import {emailAuthConfigured} from '@/lib/auth/config';
export const metadata={title:'Password reset · WhatsLearn'};
export const dynamic='force-dynamic';
export default function Page(){return <AccountShell>{emailAuthConfigured()?<ForgotForm/>:<EmailOnly what="Password reset"/>}</AccountShell>}
