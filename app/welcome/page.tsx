import {accountKey} from '@/lib/auth/account-key';
import {redirect} from 'next/navigation';
import {requireChatGPTUser} from '@/app/chatgpt-auth';
import {contextDestination,readContext} from '@/lib/learner-context-store';
import PersonalSetup from '@/components/whatslearn/personal-setup';
export const dynamic='force-dynamic';
export default async function Welcome({searchParams}:{searchParams:Promise<{next?:string}>}){const q=await searchParams;const destination=contextDestination(q.next);const user=await requireChatGPTUser('/welcome?next='+encodeURIComponent(destination));if(await readContext(user.userId))redirect(destination);return <PersonalSetup next={destination} accountKey={accountKey(user.userId)}/>}
