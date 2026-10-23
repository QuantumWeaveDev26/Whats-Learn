import AccountShell from './account-shell';
import {policyReadiness} from '@/lib/policy-readiness';
/** Shared layout for policy pages. The notice stays until the owner's legal adviser approves the text. */
export default function LegalPage({kicker,title,updated,children}:{kicker:string;title:React.ReactNode;updated:string;children:React.ReactNode}){
 return <AccountShell><div className="account-heading"><p className="kicker">{kicker}</p><h1>{title}</h1><p>Last updated {updated}</p></div>{!policyReadiness().ready&&<p className="legal-review-notice" role="note"><strong>Draft for legal review.</strong> This page describes how WhatsLearn works today. Review and confirmation of the grievance contact are required before paid checkout opens.</p>}<article className="account-card legal-copy">{children}</article><p className="small muted legal-links"><a href="/privacy">Privacy policy</a> · <a href="/terms">Terms of use</a> · <a href="/refunds">Refunds and cancellation</a> · <a href="mailto:connect@brandmintai.io">connect@brandmintai.io</a></p></AccountShell>;
}
