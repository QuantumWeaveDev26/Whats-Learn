import type {Metadata} from 'next';
import AccountShell from '@/components/whatslearn/account-shell';
import Membership from '@/components/whatslearn/membership';
export const metadata:Metadata={title:'Membership and pricing: Plus ₹199, Pro ₹499 | WhatsLearn',description:'Start free with your first 3 tasks in every course. Skill Sprint ₹149 one-time, Plus ₹199/month, Pro ₹499/month, Teams ₹399 per learner/month.'};
export default function MembershipPage(){return <AccountShell className="membership-page"><Membership headingLevel={1} presentation="comparison"/></AccountShell>}
