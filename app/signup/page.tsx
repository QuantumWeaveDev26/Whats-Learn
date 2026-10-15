import AccountShell from '@/components/whatslearn/account-shell';
import GuestSignup from '@/components/whatslearn/guest-signup';
import {SignUpForm} from '@/components/whatslearn/auth-forms';
import {emailAuthConfigured,hostIdentityTrusted} from '@/lib/auth/config';
import AuthUnavailable from '@/components/whatslearn/auth-unavailable';
export const metadata={title:'Create your account · WhatsLearn'};
export const dynamic='force-dynamic';
/** Email mode: real sign-up with name, email and password. Host mode: the original start-your-path page (no account is created here). */
export default function Signup(){return emailAuthConfigured()?<AccountShell><SignUpForm/></AccountShell>:hostIdentityTrusted()?<GuestSignup/>:<AccountShell><AuthUnavailable/></AccountShell>}
