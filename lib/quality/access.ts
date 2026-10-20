import {getChatGPTUser} from '@/app/chatgpt-auth';
import {isBillingAdmin} from '@/lib/billing/razorpay';
/** Reuse the existing configured owner identity; no learner-provided role. */
export async function qualityOwner(){const u=await getChatGPTUser();return u?.email&&isBillingAdmin(u.email)?{userId:u.userId,email:u.email}:null}
