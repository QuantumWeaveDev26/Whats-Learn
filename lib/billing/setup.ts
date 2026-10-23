import {database} from '@/lib/storage';
import {billingConfig,billingMode} from './razorpay';
import {billingCatalogue} from './catalogue';
import {policyReadiness} from '@/lib/policy-readiness';
/**
 * Plain-language checklist of what checkout still needs. Shows setting NAMES only, never values.
 * Used by the membership page and the owner test page so a missing key, webhook secret, database migration or sign-in is obvious.
 */
export type SetupStep={id:'signin'|'key'|'secret'|'webhook'|'owner'|'database'|'plans'|'policies';ok:boolean;label:string;fix:string};
export async function billingSetup(email:string|null):Promise<{steps:SetupStep[];ready:boolean}>{
 const c=billingConfig();const mode=billingMode();
 const steps:SetupStep[]=[
  {id:'signin',ok:!!email,label:'Signed in',fix:'Sign in first. On your computer, “pnpm start” signs you in as the test user seedy@sites.test.'},
  {id:'key',ok:!!mode,label:mode==='live'?'Razorpay live Key ID (RAZORPAY_KEY_ID, starts with rzp_live_)':'Razorpay API Key ID (RAZORPAY_KEY_ID)',fix:c.keyId.startsWith('rzp_live_')?'A live key is set but BILLING_LIVE_ENABLED is not true, so checkout stays closed. Use your rzp_test_ key for testing.':'Add RAZORPAY_KEY_ID from Razorpay Dashboard (Test mode) → Account & Settings → API keys to .env.local, then restart “pnpm start”.'},
  {id:'secret',ok:!!c.keySecret,label:'Razorpay Key Secret (RAZORPAY_KEY_SECRET)',fix:'Add RAZORPAY_KEY_SECRET (shown once when you generate the test key) to .env.local, then restart.'},
  {id:'webhook',ok:!!c.webhookSecret,label:'Webhook secret (RAZORPAY_WEBHOOK_SECRET)',fix:'Add RAZORPAY_WEBHOOK_SECRET to .env.local. Locally any long random text works, because Razorpay cannot reach your computer; payments are confirmed by signature instead. On the hosted site, use the same secret you type into Razorpay → Webhooks.'},
  {id:'owner',ok:!!c.adminEmail&&!!email&&email.toLowerCase()===c.adminEmail,label:'You are the billing owner (BILLING_ADMIN_EMAIL)',fix:c.adminEmail?'You are signed in with a different account from BILLING_ADMIN_EMAIL.':'Set BILLING_ADMIN_EMAIL in .env.local. For local testing use seedy@sites.test, the local test user.'},
 ];
 if(mode==='live')steps.push({id:'policies',ok:policyReadiness().ready,label:'Reviewed policies and confirmed grievance contact',fix:'Confirm the actual GRIEVANCE_OFFICER_NAME and GRIEVANCE_OFFICER_EMAIL. After legal review of the current published policies, set POLICY_APPROVED_REVISION='+policyReadiness().revision+' in the hosting dashboard. Never set approval before review.'});
 let tables=false,plans=0;const needed=Object.values(billingCatalogue).filter(p=>p.period).length;
 try{const db=database();await db.prepare('SELECT 1 FROM billing_sessions LIMIT 1').first();await db.prepare('SELECT 1 FROM entitlements LIMIT 1').first();tables=true;
  const r=await db.prepare(`SELECT COUNT(*) AS n FROM billing_plans WHERE state='ready' AND sku ${mode==='live'?'':'NOT '}LIKE 'live:%'`).first<{n:number}>();plans=Number(r?.n||0)}catch{}
 steps.push({id:'database',ok:tables,label:'Billing tables in the database (migrations)',fix:'Run “pnpm db:local” once (after “pnpm build”), then restart “pnpm start”. On the hosted site, apply drizzle/0006_paid_access_ai_whatsapp.sql.'});
 steps.push({id:'plans',ok:plans>=needed,label:mode==='live'?'Live plans created in Razorpay':'Test plans created in Razorpay',fix:mode==='live'?'Open /billing/setup and press "Create live plans". Test plans cannot be used for live payments.':'Open /billing/setup and press "Create test plans". The ₹149 sprint needs no plan; memberships do.'});
 return {steps,ready:steps.filter(s=>s.id!=='plans').every(s=>s.ok)};
}
