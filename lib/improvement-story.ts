import type {LearningEvidence} from './learning-memory';
import {skillKey} from './review-summary';
export function improvementStory(evidence:LearningEvidence[]){
 const ordered=[...evidence].sort((a,b)=>a.created_at.localeCompare(b.created_at));
 const previous=new Map<string,LearningEvidence>();
 const changes:{missionId:string;criterion:string;before:string;after:string;at:string}[]=[];
 for(const entry of ordered){const old=previous.get(entry.mission_id);if(old&&old.reviewKey!==entry.reviewKey){for(const check of entry.review.checks){const prior=old.review.checks.find(c=>skillKey(c.item)===skillKey(check.item));if(prior&&!prior.met&&check.met)changes.push({missionId:entry.mission_id,criterion:check.item,before:prior.note,after:check.note,at:entry.created_at});}}previous.set(entry.mission_id,entry);}
 return changes.reverse().slice(0,8);
}
