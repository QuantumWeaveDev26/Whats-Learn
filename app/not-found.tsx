import Link from 'next/link';
import AccountShell from '@/components/whatslearn/account-shell';
export const metadata={title:'Page not found · WhatsLearn'};
/** Shown for any address that does not exist. It always offers working ways on, including sign-in, so no one is left at a dead end. */
export default function NotFound(){return <AccountShell><section className="join-grid"><div><h1>We could not find that page</h1><p className="account-lead">The address may be old or mistyped. Here are some places that work:</p><p><a className="primary" href="/learn">My Journey</a> <Link className="outline" href="/">Home</Link> <a className="outline" href="/signin">Sign in</a></p><small>Signed in with ChatGPT or practising as a guest, your work is where you left it.</small></div></section></AccountShell>}
