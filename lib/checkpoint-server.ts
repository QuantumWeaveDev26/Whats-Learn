import {database} from './storage';
import {ensureAccount} from './points';
import {checkpointFor,checkpointKey,judgeCheckpoint,positionInCourse,type Judged} from './checkpoints';
import {missions} from './missions';
import {completedIds,clearedKeys} from './mission-points';
/**
 * Server side of mini challenges. A checkpoint is cleared once per account, course and position (the database key refuses a second row), so retries, double taps and two tabs
 * cannot create a second badge. Clearing one touches no mission score, no points and no daily limit.
 */
export type CheckpointResult={ok:boolean;code:number;passed:boolean;alreadyCleared:boolean;message:string;results:Judged['results'];cleared:string[]};
export async function attemptCheckpoint(userId:string,track:string,after:number,answers:number[],now=new Date()):Promise<CheckpointResult>{
 const cp=checkpointFor(track,after);
 const fail=(code:number,message:string,cleared:string[]=[]):CheckpointResult=>({ok:false,code,passed:false,alreadyCleared:false,message,results:[],cleared});
 if(!cp)return fail(400,'Choose a valid mini challenge.');
 await ensureAccount(userId,now);
 const mission=missions.filter(m=>m.track===track).find(m=>positionInCourse(m)===after);
 const done=await completedIds(userId);const cleared=await clearedKeys(userId);const key=checkpointKey(track,after);
 // Mission N (and everything before it) must be completed first, on the server.
 if(!mission||!done.has(mission.id))return fail(403,`Finish “${mission?.title||'the previous mission'}” first. Then this mini challenge opens.`,[...cleared]);
 const judged=judgeCheckpoint(cp,answers);
 if(cleared.has(key))return {ok:true,code:200,passed:true,alreadyCleared:true,message:'You already cleared this mini challenge. Your badge is kept.',results:judged.results,cleared:[...cleared]};
 if(!judged.passed)return {ok:true,code:200,passed:false,alreadyCleared:false,message:'Not yet. Check the notes below and try again. Your progress is kept.',results:judged.results,cleared:[...cleared]};
 await database().prepare('INSERT OR IGNORE INTO checkpoint_clears (user_id,track,after_mission,created_at) VALUES (?,?,?,?)').bind(userId,track,after,now.toISOString()).run();
 const after_=await clearedKeys(userId);
 return {ok:true,code:200,passed:true,alreadyCleared:false,message:'Mini challenge cleared. Badge earned. The next pair of missions is open.',results:judged.results,cleared:[...after_]};
}
