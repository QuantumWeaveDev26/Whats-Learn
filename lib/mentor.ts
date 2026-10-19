import {database} from './storage';
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
 const row=await database().prepare('SELECT display_name FROM learner_profiles WHERE user_id=?').bind(userId).first<{display_name:string|null}>();
 const contact=await database().prepare('SELECT display_name FROM whatsapp_contacts WHERE user_id=? AND verified_at IS NOT NULL').bind(userId).first<{display_name:string|null}>();
 const name=[row?.display_name,contact?.display_name].find(x=>x&&!x.includes('@'))||'';
 const target=missions.find(m=>m.id===(missionId||path.nextMissionId));
 const allowed=target&&await canUseMission(userId,target.id);
 const m=allowed?localizeMission(target,profile.language,path.practiceLevel):null;
 return {name,profile,course:programmeNames[profile.track],progress:{savedMissions:work.filter(w=>missions.some(m=>m.id===w.mission_id&&m.track===profile.track)).length,nextMissionId:allowed?path.nextMissionId:undefined},preferences:personal?JSON.parse(coachContext(personal.answers)):null,currentTask:m?{id:m.id,title:m.title,situation:m.brief,idea:m.lesson,task:m.task}:null,draft:m?draft.slice(0,9000):'',accountActions:{progress:'Ask for my progress',course:'Change my course',continue:'TODAY',save:'SAVE',reminders:'REMIND 7pm daily'}};
}
/** Normal questions have no daily counter and never consume a practical-review credit. */
export async function mentorReply(userId:string,question:string,missionId?:string,draft=''){
 const context=await mentorContext(userId,missionId,draft);
 return answerMentor(question,context.profile.language,context);
}
