import {aiReady,FeedbackError,type Review} from './ai-feedback';
import {reviewedSubmission} from './submission-review';
import {canUseMission} from './mission-access-server';
import {membershipRequired} from './mission-access';
import {database} from './storage';
import {missions,type Mission} from './missions';
import {checkWriting} from './writing-check';
import {answerText,precheck} from './submission';
import {creationStatements} from './save-creation';
import {practiceDay} from './play';
import {lockFor,previousMission} from './progression';
import {checkpointKey} from './checkpoints';
import {newMissionStreak} from './course-titles';
import {startingPoints,clueCostSql,ensureAccount,pointsBalance,pointsHistory,welcomeStatus} from './points';
import {clueDeduction,clueIds,dailyLimitMessage,decideAward,pointsGate,scoreMission,scoreSummary,type Award,type ClueId,type Score} from './mission-score';
/**
 * Server side of mission points: the one-new-mission-a-day limit, clue deductions and duplicate prevention, kept in the database
 * (tables mission_scores and mission_clues). The database itself refuses a second score for the same mission, and a second score on the same day,
 * so a refresh, a double tap or two tabs at once cannot earn extra points.
 */
export type Creation={missionId:string;body:string;checks:boolean[];quiz:number;reflection?:string;evaluation?:string};
export type ScoreRow={mission_id:string;day:string;understanding:number;practical:number;clues:number;deduction:number;points:number};
type Result={review?:Review;status:Award['status']|'locked';score?:Score;message:string;saved:boolean;code:number};
async function first<T>(sql:string,...args:unknown[]){return (await database().prepare(sql).bind(...args).first()) as T|null}
async function state(userId:string,missionId:string,day:string){
 const [scored,work,dayUsed,clues]=await Promise.all([
  first('SELECT 1 x FROM mission_scores WHERE user_id=? AND mission_id=?',userId,missionId),
  first('SELECT 1 x FROM work WHERE user_id=? AND mission_id=?',userId,missionId),
  first('SELECT 1 x FROM mission_scores WHERE user_id=? AND day=?',userId,day),
  first<{n:number}>('SELECT COUNT(*) n FROM mission_clues WHERE user_id=? AND mission_id=?',userId,missionId)]);
 return {scoredBefore:!!scored,hasWork:!!work,dayUsedByOther:!!dayUsed,clues:Number(clues?.n||0)};
}
/** Ids of the missions this learner has completed (work saved). */
export async function completedIds(userId:string){
 const rows=await database().prepare('SELECT mission_id FROM work WHERE user_id=?').bind(userId).all();return new Set(rows.results.map(r=>String(r.mission_id)));
}
/** Keys (`track:after`) of the mini challenges this learner has cleared. */
export async function clearedKeys(userId:string){
 const rows=await database().prepare('SELECT track,after_mission FROM checkpoint_clears WHERE user_id=?').bind(userId).all();
 return new Set(rows.results.map(r=>checkpointKey(String(r.track),Number(r.after_mission))));
}
export async function loadScores(userId:string,now=new Date()){
 await ensureAccount(userId,now);
 const welcome=await welcomeStatus(userId);
 const rows=await database().prepare('SELECT mission_id,day,understanding,practical,clues,deduction,points FROM mission_scores WHERE user_id=? ORDER BY day DESC').bind(userId).all();
 const scores=rows.results.map(r=>({...r,understanding:Number(r.understanding),practical:Number(r.practical),clues:Number(r.clues),deduction:Number(r.deduction),points:Number(r.points)})) as unknown as ScoreRow[];
 const today=practiceDay(now.toISOString());
 const pending=await database().prepare('SELECT mission_id, clue FROM mission_clues WHERE user_id=?').bind(userId).all();
 const clues:Record<string,string[]>={};for(const r of pending.results)if(!scores.some(s=>s.mission_id===String(r.mission_id)))(clues[String(r.mission_id)]??=[]).push(String(r.clue));
 return {scores,clues,welcome,balance:await pointsBalance(userId),history:await pointsHistory(userId),streak:newMissionStreak(scores.map(x=>x.day),today),startingPoints:startingPoints(),today,todayUsed:scores.some(s=>s.day===today),totalPoints:scores.reduce((n,s)=>n+s.points,0)};
}
export type ClueResult={allowed:boolean;recorded:boolean;charged:number;balance:number;used:string[];clues:number;deduction:number;reason?:'insufficient'|'completed'|'invalid';message?:string};
/**
 * Reveals a clue: records it once per clue per mission and takes its cost out of the learner's balance in the same step.
 * Repeating a clue, or a second tab, costs nothing more. A mission that is already completed costs nothing. If the balance cannot cover the cost the clue is not revealed and nothing changes.
 */
