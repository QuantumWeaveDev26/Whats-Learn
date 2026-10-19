import {learnerName} from './learner-name';
import {loadLearning} from './learning-service';
import {readContext} from './learner-context-store';
import {coachContext} from './learner-context';
import {missions} from './missions';
import {localizeMission} from './personalization';
import {programmeNames} from './programmes';
import {canUseMission} from './mission-access-server';
import {answerMentor} from './ai-feedback';
/** Account facts are loaded afresh, independent of WhatsApp's delivery window or model memory. */
export async function mentorContext(userId:string,missionId?:string,draft=''){
 const {profile,path,work}=await loadLearning(userId),personal=await readContext(userId);
 const name=await learnerName(userId);
 const target=missions.find(m=>m.id===(missionId||path.nextMissionId));
 const allowed=target&&await canUseMission(userId,target.id);
 const m=allowed?localizeMission(target,profile.language,path.practiceLevel):null;
 return {name,profile,course:programmeNames[profile.track],progress:{savedMissions:work.filter(w=>missions.some(m=>m.id===w.mission_id&&m.track===profile.track)).length,nextMissionId:allowed?path.nextMissionId:undefined},learning:{nextTask:{...path.nextTask,reason:allowed?path.nextTask.reason:'More course missions need an active plan.'},firstChallengeWhy:allowed?path.firstChallengeWhy:'',focus:allowed?path.focus:null,feedback:allowed?path.lastFeedback?{summary:path.lastFeedback.summary,strengths:path.lastFeedback.strengths,checks:path.lastFeedback.checks,nextStep:path.lastFeedback.nextStep}:null:null},preferences:personal?JSON.parse(coachContext(personal.answers)):null,currentTask:m?{id:m.id,title:m.title,situation:m.brief,idea:m.lesson,task:m.task}:null,draft:m?draft.slice(0,9000):'',accountActions:{progress:'Ask for my progress',course:'Change my course',continue:'TODAY',save:'SAVE',reminders:'REMIND 7pm daily'}};
}
/** Normal questions have no daily counter and never consume a practical-review credit. */
export async function mentorReply(userId:string,question:string,missionId?:string,draft=''){
 const context=await mentorContext(userId,missionId,draft);
 return answerMentor(question,context.profile.language,context);
}
