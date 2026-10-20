import {accountKey} from '@/lib/auth/account-key';
import {hasPaidAccess} from '@/lib/billing/service';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {database} from '@/lib/storage';

/** Small, account-scoped change marker. Never returns answers, phone numbers or drafts. */
export async function GET(){
 const user=await getChatGPTUser();
 const headers={'Cache-Control':'private, no-store'};
 if(!user)return Response.json({error:'Sign in to sync progress.'},{status:401,headers});
 try{
  const db=database(),id=user.userId;
  const version=await db.prepare(`SELECT
   (SELECT updated_at FROM learner_profiles WHERE user_id=?) AS profile,
   (SELECT MAX(updated_at) FROM work WHERE user_id=?) AS work,
   (SELECT COUNT(*) FROM work WHERE user_id=?) AS work_count,
   (SELECT MAX(id) FROM point_ledger WHERE user_id=?) AS points,
   (SELECT COUNT(*) FROM checkpoint_clears WHERE user_id=?) AS badges,
   (SELECT COUNT(*) FROM practice_events WHERE user_id=?) AS practice,
   (SELECT MAX(updated_at) FROM entitlements WHERE user_id=?) AS plan`).bind(id,id,id,id,id,id,id).first();
  return Response.json({accountKey:accountKey(id),revision:JSON.stringify({...version,paidAccess:await hasPaidAccess(id)})}, {headers});
 }catch{return Response.json({error:'Sync temporarily unavailable.'},{status:503,headers})}
}