export async function recordClue(userId:string,missionId:string,clue:ClueId,now=new Date()):Promise<ClueResult>{
 const empty={allowed:false,recorded:false,charged:0,balance:0,used:[] as string[],clues:0,deduction:0};
 if(!missions.some(m=>m.id===missionId)||!clueIds.includes(clue))return {...empty,reason:'invalid',message:'Choose a valid mission and clue.'};
 if(!await canUseMission(userId,missionId))return {...empty,reason:'invalid',message:membershipRequired};
 await ensureAccount(userId,now);
 const usedNow=async()=>(await database().prepare('SELECT clue FROM mission_clues WHERE user_id=? AND mission_id=?').bind(userId,missionId).all()).results.map(x=>String(x.clue));
 const view=async(over:Partial<ClueResult>):Promise<ClueResult>=>{const used=await usedNow();return {allowed:true,recorded:false,charged:0,balance:await pointsBalance(userId),used,clues:used.length,deduction:clueDeduction(used.length),...over}};
 if((await usedNow()).includes(clue))return view({});
 const finished=await first('SELECT 1 x FROM mission_scores WHERE user_id=? AND mission_id=? UNION SELECT 1 FROM work WHERE user_id=? AND mission_id=?',userId,missionId,userId,missionId);
 if(finished)return view({reason:'completed'});
 const ref=`${missionId}:${clue}`;const db=database();
 const [ledger]=await db.batch([
  db.prepare(`INSERT OR IGNORE INTO point_ledger (user_id,kind,ref,delta,created_at) SELECT ?,'clue',?,-${clueCostSql},? WHERE NOT EXISTS (SELECT 1 FROM mission_scores WHERE user_id=? AND mission_id=?) AND NOT EXISTS (SELECT 1 FROM work WHERE user_id=? AND mission_id=?) AND (SELECT COALESCE(SUM(delta),0) FROM point_ledger WHERE user_id=?)-${clueCostSql}>=0`).bind(userId,ref,userId,missionId,userId,missionId,now.toISOString(),userId,missionId,userId,missionId,userId,userId,missionId,userId,missionId),
  db.prepare('INSERT OR IGNORE INTO mission_clues (user_id,mission_id,clue,created_at) SELECT ?,?,?,? WHERE EXISTS (SELECT 1 FROM point_ledger WHERE user_id=? AND kind=\'clue\' AND ref=?)').bind(userId,missionId,clue,now.toISOString(),userId,ref)]);
 const used=await usedNow();
 if(!used.includes(clue)){
  const cost=clueDeduction(used.length+1)-clueDeduction(used.length);const balance=await pointsBalance(userId);
  return {allowed:false,recorded:false,charged:0,balance,used,clues:used.length,deduction:clueDeduction(used.length),reason:'insufficient',message:`This clue costs ${cost} points and your balance is ${balance}, so it stays hidden. Complete missions to earn more points.`};
 }
 // Only the request whose ledger row was actually inserted reports a charge; a simultaneous duplicate sees the clue as already used.
 if(!Number(ledger?.meta?.changes))return view({});
 const row=await first<{delta:number}>("SELECT delta FROM point_ledger WHERE user_id=? AND kind='clue' AND ref=?",userId,ref);
 return view({recorded:true,charged:-(Number(row?.delta||0))});
}
const done=(mission:Mission,status:Award['status'],score:Score|undefined):Result=>({status,score,saved:true,code:200,message:status==='awarded'?`Both questions are complete. ${scoreSummary(score!)}. This was a quick check on this site, not an AI review.`:status==='duplicate'?'Saved as practice. This mission has already earned its points, and points are not awarded twice.':'Saved as practice. Earlier missions stay open to practise, but they do not earn the same points again.'});
/**
 * Saves a mission answer and decides whether it earns points. The answer must already have passed the quick writing check and have the right knowledge-check answer.
 * New missions earn points only once per day across all courses; the daily-limit refusal saves nothing, so the mission can still be done tomorrow.
 */
