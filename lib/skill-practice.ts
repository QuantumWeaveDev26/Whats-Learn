import {skillKey} from './review-summary';
export type SkillPracticeRecord={task_key:string;mission_id:string;skill:string;answer:string;accepted:boolean;attempts?:number;mistakes?:number;feedback:string;follow_up:string;created_at:string};
export type SkillTask={key:string;missionId:string;skill:string;title:string;prompt:string;criterion:string;reason:string;scenario:string};
const drills:Record<string,{title:string;prompt:string;criterion:string}>={
 audience:{title:'Find your people',prompt:'Who exactly needs this offer? Name their situation and why it matters. Two lines.',criterion:'A narrow plausible audience, a concrete situation and a relevant need; not everyone or an unrelated audience.'},
 message:{title:'Make the offer land',prompt:'Rewrite only your hook or offer for your chosen audience. Give one clear benefit and one next action. Keep the rest of your work.',criterion:'An audience-relevant benefit and one clear action; no invented claims or generic promises.'},
 testing:{title:'Show one real test',prompt:'Share one test you actually ran: what you tried, what happened, and what you changed. Include the relevant output or work extract.',criterion:'An actual relevant test, observed result and implemented correction, with a work extract; a plan alone is insufficient.'},
 privacy:{title:'Keep only what you need',prompt:'Name the essential data for this task, one detail you would leave out, and who can see the private data.',criterion:'Only necessary data, a justified exclusion and appropriate limited access to private details.'},
 correctness:{title:'Fix the blocking issue',prompt:'Correct only the issue below. Share the changed part and one actual result showing the fix works.',criterion:'The specific blocking issue is fixed in the supplied work, supported by a concrete observed result; not merely identified or planned.'}
};
export function skillTask(missionId:string,item:string,note:string,version:string,blocking=false,scenario=''):SkillTask{
 const skill=blocking?'correctness':skillKey(item),drill=drills[skill]||{title:'One focused fix',prompt:'Fix this reviewed issue: '+note+' Share the corrected piece and one actual result.',criterion:note};
 return {key:JSON.stringify([missionId,skill,version]),missionId,skill,...drill,reason:note,scenario};
}
