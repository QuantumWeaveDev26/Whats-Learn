import AccountShell from '@/components/whatslearn/account-shell';
import EmailOnly from '@/components/whatslearn/email-only';
import {ConfirmPanel} from '@/components/whatslearn/auth-forms';
import {emailAuthConfigured} from '@/lib/auth/config';
export const metadata={title:'Email confirmation · WhatsLearn'};
export const dynamic='force-dynamic';
export default function Page(){return <AccountShell>{emailAuthConfigured()?<ConfirmPanel/>:<EmailOnly what="Email confirmation"/>}</AccountShell>}
