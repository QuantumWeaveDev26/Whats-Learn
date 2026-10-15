import Link from 'next/link';
/** What a page shows on a host without email accounts, instead of a form that could not work or a 404. */
export default function EmailOnly({what}:{what:string}){
 return <div className="join-grid"><section role="status"><h1>{what} is not available here</h1><p className="account-lead">This site has no email and password accounts, so there is nothing to reset or confirm. Where sign-in exists, the host provides it (ChatGPT on OpenAI Sites).</p><p><Link className="primary" href="/signin">Go to sign in</Link> <Link className="outline" href="/learn">Explore as a guest</Link></p></section></div>;
}
