import AccountShell from './account-shell';
/** Shared layout for policy pages. The notice stays until the owner's legal adviser approves the text. */
export default function LegalPage({kicker,title,updated,children}:{kicker:string;title:React.ReactNode;updated:string;children:React.ReactNode}){
 return <AccountShell><div className="account-heading"><p className="kicker">{kicker}</p><h1>{title}</h1><p>Last updated {updated}</p></div><p className="legal-review-notice" role="note"><strong>Draft for legal review.</strong> This page describes how WhatsLearn works today. It has not yet been approved by a qualified legal adviser and must be reviewed before paid plans open.</p><article className="account-card legal-copy">{children}</article><p className="small muted legal-links"><a href="/privacy">Privacy policy</a> · <a href="/terms">Terms of use</a> · <a href="/refunds">Refunds and cancellation</a> · <a href="mailto:connect@brandmintai.io">connect@brandmintai.io</a></p></AccountShell>;
}
