import {canUseMission} from './mission-access-server';
import {membershipRequired} from './mission-access';
import {database} from './storage';
import {loadLearning} from './learning-service';
import {aiReady,reviewChatPart,FeedbackError} from './ai-feedback';
import {allow} from './auth/limits';
import {aiAllowance} from './ai-usage';
import {looksLikeGibberish} from './text-signals';
export async function checkSkillPractice(userId:string,key:string,raw:string){
 const {path,profile}=await loadLearning(userId),task=path.remediation;
 if(task&&!await canUseMission(userId,task.missionId))throw new FeedbackError(membershipRequired,403);
 if(!task||task.key!==key)throw new FeedbackError('That practice is no longer current. Refresh your journey.',409);
 const answer=raw.trim();if(answer.length<15||answer.length>3000||looksLikeGibberish(answer))throw new FeedbackError('Send one real answer for this practice (15–3000 characters).',422);
 if(!aiReady())throw new FeedbackError('AI practice check is unavailable. Your main draft is safe; retry later.',503);
 const {limit}=await aiAllowance(userId);
 if(!await allow('whatsapp-chat-check',userId,limit>3?40:20,86400,Date.now()+19800000))throw new FeedbackError('Today’s chat practice checks are used. Return after midnight India time.',429);
 const result=await reviewChatPart(task.missionId,{label:task.title,hint:task.prompt+' Criterion: '+task.criterion+' Specific correction: '+task.reason,type:'skill-practice'},answer,{reviewFocus:task.reason},null,profile.language,profile.level);
 await database().prepare('INSERT INTO skill_practice(user_id,task_key,mission_id,skill,answer,accepted,mistakes,feedback,follow_up,created_at) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,task_key) DO UPDATE SET attempts=skill_practice.attempts+1,mistakes=skill_practice.mistakes+excluded.mistakes,answer=excluded.answer,accepted=excluded.accepted,feedback=excluded.feedback,follow_up=excluded.follow_up,created_at=excluded.created_at WHERE skill_practice.accepted=0').bind(userId,key,task.missionId,task.skill,answer,result.accepted?1:0,result.accepted?0:1,result.feedback,result.followUp,new Date().toISOString()).run();
 return {...result,next:result.accepted?'Apply this fix to your creation, then review the whole task.':result.followUp,courseCompleted:false};
}
