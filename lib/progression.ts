import {missions,type Mission} from './missions';
import {checkpointKey,requiredCheckpoint} from './checkpoints';
/**
 * Course order. Inside a course, mission 2 opens only after mission 1 is completed, and so on. A mission is completed when both its understanding check
 * and its practical task were accepted, which is exactly when its work is saved (the server refuses to save work with a wrong understanding answer).
 * Completed missions always stay open to practise again. Courses do not depend on each other.
 */
export const lockedMessage=(previous:Mission)=>`Locked. Finish “${previous.title}” first (both the understanding check and the practical task), then this mission opens.`;
export function missionsOfCourse(track:string){return missions.filter(m=>m.track===track)}
export function previousMission(m:Mission):Mission|undefined{const list=missionsOfCourse(m.track);const i=list.findIndex(x=>x.id===m.id);return i>0?list[i-1]:undefined}
export type Lock={locked:boolean;previous?:Mission;message:string;checkpoint?:{track:string;after:number}};
export const checkpointLockedMessage=(previous:Mission)=>`Locked. Clear the mini challenge after “${previous.title}” first, then this mission opens.`;
/**
 * `cleared` is the set of cleared checkpoint keys (`track:after`). Every signed-in and guest path passes it. Leaving it out skips the mini-challenge rule and is only for old tests that predate checkpoints.
 * A mission that is already completed always stays open to practise.
 */
export function lockFor(m:Mission,completed:ReadonlySet<string>,cleared?:ReadonlySet<string>):Lock{
 const previous=previousMission(m);
 if(!previous||completed.has(m.id))return {locked:false,message:''};
 if(!completed.has(previous.id))return {locked:true,previous,message:lockedMessage(previous)};
 const cp=cleared?requiredCheckpoint(m):undefined;
 if(cp&&!cleared!.has(checkpointKey(cp.track,cp.after)))return {locked:true,previous,message:checkpointLockedMessage(previous),checkpoint:{track:cp.track,after:cp.after}};
 return {locked:false,message:''};
}
/** The first mission in a course that is not completed (the one to do next), or undefined when the course is finished. */
export function nextInCourse(track:string,completed:ReadonlySet<string>){return missionsOfCourse(track).find(m=>!completed.has(m.id))}
