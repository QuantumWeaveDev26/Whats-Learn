import {getChatGPTUser} from '@/app/chatgpt-auth';
import {authMode} from '@/lib/auth/config';
import LearningWorkspace from './workspace';
export const dynamic='force-dynamic';
/** Resolve identity before rendering so the guest notice does not push the workspace down after hydration. */
export default async function LearningPage(){const user=await getChatGPTUser();return <LearningWorkspace initialGuest={!user} initialAuthMode={authMode()} initialDraftScope={user?`account:${user.userId}`:'guest'}/>;}
