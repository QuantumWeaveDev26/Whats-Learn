import {startingLevel} from './mission-levels';
import {missions} from './missions';
import {precheck} from './submission';
import {canUseMission} from './mission-access-server';
import {membershipRequired} from './mission-access';
import {database} from './storage';
import {reviewWork,FeedbackError,type Review} from './ai-feedback';
import {aiAllowance,reserveAiUse,releaseAiUse} from './ai-usage';
async function performReview(userId:string,missionId:string,body:string,language:string,hash:string,level:string){
 const old=await database().prepare('SELECT review,created_at FROM submission_reviews WHERE user_id=? AND mission_id=? AND body_hash=?').bind(userId,missionId,hash).first<{review:string;created_at:string}>();
 if(old&&Date.now()-Date.parse(old.created_at)<300000)return JSON.parse(old.review) as Review;
 const allowance=await aiAllowance(userId);if(!await reserveAiUse(userId,allowance.limit))throw new FeedbackError('Your daily AI allowance is used. Your draft stays here; return after midnight India time.',429);
 let review:Review;try{review=await reviewWork(missionId,body,language,level);if(!review.answerAssessment?.onTopic||!review.answerAssessment.correct||!review.practicalTest?.created||!review.practicalTest.performed||!review.practicalTest.reported||review.checks.filter(c=>c.met).length<3)throw new FeedbackError('Revise before completing: '+review.summary+' '+(review.practicalTest?.note||'')+' Next: '+review.nextStep+' Nothing was saved or rated.',422,true)}catch(e){if(!(e instanceof FeedbackError&&e.evaluated))await releaseAiUse(userId);throw e}
 await database().prepare('INSERT INTO submission_reviews(user_id,mission_id,body_hash,review,created_at) VALUES (?,?,?,?,?) ON CONFLICT(user_id,mission_id,body_hash) DO UPDATE SET review=excluded.review,created_at=excluded.created_at').bind(userId,missionId,hash,JSON.stringify(review),new Date().toISOString()).run();
 return review;
}

const pending=new Map<string,Promise<Review>>();
export async function reviewedSubmission(userId:string,missionId:string,body:string,language='en'){
 const mission=missions.find(m=>m.id===missionId);if(!mission)throw new FeedbackError('Unknown challenge.',404);
 if(!await canUseMission(userId,missionId))throw new FeedbackError(membershipRequired,403);
 const invalid=precheck(mission,{body,quiz:mission.answer,checks:mission.checks.map(()=>false)});if(invalid)throw new FeedbackError(invalid+' This was not sent for AI review.',422);
 const profile=await database().prepare('SELECT level FROM learner_profiles WHERE user_id=?').bind(userId).first<{level:string}>();const level=startingLevel(profile?.level||'beginner');
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('level-v5|'+level+'|'+language+'\n'+body.trim()))),b=>b.toString(16).padStart(2,'0')).join('');
 const key=JSON.stringify([userId,missionId,hash]);const existing=pending.get(key);if(existing)return existing;
 const task=performReview(userId,missionId,body,language,hash,level);pending.set(key,task);
 try{return await task}finally{pending.delete(key)}
}
