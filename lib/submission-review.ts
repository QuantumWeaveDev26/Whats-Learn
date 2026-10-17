import {learningPath} from './learning-engine';
import {defaultProfile} from './personalization';
import {reviewAccepted,loadEvidence} from './learning-memory';
import {startingLevel} from './mission-levels';
import {missions} from './missions';
import {precheck} from './submission';
import {canUseMission} from './mission-access-server';
import {membershipRequired} from './mission-access';
import {database} from './storage';
import {reviewWork,FeedbackError,type Review} from './ai-feedback';
import {aiAllowance,reserveAiUse,releaseAiUse} from './ai-usage';
async function performReview(userId:string,missionId:string,body:string,language:string,hash:string,level:string,profileLevel:string,reuseAccepted:boolean){
 const old=await database().prepare('SELECT review,created_at FROM submission_reviews WHERE user_id=? AND mission_id=? AND body_hash=?').bind(userId,missionId,hash).first<{review:string;created_at:string}>();
 if(old){try{const cached=JSON.parse(old.review) as Review;const valid=Array.isArray(cached.checks)&&Array.isArray(cached.strengths)&&typeof cached.summary==='string'&&typeof cached.nextStep==='string';if(valid&&(Date.now()-Date.parse(old.created_at)<300000||(reuseAccepted&&!cached.source&&reviewAccepted(cached))))return cached}catch{ /* A malformed stored result is never treated as an assessment. */ }}
 const allowance=await aiAllowance(userId);if(!await reserveAiUse(userId,allowance.limit))throw new FeedbackError('Your daily AI allowance is used. Your draft stays here; return after midnight India time.',429);
 let review:Review;try{review=await reviewWork(missionId,body,language,level,(await loadEvidence(userId)).filter(e=>e.mission_id===missionId).slice(0,3).map(e=>e.review.checks.filter(c=>!c.met).map(c=>c.item+': '+c.note).join('; ')).join(' | '))}catch(e){if(!(e instanceof FeedbackError&&e.evaluated))await releaseAiUse(userId);throw e}
 review={...review,profileLevel};
 await database().prepare('INSERT INTO submission_reviews(user_id,mission_id,body_hash,review,created_at) VALUES (?,?,?,?,?) ON CONFLICT(user_id,mission_id,body_hash) DO UPDATE SET review=excluded.review,created_at=excluded.created_at').bind(userId,missionId,hash,JSON.stringify(review),new Date().toISOString()).run();
 return review;
}

const pending=new Map<string,Promise<Review>>();
export async function reviewedSubmission(userId:string,missionId:string,body:string,language='en',feedbackOnly=false,reuseAccepted=false){
 const mission=missions.find(m=>m.id===missionId);if(!mission)throw new FeedbackError('Unknown challenge.',404);
 if(!await canUseMission(userId,missionId))throw new FeedbackError(membershipRequired,403);
 const invalid=precheck(mission,{body,quiz:mission.answer,checks:mission.checks.map(()=>false)});if(invalid)throw new FeedbackError(invalid+' This was not sent for AI review.',422);
 const profile=await database().prepare('SELECT goal,track,level,language,minutes FROM learner_profiles WHERE user_id=?').bind(userId).first<{goal:string;track:string;level:string;language:string;minutes:string}>();
 const records=await database().prepare('SELECT mission_id,checks,quiz FROM work WHERE user_id=?').bind(userId).all();
 const path=learningPath({...defaultProfile,...profile,track:mission.track},records.results.map(r=>({mission_id:String(r.mission_id),checks:String(r.checks),quiz:Number(r.quiz)})),'adaptive',false,await loadEvidence(userId));
 const previous=(await loadEvidence(userId)).find(e=>e.mission_id===missionId);
 const level=startingLevel((previous&&previous.review.profileLevel===profile?.level?previous.review.learningLevel:undefined)||(path.nextMissionId===missionId?path.practiceLevel:profile?.level)||'beginner');
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('feedback-v8|'+level+'|'+language+'\n'+body.trim()))),b=>b.toString(16).padStart(2,'0')).join('');
 const key=JSON.stringify([userId,missionId,hash]);const existing=pending.get(key);if(existing){const r=await existing;if(!feedbackOnly&&!reviewAccepted(r))throw new FeedbackError('Revise before completing: '+r.summary+' Next: '+r.nextStep+' Nothing was saved or rated.',422,true);return r;}
 const task=performReview(userId,missionId,body,language,hash,level,profile?.level||'beginner',reuseAccepted);pending.set(key,task);
 try{const review=await task;if(!feedbackOnly&&!reviewAccepted(review))throw new FeedbackError('Revise before completing: '+review.summary+' '+(review.practicalTest?.note||'')+' Next: '+review.nextStep+' Nothing was saved or rated.',422,true);return review}finally{pending.delete(key)}
}
