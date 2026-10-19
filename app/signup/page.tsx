import AccountShell from '@/components/whatslearn/account-shell';
import GuestSignup from '@/components/whatslearn/guest-signup';
import {SignUpForm} from '@/components/whatslearn/auth-forms';
import {emailAuthConfigured,hostIdentityTrusted} from '@/lib/auth/config';
import AuthUnavailable from '@/components/whatslearn/auth-unavailable';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {afterSignIn} from '@/lib/learner-context-store';
import {redirect} from 'next/navigation';
export const metadata={title:'Create your account · WhatsLearn'};
export const dynamic='force-dynamic';
/** Email mode: real sign-up with name, email and password. Host mode: the original start-your-path page (no account is created here). */
export default async function Signup({searchParams}:{searchParams:Promise<{return_to?:string}>}){const q=await searchParams;const user=await getChatGPTUser();if(user)redirect(await afterSignIn(user.userId,q.return_to));return emailAuthConfigured()?<AccountShell auth><SignUpForm/></AccountShell>:hostIdentityTrusted()?<GuestSignup/>:<AccountShell auth><AuthUnavailable/></AccountShell>}
