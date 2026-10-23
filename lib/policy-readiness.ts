import {env} from 'cloudflare:workers';

/** Approval must identify this exact policy revision; changing policy substance requires a new revision. */
export const POLICY_REVISION='2026-10-23';
export function policyReadiness(){
 const e=env as unknown as Record<string,string|undefined>;
 const name=(e.GRIEVANCE_OFFICER_NAME||'').trim();
 const email=(e.GRIEVANCE_OFFICER_EMAIL||'').trim();
 const contactReady=name.length>=2&&name.length<=100&&!/[<>\r\n]/.test(name)&&!/(?:pending|placeholder|to be confirmed|tbd)/i.test(name)&&email.length<=254&&/^[^\s@<>?&#]+@[a-z0-9.-]+\.[a-z]{2,63}$/i.test(email);
 const approvedRevision=e.POLICY_APPROVED_REVISION===POLICY_REVISION;
 return {revision:POLICY_REVISION,name:contactReady?name:null,email:contactReady?email:null,contactReady,approvedRevision,ready:contactReady&&approvedRevision};
}
