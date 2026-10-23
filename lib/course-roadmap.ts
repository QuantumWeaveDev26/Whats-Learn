import {missions} from './missions';
import {lockFor} from './progression';
export const courseOutcomes:Record<string,string>={
 marketing:'A campaign portfolio: customer research, an offer, messages, tested posts, a tracking spreadsheet and a usable campaign pack.',
 development:'A product portfolio: a runnable local booking prototype, database, API, executed tests and Git history.',
 filmmaking:'A short hybrid-film sample: recorded shots, performance takes, a sound edit, rough cuts and a recorded pitch.',
 storytelling:'A visual storytelling portfolio: creative briefs, layouts, accessible design, data story, pitch and campaign storyboard.'
};
export const deliverables:Record<string,string[]>={
 marketing:['Customer + offer brief','Reusable campaign prompt','Reply + follow-up sequence','Customer interview + actual responses','Two messages + reader comparison','Finished post + tested action path','Campaign cost analysis','14-day content calendar','Safer ad + consent flow','One-page campaign capstone'],
 development:['A working booking page + three checks','Corrected booking handler','Booking data model','Working local API + request results','Server validation + error messages','Debugging evidence + corrected handler','Role-based access-check function','Executed tests + actual results','Git history + performed rollback','Tested local booking capstone'],
 filmmaking:['Recorded three-beat film','Six-shot sequence','Live footage + composited insert','Recorded dialogue + revised take','Actor direction + backup take','Recorded location + lighting test','Exported sound edit + cue sheet','Two exported cuts + pacing check','Shoot schedule + budget','Exported film sample + recorded pitch'],
 storytelling:['Three-frame story','Consistent AI image brief','Audience + message brief','Poster composition','Accessible type + colour system','Honest chart + caption','Five-slide carousel','AI image audit + revision','Three-slide pitch','Campaign storyboard capstone']
};
export function courseRoadmap(track:string,completed:ReadonlySet<string>,cleared:ReadonlySet<string>=new Set()){
 const list=missions.filter(m=>m.track===track),next=list.find(m=>!completed.has(m.id));
 return list.map((mission,i)=>({mission,day:i+1,deliverable:deliverables[track]?.[i]||mission.title,status:completed.has(mission.id)?'complete' as const:mission.id===next?.id?'current' as const:'upcoming' as const,lock:lockFor(mission,completed,cleared)}));
}
