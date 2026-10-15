import AccountShell from '@/components/whatslearn/account-shell';
import HostSignIn from '@/components/whatslearn/host-sign-in';
import {SignOutPanel} from '@/components/whatslearn/auth-forms';
import {emailAuthConfigured} from '@/lib/auth/config';
export const metadata={title:'Sign out · WhatsLearn'};
export const dynamic='force-dynamic';
export default function SignOut(){return <AccountShell>{emailAuthConfigured()?<SignOutPanel/>:<HostSignIn mode="out"/>}</AccountShell>}
