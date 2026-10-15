import AccountShell from '@/components/whatslearn/account-shell';
import HostSignIn from '@/components/whatslearn/host-sign-in';
import {SignOutPanel} from '@/components/whatslearn/auth-forms';
import {emailAuthConfigured,hostIdentityTrusted} from '@/lib/auth/config';
export const metadata={title:'Sign out · WhatsLearn'};
export const dynamic='force-dynamic';
export default function SignOut(){return <AccountShell>{emailAuthConfigured()?<SignOutPanel/>:hostIdentityTrusted()?<HostSignIn mode="out"/>:<section className="account-card"><h1>You are signed out.</h1><a className="primary" href="/">Back to home</a></section>}</AccountShell>}
