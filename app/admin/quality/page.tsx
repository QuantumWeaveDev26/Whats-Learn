import {notFound} from 'next/navigation';
import AccountShell from '@/components/whatslearn/account-shell';
import QualityDashboard from '@/components/whatslearn/quality-dashboard';
import {qualityOwner} from '@/lib/quality/access';
export const metadata={title:'Learning quality | WhatsLearn',robots:{index:false,follow:false}};
export default async function QualityPage(){if(!await qualityOwner())notFound();return <AccountShell><span className="label">OWNER</span><h1>Learning quality</h1><p>Review learner reports, support requests and service failures.</p><QualityDashboard/></AccountShell>}
