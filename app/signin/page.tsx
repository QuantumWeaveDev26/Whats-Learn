import AccountShell from '@/components/whatslearn/account-shell';
import HostSignIn from '@/components/whatslearn/host-sign-in';
import {SignInForm} from '@/components/whatslearn/auth-forms';
import {emailAuthConfigured,hostIdentityTrusted} from '@/lib/auth/config';
import AuthUnavailable from '@/components/whatslearn/auth-unavailable';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {afterSignIn} from '@/lib/learner-context-store';
import {redirect} from 'next/navigation';
export const metadata={title:'Sign in · WhatsLearn'};
export const dynamic='force-dynamic';
/** Email mode shows the email and password form. Host mode (OpenAI Sites) hands over to the host's ChatGPT sign-in. Never both: a form that cannot work is never shown. */
export default async function SignIn({searchParams}:{searchParams:Promise<{return_to?:string}>}){const q=await searchParams;const user=await getChatGPTUser();if(user)redirect(await afterSignIn(user.userId,q.return_to));return <AccountShell auth>{emailAuthConfigured()?<SignInForm/>:hostIdentityTrusted()?<HostSignIn mode="in"/>:<AuthUnavailable/>}</AccountShell>}
