import {billingConfig,isBillingAdmin} from './razorpay';
/**
 * Who may open /billing/setup. The billing owner (BILLING_ADMIN_EMAIL) sees the tool. Everyone else gets a 404,
 * so guests and customers never learn the page or its setup details exist. The single exception is a short
 * "how to become the owner" note on this computer (127.0.0.1 / localhost) while no owner is configured yet.
 */
export type OwnerPageAccess='owner'|'local-help'|'hidden';
const loopback=new Set(['localhost','127.0.0.1','[::1]','::1']);
export function isLoopbackHost(host:string|null){if(!host)return false;try{return loopback.has(new URL(`http://${host}`).hostname.toLowerCase())}catch{return false}}
export function ownerPageAccess(email:string|null,host:string|null):OwnerPageAccess{
 if(email&&isBillingAdmin(email))return 'owner';
 if(isLoopbackHost(host)&&!billingConfig().adminEmail)return 'local-help';
 return 'hidden';
}
