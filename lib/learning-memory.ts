import {database} from './storage';
import type {Review} from './ai-feedback';
export type LearningEvidence={mission_id:string;review:Review;created_at:string;reviewKey?:string};
export async function loadEvidence(userId:string):Promise<LearningEvidence[]>{const rows=await database().prepare('SELECT mission_id,body_hash,review,created_at FROM submission_reviews WHERE user_id=? ORDER BY created_at DESC LIMIT 100').bind(userId).all();return rows.results.flatMap(row=>{try{const review=JSON.parse(String(row.review)) as Review;return Array.isArray(review.checks)&&Array.isArray(review.strengths)&&typeof review.summary==='string'&&typeof review.nextStep==='string'&&review.checks.every(c=>typeof c.item==='string'&&typeof c.met==='boolean'&&typeof c.note==='string')?[{mission_id:String(row.mission_id),review,reviewKey:String(row.body_hash),created_at:String(row.created_at)}]:[]}catch{return []}})}

export {reviewAccepted,feedbackSummary} from './review-summary';
