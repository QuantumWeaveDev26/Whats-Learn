import {missions} from './missions';
import {lockFor} from './progression';
export const courseOutcomes:Record<string,string>={
 marketing:'A campaign portfolio: customer research, an offer, messages, a test plan and a one-page launch campaign.',
 development:'A product portfolio: feature brief, corrected code, data and API designs, tests, Git workflow and a launch checklist.',
 filmmaking:'A hybrid short-film production pack: story, shots, performance direction, sound, schedule, budget and pitch.',
 storytelling:'A visual storytelling portfolio: creative briefs, layouts, accessible design, data story, pitch and campaign storyboard.'
};
export const deliverables:Record<string,string[]>={
 marketing:['Customer + offer brief','Reusable campaign prompt','Reply + follow-up sequence','Five customer interview questions','A/B experiment plan','Channel + tracking plan','Campaign cost analysis','14-day content calendar','Safer ad + consent flow','One-page campaign capstone'],
 development:['Feature + acceptance brief','Corrected booking handler','Booking data model','API contract','Server validation + error messages','Debugging evidence + corrected handler','Role-based access-check function','Tests + expected results','Git commits + rollback plan','Launch checklist capstone'],
 filmmaking:['Logline + three story beats','Six-shot sequence','Live action + AI production split','Dialogue + subtext','Actor direction + backup take','Location + lighting plan','Sound cue sheet','Edit + pacing plan','Shoot schedule + budget','Hybrid-film pitch capstone'],
 storytelling:['Three-frame story','Consistent AI image brief','Audience + message brief','Poster composition','Accessible type + colour system','Honest chart + caption','Five-slide carousel','AI image audit + revision','Three-slide pitch','Campaign storyboard capstone']
};
export function courseRoadmap(track:string,completed:ReadonlySet<string>,cleared:ReadonlySet<string>=new Set()){
 const list=missions.filter(m=>m.track===track),next=list.find(m=>!completed.has(m.id));
 return list.map((mission,i)=>({mission,day:i+1,deliverable:deliverables[track]?.[i]||mission.title,status:completed.has(mission.id)?'complete' as const:mission.id===next?.id?'current' as const:'upcoming' as const,lock:lockFor(mission,completed,cleared)}));
}
