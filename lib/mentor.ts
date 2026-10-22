import {recentMentorTurn,rememberMentorTurn} from './mentor-conversation';
import {readPracticalDraft,type DraftLevel} from './practical-draft-store';
import {learnerName} from './learner-name';
import {loadLearning} from './learning-service';
import {readContext} from './learner-context-store';
import {coachContext} from './learner-context';
import {missions} from './missions';
import {localizeMission} from './personalization';
import {programmeNames,programmes} from './programmes';
import {canUseMission} from './mission-access-server';
import {answerMentor} from './ai-feedback';
import {database} from './storage';
import {loadScores} from './mission-points';
import {aiAllowance} from './ai-usage';
import {composeAnswer} from './practical';
/** Account facts are loaded afresh, independent of WhatsApp's delivery window or model memory. */
export async function mentorContext(userId:string,missionId?:string,draft='',recentConversation?:{question:string;answer?:string}|null){
 const {profile,path,work}=await loadLearning(userId),personal=await readContext(userId);
 const db=database();const sharedDraft=await readPracticalDraft(userId,missionId||path.nextMissionId,path.practiceLevel as DraftLevel);
 const [name,scores,allowance,chatDraft,contact]=await Promise.all([
  learnerName(userId),loadScores(userId),aiAllowance(userId),
  db.prepare('SELECT mission_id,body,quiz,updated_at FROM whatsapp_drafts WHERE user_id=?').bind(userId).first<{mission_id:string;body:string;quiz:number|null;updated_at:string}>(),
  db.prepare('SELECT state,verified_at,remind_state,remind_hour,remind_freq FROM whatsapp_contacts WHERE user_id=?').bind(userId).first<{state:string;verified_at:string|null;remind_state:string;remind_hour:number;remind_freq:string}>()
 ]);
 const saved=new Map(work.filter(w=>missions.some(m=>m.id===w.mission_id&&m.answer===w.quiz)).map(w=>[w.mission_id,w]));
 const courses=programmes.map(p=>{const list=missions.filter(m=>m.track===p.id),completed=list.filter(m=>saved.has(m.id));return {id:p.id,name:p.name,selected:p.id===profile.track,status:completed.length===list.length?'completed':completed.length?'in-progress':'not-started',savedMissions:completed.length,totalMissions:list.length,completed:completed.map(m=>({id:m.id,title:m.title,savedAt:saved.get(m.id)!.updated_at})),pending:list.filter(m=>!saved.has(m.id)).map(m=>({id:m.id,title:m.title}))}});
 let draftStatus:null|{missionId:string;title:string;updatedAt:string;completedParts:number;status:'draft';sharedWithWebsite:boolean}=null;
 if(chatDraft){const dm=missions.find(m=>m.id===chatDraft.mission_id);let parts=0;try{const d=JSON.parse(chatDraft.body);parts=Object.values(d.fields||{}).filter(Boolean).length+(d.reasoning?1:0)+(chatDraft.quiz===dm?.answer?1:0)}catch{/* Malformed draft content is never sent to the model. */}if(dm)draftStatus={missionId:dm.id,title:dm.title,updatedAt:chatDraft.updated_at,completedParts:parts,status:'draft',sharedWithWebsite:sharedDraft?.status==='active'&&sharedDraft.missionId===dm.id};}
 if(sharedDraft?.status==='active'&&!draftStatus){const dm=missions.find(m=>m.id===sharedDraft.missionId);if(dm)draftStatus={missionId:dm.id,title:dm.title,updatedAt:sharedDraft.updatedAt,completedParts:Object.values(sharedDraft.data.fields).filter(Boolean).length+(sharedDraft.data.reasoning?1:0),status:'draft',sharedWithWebsite:true};}
 const chatMission=missions.find(m=>m.id===chatDraft?.mission_id);let chatData:{fields:Record<string,string>;reasoning?:string;link?:string;revisiting?:boolean}|null=null;
 try{if(chatDraft){const data=JSON.parse(chatDraft.body);if(data&&typeof data==='object')chatData={fields:Object.fromEntries(Object.entries(data.fields||{}).filter((entry):entry is [string,string]=>typeof entry[1]==='string')),reasoning:typeof data.reasoning==='string'?data.reasoning:'',link:typeof data.link==='string'?data.link:'',revisiting:data.revisiting===true};}}catch{/* Keep invalid stored content out of coaching. */}
 const currentChat=chatMission?.track===profile.track&&(!saved.has(chatMission.id)||chatData?.revisiting)?chatMission:null;
 const target=missions.find(m=>m.id===(missionId||currentChat?.id||path.nextMissionId));
 const allowed=target&&await canUseMission(userId,target.id);
 const m=allowed?localizeMission(target,profile.language,path.practiceLevel):null;
 const currentDraft=m?(draft||(sharedDraft?.status==='active'&&sharedDraft.missionId===m.id?sharedDraft.body:'')||(chatData&&m.id===currentChat?.id?composeAnswer(m.practical,{fields:chatData.fields,reasoning:chatData.reasoning||'',link:chatData.link||''}):'')).slice(0,9000):'';
 return {snapshotAt:new Date().toISOString(),name,addressAs:name,profile,course:programmeNames[profile.track],courses,personalSetup:{completed:!!personal,skipped:personal?.skipped||false},progress:{savedMissions:courses.find(c=>c.selected)!.savedMissions,totalSavedMissions:saved.size,nextMissionId:allowed?path.nextMissionId:undefined,balance:scores.balance,streak:scores.streak.current,todayPoints:scores.scores.find(s=>s.day===scores.today)?.points||0,todayMissionCompleted:scores.todayUsed},learning:{nextTask:{...path.nextTask,reason:allowed?path.nextTask.reason:'More course missions need an active plan.'},firstChallengeWhy:allowed?path.firstChallengeWhy:'',focus:allowed?path.focus:null,feedback:allowed?path.lastFeedback?{summary:path.lastFeedback.summary,strengths:path.lastFeedback.strengths,checks:path.lastFeedback.checks,nextStep:path.lastFeedback.nextStep}:null:null},observedPractice:{source:'Saved practice and evaluated work only; not inferred personality or mood.',style:profile.style||'casual',skills:path.skills,practiceDays:scores.scores.map(s=>s.day),lastSavedAt:work[0]?.updated_at||null},access:{plan:allowance.plan,reviewLimit:allowance.limit,reviewsRemaining:Math.max(0,allowance.limit-allowance.used),ordinaryQuestions:'no daily limit'},whatsapp:{linked:!!contact?.verified_at,active:!!contact?.verified_at&&contact.state==='opted_in',remindersEnabled:!!contact?.verified_at&&contact.remind_state==='on',reminderHour:contact?.remind_hour,reminderFrequency:contact?.remind_freq,timezone:'Asia/Kolkata',draft:draftStatus,sync:'Journey, accepted work and signed-in practical draft text are shared. Draft conflicts require a choice; syncing never grants approval or points.'},preferences:personal?JSON.parse(coachContext(personal.answers)):null,currentTask:m?{id:m.id,title:m.title,situation:m.brief,idea:m.lesson,task:m.task}:null,draft:currentDraft,recentConversation:recentConversation?{question:recentConversation.question.slice(0,500),answer:(recentConversation.answer||'').slice(0,1800)}:null,accountActions:{progress:'Ask for my progress',course:'Change my course',continue:'TODAY',draft:'Show my draft',pause:'Pause my task',save:'SAVE: checks the whole submission; only accepted work is completed',reminders:'REMIND 7pm daily'}};
}
/** Normal questions have no daily counter and never consume a practical-review credit. */
export async function mentorReply(userId:string,question:string,missionId?:string,draft='',recentConversation?:{question:string;answer?:string}|null,channel:'web'|'whatsapp'='web'){
 const id=missionId||(await loadLearning(userId)).path.nextMissionId;
 const recent=recentConversation===undefined?await recentMentorTurn(userId,channel,id):recentConversation;
 const context=await mentorContext(userId,missionId,draft,recent);
 // General teaching must not become a second, unvalidated review of a stored draft.
 context.draft='';context.learning.feedback=null;
 const result=await answerMentor(question,context.profile.language,context);
 await rememberMentorTurn(userId,channel,id,question,result.answer);
 return result;
}