export async function saveMissionWork(userId:string,data:Creation,now=new Date()):Promise<Result>{
 const mission=missions.find(m=>m.id===data.missionId)!;if(!await canUseMission(userId,mission.id))return {status:'locked',message:membershipRequired,saved:false,code:403};const day=practiceDay(now.toISOString());
 await ensureAccount(userId,now);
 // Order inside the course is enforced here, on the server, not just in the screen.
 const prev=previousMission(mission);
 if(prev){const lock=lockFor(mission,await completedIds(userId),await clearedKeys(userId));if(lock.locked)return {status:'locked',message:lock.message,saved:false,code:403}}
 let review:Review|undefined;
 let s=await state(userId,mission.id,day);let decision=decideAward(s);
 if(decision==='daily-limit')return {status:'daily-limit',message:dailyLimitMessage,saved:false,code:429};
 const invalid=precheck(mission,data);if(invalid)return {status:'rejected',message:invalid,saved:false,code:400};
 if(!aiReady())return {status:'rejected',message:'Automatic evaluation is unavailable. Your answer stays a draft; nothing was completed or scored.',saved:false,code:503};
 if(aiReady()){
  try{const profile=await first<{language:string}>('SELECT language FROM learner_profiles WHERE user_id=?',userId);review=await reviewedSubmission(userId,mission.id,data.body,profile?.language||'en',true,true)}catch(e){return {status:'rejected',message:e instanceof FeedbackError?e.message:'The automatic review could not finish. Your draft is safe; try again.',saved:false,code:e instanceof FeedbackError?e.status:503}}
  if(!review.answerAssessment?.onTopic||!review.answerAssessment.correct)return {status:'rejected',message:'Correctness could not be confirmed. Revise your answer; nothing was saved.',review,saved:false,code:422};
  if(!review.practicalTest?.reported||!review.practicalTest.created||!review.practicalTest.performed)return {status:'rejected',message:'Try the practical test before completing: '+(review.practicalTest?.note||'Add what you tried, its result and one improvement to Your reasoning.'),review,saved:false,code:422};
  if(review.checks.filter(c=>c.met).length<3)return {status:'rejected',message:'Revise before completing: '+review.summary+' Next: '+review.nextStep,review,saved:false,code:422};
 }
 data={...data,checks:review?review.checks.map(c=>c.met):data.checks,evaluation:review?JSON.stringify(review):undefined};
 if(decision==='award'){
  const text=answerText(mission,data.body);const writing=checkWriting(mission,text,data.checks);const gate=pointsGate(mission,text,writing);
  if(!gate.ok)return {status:'rejected',message:gate.message+' Your work has not been saved, so you can try again.',saved:false,code:400};
  const score=scoreMission({understandingCorrect:data.quiz===mission.answer,writing,clues:s.clues});
  if(review){score.practical=Math.round(75*review.checks.filter(c=>c.met).length/review.checks.length);score.points=Math.max(0,score.understanding+score.practical-score.deduction)}
  try{
   const db=database();await db.batch([db.prepare('INSERT INTO mission_scores (user_id,mission_id,day,understanding,practical,clues,deduction,points,created_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(userId,mission.id,day,score.understanding,score.practical,score.clues,score.deduction,score.points,now.toISOString()),
    // The mission's points go into the balance once. Clue costs already taken when the clues were revealed are added back here so the learner is charged for each clue exactly once.
    db.prepare("INSERT INTO point_ledger (user_id,kind,ref,delta,created_at) VALUES (?,'mission',?,?+COALESCE((SELECT -SUM(delta) FROM point_ledger WHERE user_id=? AND kind='clue' AND ref LIKE ?),0),?)").bind(userId,mission.id,score.points,userId,mission.id+':%',now.toISOString()),...creationStatements(userId,data,now.toISOString())]);
   const result=done(mission,'awarded',score);result.review=review;if(review)result.message=scoreSummary(score)+'. AI reviewed: '+review.summary+' Next: '+review.nextStep+(review.source?' Source: '+review.source.commit.slice(0,7)+' · '+review.source.files.join(', ')+' (static review, not executed).':'');return result;
  }catch{
   // The database refused: another request scored this mission or this day first. Work out which, and save nothing more than practice.
   s=await state(userId,mission.id,day);decision=decideAward({...s,hasWork:s.hasWork});
   if(s.scoredBefore)decision='duplicate';else if(s.dayUsedByOther)return {status:'daily-limit',message:dailyLimitMessage,saved:false,code:429};else throw new Error('Could not save');
  }
 }
 await database().batch(creationStatements(userId,data,now.toISOString()));
 const result=done(mission,decision as 'practice'|'duplicate',undefined);result.review=review;if(review)result.message+=' AI reviewed: '+review.summary+' Next: '+review.nextStep;return result;
}
