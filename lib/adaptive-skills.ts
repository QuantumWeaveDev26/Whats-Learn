import type {LearningEvidence} from './learning-memory';
import type {SkillPracticeRecord} from './skill-practice';
import {skillKey} from './review-summary';
export type SkillMemory={demonstrated:boolean;attempts:number;needsWork:number;consecutiveMistakes:number;lastReviewedAt:string;lastDemonstratedAt?:string};
/** Latest supported evidence wins. Historical mistakes do not become a permanent penalty. */
export function adaptiveSkills(evidence:LearningEvidence[],practice:SkillPracticeRecord[]=[]){
 const skills:Record<string,SkillMemory>={};const seen=new Set<string>();
 for(const e of [...evidence].sort((a,b)=>b.created_at.localeCompare(a.created_at))){const id=e.mission_id+'|'+(e.reviewKey||e.created_at);if(seen.has(id))continue;seen.add(id);
 const r=e.review,supported=r.answerAssessment?.onTopic===true&&!r.blockingIssue&&r.practicalTest?.reported===true&&(r.answerAssessment.correct===true||r.checks.some(c=>!c.met));
 const checks=r.blockingIssue?[{item:'correctness',met:false,note:r.blockingIssue},...r.checks]:r.checks;
 const counted=new Set<string>();for(const c of checks){const key=c.item==='correctness'?'correctness':skillKey(c.item);if(counted.has(key))continue;counted.add(key);const met=c.met&&supported,first=!skills[key],s=skills[key]??={demonstrated:met,attempts:0,needsWork:0,consecutiveMistakes:0,lastReviewedAt:e.created_at};s.attempts++;if(!met)s.needsWork++;if(first&&met)s.lastDemonstratedAt=e.created_at;if(!s.demonstrated&&!s.lastDemonstratedAt){if(met)s.lastDemonstratedAt=e.created_at;else s.consecutiveMistakes++;}}
 }
 for(const p of practice.filter(p=>p.accepted)){const key=skillKey(p.skill),s=skills[key];if(s&&p.created_at>s.lastReviewedAt){s.demonstrated=true;s.consecutiveMistakes=0;s.lastDemonstratedAt=p.created_at}}
 return skills;
}
