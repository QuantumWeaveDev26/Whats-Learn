import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {ownerPageAccess} from '@/lib/billing/owner-gate';
import AccountShell from '@/components/whatslearn/account-shell';
import BillingSetup from '@/components/whatslearn/billing-setup';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Payment setup',robots:{index:false,follow:false}};
/** Owner-only. Anyone who is not the billing owner gets a 404 (see lib/billing/owner-gate.ts). */
export default async function BillingSetupPage(){
 const user=await getChatGPTUser();const access=ownerPageAccess(user?.email||null,(await headers()).get('host'));
 if(access==='owner')return <BillingSetup/>;
 if(access==='local-help')return <AccountShell><div className="account-heading"><p className="kicker">PAYMENT SETUP · THIS COMPUTER ONLY</p><h1>No billing owner yet.</h1><p>Add <code>BILLING_ADMIN_EMAIL=seedy@sites.test</code> to <code>.env.local</code>, restart <code>pnpm start</code>, sign in, and open this page again. This note only appears on 127.0.0.1 or localhost; elsewhere this page does not exist for anyone but the owner.</p></div></AccountShell>;
 notFound();
}
