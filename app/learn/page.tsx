import {createHash} from 'node:crypto';
import {readContext} from '@/lib/learner-context-store';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {authMode} from '@/lib/auth/config';
import LearningWorkspace from './workspace';
export const dynamic='force-dynamic';
/** Resolve identity before rendering so the guest notice does not push the workspace down after hydration. */
export default async function LearningPage(){const user=await getChatGPTUser();const ready=user?!!(await readContext(user.userId).catch(()=>null)):false;return <><span hidden data-tour-account={user?createHash('sha256').update(user.userId).digest('hex').slice(0,24):''} data-tour-ready={String(ready)}/><LearningWorkspace initialAccountKey={user?createHash('sha256').update(user.userId).digest('hex').slice(0,24):''} initialGuest={!user} initialAuthMode={authMode()} initialDraftScope={user?`account:${user.userId}`:'guest'}/></>;}
