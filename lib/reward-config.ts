import {env} from 'cloudflare:workers';
import {billingCatalogue,type SKU} from '@/lib/billing/catalogue';
/**
 * The free-membership reward for the highest title (10 useful completed creations in one course; help and breaks allowed).
 * It is OFF until the owner sets BOTH REWARD_PLAN (a plan key from the catalogue, e.g. plus_monthly) and REWARD_DAYS (1 to 366).
 * A bad or half-set value keeps it off; nothing is guessed.
 */
export type RewardConfig={enabled:false;reason:string}|{enabled:true;plan:SKU;planName:string;days:number};
export function rewardConfig():RewardConfig{
 const e=env as unknown as Record<string,string|undefined>;
 const plan=(e.REWARD_PLAN||'').trim(),days=Number((e.REWARD_DAYS||'').trim());
 if(!plan&&!e.REWARD_DAYS)return {enabled:false,reason:'The owner has not set up the membership reward yet.'};
 if(!(plan in billingCatalogue))return {enabled:false,reason:'The reward plan is not recognised, so the reward stays off.'};
 if(!Number.isInteger(days)||days<1||days>366)return {enabled:false,reason:'The reward length must be 1 to 366 days, so the reward stays off.'};
 return {enabled:true,plan:plan as SKU,planName:billingCatalogue[plan as SKU].name,days};
}
