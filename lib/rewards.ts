import {env} from 'cloudflare:workers';
import {completedIds,loadScores} from '@/lib/mission-points';
import {courseProgress,courseTitles} from '@/lib/course-titles';
import {rewardConfig} from '@/lib/reward-config';
function database(){const db=(env as unknown as {DB?:D1Database}).DB;if(!db)throw new Error('database');return db}
export type ClaimState='none'|'pending'|'granted'|'declined'|'revoked';
/** Which course, if any, has earned the highest title for this learner. Computed on the server from stored work and scores only. */
export async function earnedTopTitle(userId:string,now=new Date()){
 const [done,s]=await Promise.all([completedIds(userId),loadScores(userId,now)]);
 for(const t of courseTitles){const p=courseProgress(t.track,done,s.scores.map(x=>({mission_id:x.mission_id,clues:x.clues,day:x.day})));if(p.title==='streak')return {track:t.track,title:p.name||t.streak}}
 return null;
}
export async function rewardStatus(userId:string,now=new Date()){
 const cfg=rewardConfig();const row=await database().prepare('SELECT status,title,plan,days,created_at FROM reward_claims WHERE user_id=?').bind(userId).first<{status:ClaimState;title:string;plan:string;days:number;created_at:string}>();
 const earned=await earnedTopTitle(userId,now);
 return {enabled:cfg.enabled,reason:cfg.enabled?null:cfg.reason,plan:cfg.enabled?cfg.planName:null,days:cfg.enabled?cfg.days:null,earnedTitle:earned?.title||null,state:(row?.status||'none') as ClaimState};
}
/** One request per account, ever: the claim row's primary key is the account. Simultaneous or repeated requests insert nothing and report the existing state. */
export async function claimReward(userId:string,email:string,now=new Date()){
 const cfg=rewardConfig();if(!cfg.enabled)return {ok:false as const,status:503,message:cfg.reason};
 const earned=await earnedTopTitle(userId,now);if(!earned)return {ok:false as const,status:403,message:'The reward unlocks when you earn the 10-day no-clue title in one course.'};
 const r=await database().prepare("INSERT OR IGNORE INTO reward_claims (user_id,email,track,title,plan,days,status,created_at) VALUES (?,?,?,?,?,?,'pending',?)").bind(userId,email,earned.track,earned.title,cfg.plan,cfg.days,now.toISOString()).run();
 const state=(await rewardStatus(userId,now)).state;
 return {ok:true as const,created:(r.meta?.changes||0)>0,state,message:(r.meta?.changes||0)>0?'Your reward request is saved. The WhatsLearn team will review it and add the membership to your account.':'You have already requested this reward. It can be claimed once per account.'};
}
export async function listClaims(){
 return (await database().prepare('SELECT user_id,email,track,title,plan,days,status,created_at,reviewed_at FROM reward_claims ORDER BY created_at DESC LIMIT 200').all()).results;
}
/** Owner decision. Approving needs the claim to still be pending and writes the entitlement and the status in one all-or-nothing batch, so it cannot be granted twice. */
export async function decideClaim(userId:string,action:'approve'|'decline'|'revoke',now=new Date()){
 const db=database();const row=await db.prepare('SELECT status,plan,days FROM reward_claims WHERE user_id=?').bind(userId).first<{status:ClaimState;plan:string;days:number}>();
 if(!row)return {ok:false as const,status:404,message:'No such claim.'};
 const at=now.toISOString();
 if(action==='approve'){
  if(row.status!=='pending')return {ok:false as const,status:409,message:`This claim is already ${row.status}.`};
  const ends=new Date(now.getTime()+row.days*86400e3).toISOString();
  await db.batch([
   db.prepare("UPDATE reward_claims SET status='granted',reviewed_at=? WHERE user_id=? AND status='pending'").bind(at,userId),
   db.prepare("INSERT OR IGNORE INTO entitlements (session_id,user_id,mode,sku,status,ends_at,updated_at) SELECT ?,?,'reward',?,'active',?,? WHERE EXISTS (SELECT 1 FROM reward_claims WHERE user_id=? AND status='granted' AND reviewed_at=?)").bind('reward:'+userId,userId,row.plan,ends,at,userId,at)]);
  return {ok:true as const,status:200,message:'Reward granted.',endsAt:ends};
 }
 if(action==='decline'){if(row.status!=='pending')return {ok:false as const,status:409,message:`This claim is already ${row.status}.`};await db.prepare("UPDATE reward_claims SET status='declined',reviewed_at=? WHERE user_id=? AND status='pending'").bind(at,userId).run();return {ok:true as const,status:200,message:'Claim declined.'}}
 if(row.status!=='granted')return {ok:false as const,status:409,message:`Only a granted reward can be revoked; this one is ${row.status}.`};
 await db.batch([db.prepare("UPDATE reward_claims SET status='revoked',reviewed_at=? WHERE user_id=?").bind(at,userId),db.prepare("UPDATE entitlements SET status='revoked',updated_at=? WHERE session_id=?").bind(at,'reward:'+userId)]);
 return {ok:true as const,status:200,message:'Reward revoked.'};
}
