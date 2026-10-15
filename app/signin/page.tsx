import AccountShell from '@/components/whatslearn/account-shell';
import HostSignIn from '@/components/whatslearn/host-sign-in';
import {SignInForm} from '@/components/whatslearn/auth-forms';
import {emailAuthConfigured} from '@/lib/auth/config';
export const metadata={title:'Sign in · WhatsLearn'};
export const dynamic='force-dynamic';
/** Email mode shows the email and password form. Host mode (OpenAI Sites) hands over to the host's ChatGPT sign-in. Never both: a form that cannot work is never shown. */
export default function SignIn(){return <AccountShell>{emailAuthConfigured()?<SignInForm/>:<HostSignIn mode="in"/>}</AccountShell>}
