import {needsMembership,membershipRequired} from './mission-access';
import {checkpointFor,checkpointKey,judgeCheckpoint,positionInCourse,type Judged} from './checkpoints';
import {missions} from './missions';
import {readGuestWork} from './guest-work';
/**
 * Guest mini challenges. Guests have no account, so cleared badges are kept in this browser only (localStorage). They do not follow the learner to another device,
 * and clearing site data resets them. Same rules as signed-in learners: the badge is earned once, no points, no daily-limit use.
 */
const KEY='whatslearn-guest-checkpoints-v1';
export function readGuestCheckpoints():Set<string>{
 try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return new Set((Array.isArray(v)?v:[]).filter((k:unknown):k is string=>typeof k==='string'&&/^[a-z]+:\d+$/.test(k)))}catch{return new Set()}
}
export type GuestCheckpointResult={ok:boolean;passed:boolean;alreadyCleared:boolean;message:string;results:Judged['results'];cleared:Set<string>};
export function attemptGuestCheckpoint(track:string,after:number,answers:number[]):GuestCheckpointResult{
 const cleared=readGuestCheckpoints();const cp=checkpointFor(track,after);const key=checkpointKey(track,after);
 if(!cp)return {ok:false,passed:false,alreadyCleared:false,message:'Choose a valid mini challenge.',results:[],cleared};
 const mission=missions.filter(m=>m.track===track).find(m=>positionInCourse(m)===after);const done=new Set(readGuestWork().map(w=>w.mission_id));
 if(mission&&needsMembership(mission))return {ok:false,passed:false,alreadyCleared:false,message:membershipRequired,results:[],cleared};
 if(!mission||!done.has(mission.id))return {ok:false,passed:false,alreadyCleared:false,message:`Finish “${mission?.title||'the previous mission'}” first. Then this mini challenge opens.`,results:[],cleared};
 const judged=judgeCheckpoint(cp,answers);
 if(cleared.has(key))return {ok:true,passed:true,alreadyCleared:true,message:'You already cleared this mini challenge. Your badge is kept on this device.',results:judged.results,cleared};
 if(!judged.passed)return {ok:true,passed:false,alreadyCleared:false,message:'Not yet. Check the notes below and try again. Your progress is kept.',results:judged.results,cleared};
 cleared.add(key);let saved=true;try{localStorage.setItem(KEY,JSON.stringify([...cleared]))}catch{saved=false}
 return {ok:true,passed:true,alreadyCleared:false,message:saved?'Mini challenge cleared. Badge earned on this device. The next pair of missions is open.':'Cleared, but this browser could not keep your badge. Sign in to save it.',results:judged.results,cleared};
}
