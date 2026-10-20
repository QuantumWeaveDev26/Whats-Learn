import {reminderCopy} from '../reminder-copy';
import {normalizeControlCommand,stopCommands,pauseReminders,stopMessages} from '../reminder-control';
import {createReport,latestReply} from '../quality/store';
import {mentorContext,mentorReply} from '../mentor';
import {recentMentorTurn,rememberMentorQuestion,rememberMentorTurn} from '../mentor-conversation';
import {learnerName,addressLearner} from '../learner-name';
import {mentorIntent,type MentorIntent} from '../mentor-intent';
import {readContext} from '../learner-context-store';
import {personalAngle} from '../learner-context';
import {currentStyleState,initialStyleState,interactionPrompt,styleTurn,checkedStyleTurn,type StyleState} from '../style-interactions';
import {checkStyleExplanation} from '../style-coach';
import {checkSkillPractice} from '../skill-practice-service';
import {briefFocus} from '../chat-copy';
import {aiReady,aiProvider,reviewChatPart,feedbackLanguage,FeedbackError,interpretMentorMessage} from '../ai-feedback';
import {allow} from '../auth/limits';
import {chatPartIssue,shortFieldHint,shortFieldLabel} from '../whatsapp-step-check';
import {feedbackSummary} from '../review-summary';
import {missionForLevel,startingLevels} from '../mission-levels';
import {learnerPerformance} from '../learner-performance';
import {missionPractice} from '../mission-practice';
import {canUseMission} from '../mission-access-server';
import {membershipRequired} from '../mission-access';
import {courseRoadmap} from '../course-roadmap';
import {learningStyle,learningStyles,learningStyleCodes,chatStyleIntro,chatStyleLesson,type LearningStyle} from '../learning-styles';
import {aiAllowance} from '../ai-usage';
import {goals,languages} from '../personalization';
import {database} from '../storage';
import {missions,type Mission} from '../missions';
import {localizeMission} from '../personalization';
import {loadLearning,saveProfile} from '../learning-service';
import {completedIds,clearedKeys,loadScores,recordClue,saveMissionWork} from '../mission-points';
import {lockFor,missionsOfCourse} from '../progression';
import {precheck} from '../submission';
import {composeAnswer,LIMITS,validLink,type Answer} from '../practical';
import {checkpointFor,checkpointKey,positionInCourse,type Checkpoint} from '../checkpoints';
import {attemptCheckpoint} from '../checkpoint-server';
import {pointsBalance,ensureAccount} from '../points';
import {clueDeduction,courseHits,dailyLimitMessage,missionHits} from '../mission-score';
import {courseTitles,titleFor} from '../course-titles';
import {whatsappConfig} from '../whatsapp';
import {sha256Hex} from './auth';
/**
 * WhatsApp learning chat for the n8n workflows. n8n only carries messages: every rule below (account link, mission order, mini challenges, one new mission a day,
 * clue costs, points, streaks, relevance checks) runs here, on the same functions and tables the website uses. Nothing in n8n computes or awards points.
 */
export type Contact={user_id:string;phone:string;state:string;language:string;consent_at:string;opted_out_at:string|null;last_inbound_at:string|null;last_reminder_at:string|null;current_mission:string|null;updated_at:string;verified_at:string|null;remind_state:string;remind_hour:number;remind_freq:string;quiet_start:number;quiet_end:number;style?:LearningStyle;level?:string;journeySynced?:boolean};
export type Out={action:'reply';text:string;context?:Record<string,unknown>}|{action:'none';reason:string}|{action:'tutor';question:string;language:string;material:Record<string,unknown>;maxWords:number;fallback:string};
const reply=(text:string):Out=>({action:'reply',text:text.slice(0,3900)});
const none=(reason:string):Out=>({action:'none',reason});
export const LINK_MINUTES=30;
const LINK_ATTEMPTS=5;
const letters='ABCDEF';
const now=()=>new Date();
const site=()=>whatsappConfig().siteUrl;
const ist=(d=now())=>{const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',hourCycle:'h23',weekday:'short',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);const g=(t:string)=>p.find(x=>x.type===t)!.value;return {hour:Number(g('hour')),weekday:g('weekday'),day:`${g('year')}-${g('month')}-${g('day')}`}};
const courseName=(track:string)=>titleFor(track)?.course||track;

// ---------- account link (the only way a phone number becomes a WhatsLearn account) ----------
const CODE_ALPHABET='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function newCode(){const b=new Uint8Array(8);crypto.getRandomValues(b);return [...b].map(x=>CODE_ALPHABET[x%CODE_ALPHABET.length]).join('')}
const codeHash=(phone:string,code:string)=>sha256Hex(`${phone}:${code.toUpperCase()}`);
/** Called from the signed-in website. Stores the number as UNVERIFIED and returns a one-time code to send from that number on WhatsApp. */
export async function startLink(userId:string,phone:string,language:string,at=now(),displayName=''){
 const db=database(),stamp=at.toISOString();
 const taken=await db.prepare('SELECT user_id FROM whatsapp_contacts WHERE phone=? AND user_id<>? AND verified_at IS NOT NULL').bind(phone,userId).first();
 if(taken)return {ok:false as const,status:409,message:'This number is already linked to another WhatsLearn account.'};
 // A number someone typed but never proved does not reserve it: the person who really holds the phone can still link it.
 await db.batch([db.prepare('DELETE FROM whatsapp_link_codes WHERE user_id IN (SELECT user_id FROM whatsapp_contacts WHERE phone=? AND user_id<>? AND verified_at IS NULL)').bind(phone,userId),db.prepare('DELETE FROM whatsapp_contacts WHERE phone=? AND user_id<>? AND verified_at IS NULL').bind(phone,userId)]);
 await db.prepare("INSERT INTO whatsapp_contacts(user_id,phone,state,language,consent_at,updated_at) VALUES (?,?,'pending',?,?,?) ON CONFLICT(user_id) DO UPDATE SET phone=excluded.phone,state=CASE WHEN whatsapp_contacts.phone=excluded.phone AND whatsapp_contacts.verified_at IS NOT NULL THEN whatsapp_contacts.state ELSE 'pending' END,verified_at=CASE WHEN whatsapp_contacts.phone=excluded.phone THEN whatsapp_contacts.verified_at ELSE NULL END,language=excluded.language,consent_at=excluded.consent_at,opted_out_at=NULL,updated_at=excluded.updated_at").bind(userId,phone,language,stamp,stamp).run();
 if(displayName)await db.prepare('UPDATE whatsapp_contacts SET display_name=? WHERE user_id=?').bind(displayName.replace(/[\r\n*_~`]/g,'').slice(0,60),userId).run();
 const row=await db.prepare('SELECT verified_at FROM whatsapp_contacts WHERE user_id=?').bind(userId).first<{verified_at:string|null}>();
 if(row?.verified_at){await db.prepare("UPDATE whatsapp_contacts SET state='opted_in',updated_at=? WHERE user_id=?").bind(stamp,userId).run();return {ok:true as const,verified:true,code:null,expiresAt:null}}
 const code=newCode(),expires=new Date(at.getTime()+LINK_MINUTES*60000).toISOString();
 await db.prepare('INSERT INTO whatsapp_link_codes(user_id,phone,code_hash,expires_at,attempts) VALUES (?,?,?,?,0) ON CONFLICT(user_id) DO UPDATE SET phone=excluded.phone,code_hash=excluded.code_hash,expires_at=excluded.expires_at,attempts=0').bind(userId,phone,await codeHash(phone,code),expires).run();
 return {ok:true as const,verified:false,code,expiresAt:expires};
}
async function confirmLink(from:string,code:string,at=now()):Promise<Out>{
 const db=database();
 const row=await db.prepare('SELECT user_id,code_hash,expires_at,attempts FROM whatsapp_link_codes WHERE phone=?').bind(from).first<{user_id:string;code_hash:string;expires_at:string;attempts:number}>();
 const bad=reply(`That link code is not valid. Open ${site()}/settings, turn on WhatsApp lessons and send the new code from this number.`);
 if(!row)return bad;
 if(row.attempts>=LINK_ATTEMPTS||row.expires_at<at.toISOString()){await db.prepare('DELETE FROM whatsapp_link_codes WHERE user_id=?').bind(row.user_id).run();return bad}
 if(row.code_hash!==await codeHash(from,code)){await db.prepare('UPDATE whatsapp_link_codes SET attempts=attempts+1 WHERE user_id=?').bind(row.user_id).run();return bad}
 const stamp=at.toISOString();
 await db.batch([db.prepare("UPDATE whatsapp_contacts SET state='opted_in',verified_at=?,opted_out_at=NULL,last_inbound_at=?,updated_at=? WHERE user_id=? AND phone=?").bind(stamp,stamp,stamp,row.user_id,from),db.prepare('DELETE FROM whatsapp_link_codes WHERE user_id=?').bind(row.user_id)]);
 const greeting=(await learnerOverview(row.user_id)).split('\n')[0];
 return reply(greeting+'\nLinked ✅ Small steps. Real skills.\nSend *TODAY* for your first move.\n*PROFILE* for your setup · *STOP* to pause.');
}
export async function unlink(userId:string){const db=database();await db.batch([db.prepare("UPDATE whatsapp_contacts SET state='opted_out',remind_state='off',opted_out_at=?,updated_at=? WHERE user_id=?").bind(now().toISOString(),now().toISOString(),userId),db.prepare('DELETE FROM whatsapp_link_codes WHERE user_id=?').bind(userId),db.prepare('DELETE FROM whatsapp_drafts WHERE user_id=?').bind(userId),db.prepare('DELETE FROM whatsapp_saved_drafts WHERE user_id=?').bind(userId)])}

// Drafts survive a break. Clear only on save, cancellation, unlink or account deletion.
type Draft={mission_id:string;quiz:number|null;data:{fields:Record<string,string>;reasoning?:string;link?:string;checks?:number[];edit?:string;level?:string;revisiting?:boolean;styleState?:StyleState};pending_clue:string|null};
async function getDraft(userId:string):Promise<Draft|null>{
 const r=await database().prepare('SELECT mission_id,quiz,body,pending_clue,updated_at FROM whatsapp_drafts WHERE user_id=?').bind(userId).first<{mission_id:string;quiz:number|null;body:string|null;pending_clue:string|null;updated_at:string}>();
 if(!r)return null;
 let data:Draft['data'];try{data=JSON.parse(r.body||'')}catch{data={fields:{}}}
 return {mission_id:r.mission_id,quiz:r.quiz,data:{...data,fields:data.fields||{}},pending_clue:r.pending_clue};
}
async function putDraft(userId:string,d:Draft){await database().prepare('INSERT INTO whatsapp_drafts(user_id,mission_id,quiz,body,pending_clue,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET mission_id=excluded.mission_id,quiz=excluded.quiz,body=excluded.body,pending_clue=excluded.pending_clue,updated_at=excluded.updated_at').bind(userId,d.mission_id,d.quiz,JSON.stringify(d.data),d.pending_clue,now().toISOString()).run()}
const dropDraft=(userId:string)=>database().prepare('DELETE FROM whatsapp_drafts WHERE user_id=?').bind(userId).run();
const getMission=(id:string,level?:string)=>level?missionForLevel(missions.find(m=>m.id===id)!,level):missions.find(m=>m.id===id)!;
/** The parts of an answer, in order. */
export function stepsFor(m:Mission){return ['quiz',...(m.practical?.fields||[]).map(f=>'f:'+f.id),'reasoning',...(m.practical?.link?['link']:[])]}
const filled=(d:Draft,s:string)=>s==='quiz'?d.quiz!==null:s==='reasoning'?!!d.data.reasoning:s==='link'?d.data.link!==undefined:s==='checks'?!!d.data.checks:!!d.data.fields[s.slice(2)];
async function archiveCompletedDraft(userId:string,missionId:string){
 const db=database();
 await db.batch([
  db.prepare('INSERT INTO whatsapp_saved_drafts(user_id,mission_id,quiz,body,pending_clue,updated_at,archived_at) SELECT user_id,mission_id,quiz,body,pending_clue,updated_at,? FROM whatsapp_drafts WHERE user_id=? AND mission_id=? ON CONFLICT(user_id,mission_id) DO UPDATE SET quiz=excluded.quiz,body=excluded.body,pending_clue=excluded.pending_clue,updated_at=excluded.updated_at,archived_at=excluded.archived_at').bind(now().toISOString(),userId,missionId),
  db.prepare('DELETE FROM whatsapp_drafts WHERE user_id=? AND mission_id=?').bind(userId,missionId)
 ]);
}
async function savedDrafts(c:Contact,missionId=''):Promise<Out>{
 const db=database();
 if(!missionId){const rows=await db.prepare('SELECT mission_id FROM whatsapp_saved_drafts WHERE user_id=? ORDER BY archived_at DESC LIMIT 40').bind(c.user_id).all<{mission_id:string}>();return reply(rows.results.length?'Kept chat revisions:\n'+rows.results.map(r=>`*RESUME ${r.mission_id}* · ${missions.find(m=>m.id===r.mission_id)?.title||r.mission_id}`).join('\n'):'No parked chat drafts. *TODAY* → continue.');}
 if(!missions.some(m=>m.id===missionId))return reply('Send DRAFTS to see your kept revisions.');
 if(!await canUseMission(c.user_id,missionId))return reply(membershipRequired+'\n'+site()+'/membership');
 const active=await getDraft(c.user_id);
 if(active)return reply('Your current draft is still open. Finish it first, or CANCEL to discard it.');
 const take=await db.prepare('INSERT OR IGNORE INTO whatsapp_drafts(user_id,mission_id,quiz,body,pending_clue,updated_at) SELECT user_id,mission_id,quiz,body,pending_clue,? FROM whatsapp_saved_drafts WHERE user_id=? AND mission_id=?').bind(now().toISOString(),c.user_id,missionId).run();
 if(!take.meta.changes)return reply('That saved draft was not opened. Send DRAFTS to see yours.');
 const draft=(await getDraft(c.user_id))!;draft.data.revisiting=true;await putDraft(c.user_id,draft);const m=getMission(draft.mission_id,draft.data.level||c.level),step=currentStep(m,draft);
 return reply('Revision opened. Your completed progress stays saved.\n'+(step==='ready'?readyText(m,draft):promptFor(m,step,draft,c.language,c.style)));
}
const currentStep=(m:Mission,d:Draft)=>d.quiz!==m.answer?'quiz':(d.data.edit&&stepsFor(m).includes(d.data.edit)?d.data.edit:stepsFor(m).find(s=>!filled(d,s))||'ready');
function draftIssue(m:Mission,d:Draft){for(const f of m.practical?.fields||[]){const value=d.data.fields[f.id];if(value&&f.type!=='choice'){const issue=chatPartIssue(m,value,f);if(issue)return {step:'f:'+f.id,message:issue}}}if(d.data.reasoning){const issue=chatPartIssue(m,d.data.reasoning);if(issue)return {step:'reasoning',message:issue}}return null;}
function optionList(options:string[]){return options.map((o,i)=>`${letters[i]}) ${o}`).join('\n')}
function promptFor(m:Mission,step:string,d:Draft,language:string,style:unknown='casual',followUp=''):string{
 const lm=localizeMission(m,language);
 if(step==='quiz')return interactionPrompt(lm,currentStyleState(style,d.data.styleState));
 if(step==='reasoning')return '*Show your work ⚡*\n'+(followUp||'Made → tested → result → fixed. Send the work + one real result.');
 if(step==='link')return '*Got a link?* Drop an https link or *SKIP*.\nGitHub source goes to AI on SAVE; code is never run.';
 const f=m.practical!.fields.find(x=>'f:'+x.id===step)!;const n=m.practical!.fields.indexOf(f)+1;
 const body=f.type==='choice'?`${optionList(f.options||[])}\n\nPick A–${letters[(f.options?.length||1)-1]}.`:f.type==='code'?`${f.starter?`Starter code (it has a problem to fix):\n${f.starter}\n\n`:''}Your fix → one message.`:'';
 const kind=learningStyle(style),heading=kind==='game'?`🎮 BUILD CHECKPOINT ${n}/${m.practical!.fields.length}`:kind==='story'?`📖 SCENE ${n+2}`:kind==='facts'?`⚡ APPLY ${n}/${m.practical!.fields.length}`:`💬 ${n}/${m.practical!.fields.length}`;
 return `*${heading} · ${shortFieldLabel(m,f)}*\n${followUp||shortFieldHint(m,f)}${body?"\n"+body:""}`;
}
function readyText(m:Mission,d:Draft){
 return `Your draft is filled in—not yet approved.\nReply *SAVE* for the final review, or *EDIT* to change it.`;
}
/** Applies one learner message to the part being asked for. Returns the reply. */
async function takeAnswer(userId:string,c:Contact,m:Mission,d:Draft,text:string):Promise<Out>{
 if(!await canUseMission(userId,m.id))return reply(membershipRequired+'\n'+site()+'/membership');
 const step=currentStep(m,d),t=text.trim(),lm=localizeMission(m,c.language);
 const again=(why:string)=>reply(`${why}\n\n${promptFor(m,step,d,c.language,c.style)}`);
 const letter=(n:number)=>{const x=t.toUpperCase().replace(/[).\s]/g,'');const i=/^[A-F]$/.test(x)?letters.indexOf(x):/^[1-6]$/.test(x)?Number(x)-1:-1;return i>=0&&i<n?i:-1};
 let reaction='',followUp='';
 if(step==='quiz'){
  const state=currentStyleState(c.style,d.data.styleState);
  // Old letter replies remain valid in Casual; the normal route is an own-words check.
  const legacyPick=state.style==='casual'?letter(lm.options.length):-1;
  if(legacyPick>=0){if(legacyPick!==m.answer)return again('That answer is not correct. '+m.explanation);d.quiz=legacyPick;reaction='That decision fits. Now make it concrete.';}
  else {
   let turn=styleTurn(lm,state,t,c.language);
   if(turn.needsCheck){try{turn=checkedStyleTurn(state,await checkStyleExplanation(userId,m,t,c.language,c.style,state));}catch(e){return again(e instanceof FeedbackError?e.message:'The coach could not check this. Your draft is kept. Retry.');}}
   d.data.styleState=turn.state;
   if(!turn.completed){await putDraft(userId,d);return reply(turn.state.stage===state.stage?turn.reply:turn.reply+'\n\n'+interactionPrompt(lm,turn.state));}
   d.quiz=m.answer;reaction=turn.reply;
  }
  delete d.data.styleState;
 }else if(step==='link'){
  if(/^skip$/i.test(t))d.data.link='';else if(validLink(t))d.data.link=t;else return again('Drop a valid https link, or SKIP.');reaction='Got it.';
 }else{
  const field=step==='reasoning'?undefined:m.practical!.fields.find(x=>'f:'+x.id===step)!;
  let value=t;
  if(field?.type==='choice'){const i=letter(field.options?.length||0);if(i<0)return again('Pick one of the letters shown 👀');value=field.options![i]}
  else{const issue=chatPartIssue(m,value,field);if(issue)return again(issue);if(field&&Object.entries(d.data.fields).some(([id,v])=>id!==field.id&&v.trim().toLowerCase()===value.toLowerCase()))return again('Same line, different part? Give this one its own answer.')}
  if(!aiReady())return again('Coach’s offline for a moment. Your reply hasn’t been checked—try again soon.');
  const allowance=await aiAllowance(userId),limit=allowance.limit>3?40:20;
  if(!await allow('whatsapp-chat-check',userId,limit,86400,Date.now()+19800000))return again('You’ve used today’s chat checks. Your draft’s safe—come back after midnight India time.');
  const proposed:Draft={...d,data:{...d.data,fields:{...d.data.fields}}};delete proposed.data.edit;
  if(field)proposed.data.fields[field.id]=value;else proposed.data.reasoning=value;
  const nextStep=currentStep(m,proposed),nextField=nextStep.startsWith('f:')?m.practical!.fields.find(f=>'f:'+f.id===nextStep):null;
  try{
   const review=await reviewChatPart(m.id,field||{label:'Work, actual test result and improvement',type:'reasoning'},value,{...d.data.fields,...(d.data.reasoning?{reasoning:d.data.reasoning}:{})},nextField|| (nextStep==='reasoning'?{label:'Work, actual test result and improvement'}:null),c.language,c.level,c.style);
   if(!review.accepted)return reply(`${review.feedback}\n${review.followUp}`);
   reaction=review.feedback;followUp=review.followUp;
  }catch(e){return again(e instanceof FeedbackError?e.message:'Coach couldn’t check that reply. Try again—your draft is safe.')}
  if(field)d.data.fields[field.id]=value;else d.data.reasoning=value;
 }
 delete d.data.edit;d.pending_clue=null;const oldIssue=draftIssue(m,d);if(oldIssue){d.data.edit=oldIssue.step;followUp=''}await putDraft(userId,d);
 const next=currentStep(m,d);
 return reply(reaction+'\n\n'+(next==='ready'?readyText(m,d):promptFor(m,next,d,c.language,c.style,followUp)));
}

// ---------- messages ----------
function missionIntro(m:Mission,language:string,style:unknown){
 const lm=localizeMission(m,language);
 return (m.practiceLevel?`*${startingLevels[m.practiceLevel]}*\n`:'')+chatStyleIntro(lm,style,positionInCourse(m),language);
}
function checkpointText(cp:Checkpoint){return `*Mini challenge: ${cp.title}*\n${cp.scenario}\n\n1. ${cp.parts[0].q}\n${optionList(cp.parts[0].options)}\n\n2. ${cp.parts[1].q}\n${optionList(cp.parts[1].options)}\n\nReply CHECK with a letter for each, like *CHECK B A*. It adds no points and does not use your daily mission.`}
async function setCurrent(userId:string,missionId:string){await database().prepare('UPDATE whatsapp_contacts SET current_mission=?,updated_at=? WHERE user_id=?').bind(missionId,now().toISOString(),userId).run()}
async function today(c:Contact):Promise<Out>{
 const userId=c.user_id;await ensureAccount(userId);
 const {path,work}=await loadLearning(userId);const done=await completedIds(userId),cleared=await clearedKeys(userId);
 const track=path.profile.track,list=missionsOfCourse(track);
 if(path.remediation)return reply(`*${path.remediation.title}*\nWhy: ${path.reason}\n${path.remediation.scenario}\n${path.remediation.prompt}\n*PRACTICE your answer* → check this skill. Your main draft is kept.`);
 let open=await getDraft(userId);
 const synced=!!open&&!open.data.revisiting&&(done.has(open.mission_id)||getMission(open.mission_id).track!==path.profile.track);
 if(open&&synced){await archiveCompletedDraft(userId,open.mission_id);open=null;}
 const syncNote=(synced||c.journeySynced)?'Journey synced ✅ Chat revision kept: *DRAFTS*.\n':'';
 if(open&&open.mission_id){const m=getMission(open.mission_id,c.level);if(!await canUseMission(userId,m.id))return reply(membershipRequired+'\n'+site()+'/membership');const issue=draftIssue(m,open);if(issue){open.data.edit=issue.step;await putDraft(userId,open)}const step=currentStep(m,open);return reply(`${issue&&step===issue.step?'Quick fix: '+issue.message:'Back at it ⚡'}\n\n${step==='ready'?readyText(m,open):promptFor(m,step,open,c.language,c.style)}`)}
 if(list.every(m=>done.has(m.id))){
  const fin=checkpointFor(track,10);
  if(fin&&!cleared.has(checkpointKey(track,10)))return reply(`You finished every mission in ${courseName(track)}.\n\n${checkpointText(fin)}`);
  return reply(`You finished ${courseName(track)} and its mini challenges. Send COURSE to start another course, or open ${site()}/learn.`);
 }
 const next=missionForLevel(list.find(m=>m.id===path.nextMissionId)||list.find(m=>!done.has(m.id))!,path.practiceLevel);
 if(!await canUseMission(userId,next.id))return reply('✅ Your first 3 missions are done!\n'+membershipRequired+'\n'+site()+'/membership');
 const lock=lockFor(next,done,cleared);
 if(lock.locked&&lock.checkpoint){const cp=checkpointFor(lock.checkpoint.track,lock.checkpoint.after)!;return reply(`${lock.message}\n\n${checkpointText(cp)}`)}
 if(lock.locked)return reply(lock.message);
 const scores=await loadScores(userId);
 if(scores.todayUsed)return reply(`${syncNote}${dailyLimitMessage}\n${path.progress.creations}/10 creations saved.\nNext: ${path.challenge.title}`);
 void work;await setCurrent(userId,next.id);
 await putDraft(userId,{mission_id:next.id,quiz:null,data:{fields:{},level:path.practiceLevel,styleState:initialStyleState(c.style)},pending_clue:null});
 const d=(await getDraft(userId))!;
 const greeting=(await learnerOverview(userId)).split('\n')[0];
 return reply(`${syncNote}${greeting}\n\n${path.focus?'Next skill: '+path.focus.instruction.slice(0,160)+'\n':''}${missionIntro(next,c.language,c.style)}\n🎒 Make: ${missionPractice(next).outcome}\n\n${promptFor(next,'quiz',d,c.language,c.style)}\nLEARN for the idea · HELP for commands`);
}
async function chooseCourse(c:Contact,arg:string):Promise<Out>{
 const list=courseTitles.map((t,i)=>`${i+1}. ${t.course}`).join('\n');
 const {profile}=await loadLearning(c.user_id);
 if(!arg)return reply(`You are on *${courseName(profile.track)}*. Your progress in each course is kept.\n\n${list}\n\nReply COURSE 1, 2, 3 or 4 to switch.`);
 const a=arg.toLowerCase();const hit=/^[1-4]$/.test(a)?courseTitles[Number(a)-1]:courseTitles.find(t=>t.track===a||t.course.toLowerCase().includes(a));
 if(!hit)return reply(`I did not find that course.\n\n${list}\n\nReply COURSE 1, 2, 3 or 4.`);
 await saveProfile(c.user_id,{...profile,track:hit.track});await database().prepare('UPDATE whatsapp_contacts SET current_mission=NULL WHERE user_id=?').bind(c.user_id).run();const prior=await getDraft(c.user_id);if(prior)await archiveCompletedDraft(c.user_id,prior.mission_id);
 return reply(`Course set to *${hit.course}*. The website uses the same course. Reply TODAY for your next mission.`);
}
async function hint(c:Contact,arg:string):Promise<Out>{
 const d=await getDraft(c.user_id);if(!d)return reply('Reply TODAY first, then HINT for a clue about that mission.');
 if(!await canUseMission(c.user_id,d.mission_id))return reply(membershipRequired+'\n'+site()+'/membership');
 const m=getMission(d.mission_id,c.level),example=/^example$/i.test(arg.trim());const clue=example?'example':'hint';
 const used=(await database().prepare('SELECT clue FROM mission_clues WHERE user_id=? AND mission_id=?').bind(c.user_id,m.id).all()).results.map(r=>String(r.clue));
 const cost=used.includes(clue)?0:clueDeduction(used.length+1)-clueDeduction(used.length);
 d.pending_clue=clue;
 if(cost>0){await putDraft(c.user_id,d);return reply(`${example?'The worked example':'A hint'} costs ${cost} points (your balance is ${await pointsBalance(c.user_id)}). Reply *YES* to reveal it, or keep going without it.`)}
 return revealClue(c,d);
}
async function revealClue(c:Contact,d:Draft):Promise<Out>{
 const m=getMission(d.mission_id,c.level),clue=(d.pending_clue||'hint') as 'hint'|'example';d.pending_clue=null;await putDraft(c.user_id,d);
 const r=await recordClue(c.user_id,m.id,clue);
 if(!r.allowed)return reply(r.message||'This clue cannot be revealed right now.');
 const lm=localizeMission(m,c.language);
 const body=clue==='example'?`*Worked example:* ${lm.example}`:`*Hint:* ${lm.checks[0]}`;
 return reply(`${body}\n\n${r.charged?`${r.charged} points used. `:''}Balance: ${r.balance} points.`);
}
async function submit(c:Contact,arg:string):Promise<Out>{
 const d=await getDraft(c.user_id);if(!d)return reply('There is nothing to submit. Reply TODAY to start a mission.');
 const m=getMission(d.mission_id,c.level),step=currentStep(m,d);
 if(step!=='ready')return reply(`Your answer is not complete yet.\n\n${promptFor(m,step,d,c.language,c.style)}`);
 const issue=draftIssue(m,d);if(issue){d.data.edit=issue.step;await putDraft(c.user_id,d);return reply(`${issue.message}\n\n${promptFor(m,issue.step,d,c.language,c.style)}\nNothing was saved.`)}
 // Eligibility first: the same order check and mini-challenge check the website runs.
 const lock=lockFor(m,await completedIds(c.user_id),await clearedKeys(c.user_id));
 if(lock.locked)return reply(`${lock.message} Your answer was not saved.`);
 const checks=m.checks.map((_,i)=>d.data.checks?.includes(i+1)||false);
 const answer:Answer={fields:d.data.fields,reasoning:d.data.reasoning||'',link:d.data.link||''};
 const data={missionId:m.id,body:composeAnswer(m.practical,answer),checks,quiz:d.quiz!};
 void arg;
 const bad=precheck(m,data);
 if(bad){
  // A wrong understanding answer sends the learner back to that question only; everything else stays.
  if(d.quiz!==m.answer){d.quiz=null;await putDraft(c.user_id,d);return reply(`${bad}\n\n${promptFor(m,'quiz',d,c.language,c.style)}`)}
  return reply(`${bad}\n\nNothing was saved. Reply EDIT n to change a part, then SAVE again.`);
 }
 const r=await saveMissionWork(c.user_id,data);
 const feedback=r.review?feedbackSummary(r.review):null;
 const crisp=(text:string)=>briefFocus(text,12);
 const feedbackText=feedback?`✅ Works: ${crisp(feedback.worked)}\n🔧 Improve: ${crisp(feedback.improve)}\n⚡ Next action: ${crisp(feedback.next)}\n\n`:'';
 if(!r.saved)return reply(`${feedbackText||r.message+'\n\n'}Nothing was saved. Your draft is kept. ${r.code===429?'SAVE after midnight India time.':'EDIT to pick a part, then SAVE.'}`);
 await dropDraft(c.user_id);
 const performance=await learnerPerformance(c.user_id);
 const nextPath=(await loadLearning(c.user_id)).path;
 return reply(`${feedbackText}✅ ${r.status==='awarded'?'Mission cleared!':'Upgrade saved!'}\n${performance.count}/10 creations saved\n${performance.star.earned?'🌟 *Star Learner* — 10 useful creations completed. Help and breaks are welcome!\n':''}Website synced ✅\nNext challenge: ${nextPath.challenge.title}\n${briefFocus(nextPath.reason,14)}\n\n*TODAY* → next move · *POINTS* → optional rewards`);
}
async function check(c:Contact,arg:string):Promise<Out>{
 const {profile}=await loadLearning(c.user_id);const done=await completedIds(c.user_id),cleared=await clearedKeys(c.user_id);
 const list=missionsOfCourse(profile.track);let cp:Checkpoint|undefined;
 const next=list.find(m=>!done.has(m.id));
 if(next){const lock=lockFor(next,done,cleared);if(lock.locked&&lock.checkpoint)cp=checkpointFor(lock.checkpoint.track,lock.checkpoint.after)}
 else if(!cleared.has(checkpointKey(profile.track,10)))cp=checkpointFor(profile.track,10);
 if(!cp)return reply('There is no mini challenge waiting. Reply TODAY for your next mission.');
 const picks=(arg.toUpperCase().match(/[A-F1-6]/g)||[]).map(x=>/\d/.test(x)?Number(x)-1:letters.indexOf(x));
 if(picks.length!==2||picks.some((p,i)=>p<0||p>=cp!.parts[i].options.length))return reply(`${checkpointText(cp)}\n\nSend one letter for each question, like CHECK B A.`);
 const r=await attemptCheckpoint(c.user_id,cp.track,cp.after,picks);
 if(!r.ok)return reply(`${r.message}`);
 const lines=r.results.map((x,i)=>`${i+1}. ${x.message}`).join('\n');
 return reply(`${lines}\n\n${r.message}${r.passed&&!r.alreadyCleared?'\nReply TODAY for your next mission.':''}`);
}
async function points(c:Contact):Promise<Out>{
 const s=await loadScores(c.user_id);
 return reply(`Points: ${s.balance}\nStreak: ${s.streak.current} day${s.streak.current===1?'':'s'} (best ${s.streak.best})\nToday's new mission: ${s.todayUsed?'done':'open'}\n\nThis is the same balance as on the website.`);
}
const helpText=`WhatsLearn commands:\n*TODAY* next mission · *ROADMAP* your 10 days\n*LEARN* the idea and task\n*PRACTICE your answer* focused skill check\n*STYLE* switch Game, Casual, Story or Facts\n*HINT* a clue (costs points, asks first)\n*SAVE* keep your finished work\n*EDIT n* change a part · *CANCEL* discard\n*DRAFTS* kept revisions · *RESUME d1* reopen one\n*PROFILE* your name, choices, plan and remaining AI help\n*COURSE* pick a course\n*CHECK B A* answer a mini challenge\n*POINTS* balance · *PERFORMANCE* your progress\n*REMIND 7pm daily* reminders (also weekdays, weekly, OFF)\n*STOP* no more messages\n\nOr just ask a question about your mission.`;

// ---------- reminders: opt-in settings ----------
function parseHour(t:string){const m=t.toLowerCase().match(/^(\d{1,2})(?::?(\d{2}))?\s*(am|pm)?$/);if(!m)return null;let h=Number(m[1]);if(m[3]==='pm'&&h<12)h+=12;if(m[3]==='am'&&h===12)h=0;return h>=0&&h<=23?h:null}
export const inQuiet=(hour:number,start:number,end:number)=>start===end?false:start<end?hour>=start&&hour<end:hour>=start||hour<end;
const hourText=(h:number)=>`${h%12||12}${h<12?'am':'pm'}`;
async function remind(c:Contact,arg:string):Promise<Out>{
 const db=database(),words=arg.toLowerCase().split(/\s+/).filter(Boolean);
 const show=()=>reply(c.remind_state==='on'?`Reminders are *on*: ${c.remind_freq} at ${hourText(c.remind_hour)} India time. Each reminder includes your performance recap. Quiet hours ${hourText(c.quiet_start)} to ${hourText(c.quiet_end)}.\nChange: REMIND 7pm weekdays · REMIND QUIET 10pm 7am · REMIND OFF`:`Reminders are *off*. Turn them on with, for example, *REMIND 7pm daily* (daily, weekdays or weekly; India time). Your reminder includes a performance recap. One message at most per reminder day, never during quiet hours (${hourText(c.quiet_start)} to ${hourText(c.quiet_end)}).`);
 if(!words.length)return show();
 let hour=c.remind_hour,freq=c.remind_freq,qs=c.quiet_start,qe=c.quiet_end,state=c.remind_state;
 if(words[0]==='off'){await db.prepare("UPDATE whatsapp_contacts SET remind_state='off',updated_at=? WHERE user_id=?").bind(now().toISOString(),c.user_id).run();return reply('Reminders are off. Lessons still work when you send TODAY. STOP ends all messages.')}
 if(words[0]==='quiet'){const a=parseHour(words[1]||''),b=parseHour(words[2]||'');if(a===null||b===null)return reply('Send quiet hours like: REMIND QUIET 10pm 7am');qs=a;qe=b}
 else for(const w of words){
  if(w==='on')state='on';
  else if(['daily','weekdays','weekly'].includes(w)){freq=w;state='on'}
  else{const h=parseHour(w);if(h===null)return reply('I did not understand that. Try: REMIND 7pm daily, REMIND 8am weekdays, REMIND OFF.');hour=h;state='on'}
 }
 if(state==='on'&&inQuiet(hour,qs,qe))return reply(`${hourText(hour)} falls inside your quiet hours (${hourText(qs)} to ${hourText(qe)}). Pick another time, or change quiet hours first.`);
 await db.prepare('UPDATE whatsapp_contacts SET remind_state=?,remind_hour=?,remind_freq=?,quiet_start=?,quiet_end=?,updated_at=? WHERE user_id=?').bind(state,hour,freq,qs,qe,now().toISOString(),c.user_id).run();
 return reply(state==='on'?`Done. Reminders: ${freq} at ${hourText(hour)} India time, quiet hours ${hourText(qs)} to ${hourText(qe)}. Reply REMIND OFF or STOP any time.`:'Saved.');
}

// ---------- mentor questions; practical drafts stay separate ----------
const localQuestion=/(?:\b(?:enu|yaake|yake|hege|andre enu|arthavenu|heli|samjhao|kya|kyun|kaise)\b|ಏನು|ಯಾಕೆ|ಹೇಗೆ|ಅರ್ಥವೇನು|ತಿಳಿಸಿ|क्या|क्यों|कैसे|समझाओ)/iu;
const questionLike=(t:string)=>localQuestion.test(t)||/\?\s*(?:(?:short|brief|please|in\s|Kanglish|Kannada|English|Hindi)\b[^?]{0,100})?$/i.test(t)||(t.length<200&&/^(what|why|how|when|where|who|which|can|could|should|is|are|do|does|explain|help|tell|i don't|i do not|i'm stuck|im stuck|meaning)\b/i.test(t));
const generic=/\b(mission|task|lesson|hint|clue|question|option|checklist|stuck|confus|understand|mean|idea|part)\b/i;
export function relevance(text:string,mission:Mission,track:string):'ok'|'wrong-course'|'unclear'{
 const hits=courseHits(text),mine=hits[track]||0,others=Object.entries(hits).filter(([t])=>t!==track).sort((a,b)=>b[1]-a[1])[0];
 if(missionHits(mission,text)>=1||mine>=2&&(!others||others[1]<mine+2))return 'ok';
 if(others&&others[1]>=2&&others[1]>=mine+2)return 'wrong-course';
 if(generic.test(text)&&text.trim().split(/\s+/).length>=3)return 'ok';
 return 'unclear';
}
async function tutor(c:Contact,text:string,followup?:{question:string;answer?:string}|null):Promise<Out>{
 const {path}=await loadLearning(c.user_id);const d=await getDraft(c.user_id);
 const id=d?.mission_id||path.nextMissionId;
 const body=d?composeAnswer(getMission(id,c.level).practical,{fields:d.data.fields,reasoning:d.data.reasoning||'',link:d.data.link||''}):'';
 if(aiProvider())try{const answer=(await mentorReply(c.user_id,text,id,body,followup)).answer;return reply(answer)}catch{/* Let the n8n tutor try with the same fresh context; never return a dead end or mutate the draft. */}
 const context=await mentorContext(c.user_id,id,body,followup);
 if(!followup)await rememberMentorQuestion(c.user_id,'whatsapp',id,text);
 return {action:'tutor',question:text.trim().slice(0,500),language:feedbackLanguage(c.language,text),maxWords:45,fallback:'I couldn’t reach the mentor just now. Please ask again in a moment—your task is safe.',material:context};
}

export async function learnerOverview(userId:string){
 const {profile}=await loadLearning(userId);const a=await aiAllowance(userId);
 const name=await learnerName(userId);
 return `Hey${name?' '+name:''}! 👋\nCourse: ${courseName(profile.track)}\nGoal: ${goals[profile.goal]}\nLanguage: ${languages[profile.language]} · ${profile.minutes==='flexible'?'Flexible pace':profile.minutes+' min/day'}\nStyle: ${learningStyles[learningStyle(profile.style)]}\nPlan: ${a.plan} · AI reviews: ${Math.max(0,a.limit-a.used)}/${a.limit} left today\nMentor questions: no daily limit · reviews keep their plan allowance`;
}

// ---------- entry point ----------
const STOP_WORDS=stopCommands;
export type Inbound={wamid:string;from:string;text:string;type?:string};
/** One inbound WhatsApp message. Returns what n8n should do next. Duplicate message ids do nothing. */
export async function handleBridgeMessage(m:Inbound,at=now()):Promise<Out>{
 const db=database();
 const from=String(m.from||'').replace(/\D/g,'');
 if(!m.wamid||from.length<8||from.length>15)return none('invalid');
 const seen=await db.prepare('INSERT OR IGNORE INTO whatsapp_events(id,kind,processed_at) VALUES (?,?,?)').bind(m.wamid,m.type||'text',at.toISOString()).run();
 if(!seen.meta.changes)return none('duplicate');
 try{
  const prior=await db.prepare('SELECT user_id,state,last_inbound_at FROM whatsapp_contacts WHERE phone=? AND verified_at IS NOT NULL').bind(from).first<{user_id:string;state:string;last_inbound_at:string|null}>();
  const out=await route(from,String(m.text||''),m.type||'text',at);
  const returning=prior&&(!prior.last_inbound_at||at.getTime()-Date.parse(prior.last_inbound_at)>30*60000);
  if(prior?.state==='opted_in'&&returning&&!m.wamid.startsWith('mentor-profile:')&&!STOP_WORDS.includes(normalizeControlCommand(String(m.text||'')))){
   const name=await learnerName(prior.user_id);
   if(out.action==='reply')out.text=addressLearner(out.text,name);
   if(out.action==='tutor')out.material={...out.material,addressAs:name};
  }
  if(prior?.state==='opted_in'&&out.action==='reply'&&!m.wamid.startsWith('mentor-profile:')&&!STOP_WORDS.includes(normalizeControlCommand(String(m.text||'')))){
   const {path}=await loadLearning(prior.user_id),draft=await getDraft(prior.user_id);
   await rememberMentorTurn(prior.user_id,'whatsapp',draft?.mission_id||path.nextMissionId,String(m.text||''),out.text);
  }
  return out;
 }
 catch(e){await db.prepare('DELETE FROM whatsapp_events WHERE id=?').bind(m.wamid).run();throw e}
}
async function route(from:string,raw:string,type:string,at:Date):Promise<Out>{
 const db=database(),text=raw.trim().slice(0,4000);
 const word=normalizeControlCommand(text);const [cmdRaw,...rest]=text.split(/\s+/);const cmd=cmdRaw.toLowerCase().replace(/[.!,:;]+$/,'');const arg=rest.join(' ');
 const linkMatch=text.match(/^\s*link\s+([A-Za-z0-9-]{6,12})\s*$/i);
 if(linkMatch)return confirmLink(from,linkMatch[1].replace(/-/g,''),at);
 const c=await db.prepare('SELECT * FROM whatsapp_contacts WHERE phone=? AND verified_at IS NOT NULL').bind(from).first<Contact>();
 if(!c){
  if(STOP_WORDS.includes(word)){await db.batch([db.prepare("UPDATE whatsapp_contacts SET state='opted_out',remind_state='off',updated_at=? WHERE phone=?").bind(at.toISOString(),from),db.prepare('DELETE FROM whatsapp_link_codes WHERE phone=?').bind(from)]);return reply('You will not get more WhatsLearn messages here.')}
  return reply(`Welcome to WhatsLearn. To learn here, link this number to your account first: open ${site()}/settings, turn on WhatsApp lessons, then send the code you see as *LINK CODE* from this number.`);
 }
 await db.prepare('UPDATE whatsapp_contacts SET last_inbound_at=?,updated_at=? WHERE user_id=?').bind(at.toISOString(),at.toISOString(),c.user_id).run();
 if(STOP_WORDS.includes(word)){await stopMessages(c.user_id);return reply(reminderCopy(c.language).stopped)}
 if(cmd==='start'&&!arg){await db.prepare("UPDATE whatsapp_contacts SET state='opted_in',opted_out_at=NULL,updated_at=? WHERE user_id=?").bind(at.toISOString(),c.user_id).run();return reply('Welcome back. Lessons are on; reminders stay off until you send REMIND 7pm daily. Reply TODAY for your next mission.')}

 if(c.state!=='opted_in')return none('opted-out');
 if(word==='pause'){await pauseReminders(c.user_id);return reply(reminderCopy(c.language).paused)}
 if(cmd==='support'||/^(?:i need a person|human support|(?:i want to |can i )?(?:talk|speak) to (?:a )?(?:human|person|team)|contact support)/i.test(text))return reply('You can reach the team here: '+site()+'/support. Your draft is kept. Requests are saved for team review; this is not live chat.');
 if(cmd==='report'||(/^(?:please |can you |could you )?(?:report|flag)\b/i.test(text)&&/\b(?:reply|answer|response)\b/i.test(text))){
  const last=await latestReply(c.user_id,'whatsapp');if(!last)return reply('No recent reply is available to attach. Open '+site()+ '/support and paste it in a support request, or use Report reply beside a website answer. Your task is kept.');
  const reason=/language/i.test(text)?'wrong_language':/wrong|incorrect/i.test(text)?'wrong_answer':/long/i.test(text)?'too_long':/help/i.test(text)?'not_helpful':'other';
  const report=await createReport(c.user_id,{replyId:last.id,reason,note:text.slice(0,500),idempotencyKey:'wa-report-'+last.id});return reply('Report received · '+report.id.slice(0,8)+'. Attached reply: “'+last.answer.slice(0,200)+'”\nYour task is kept. Need a person? '+site()+'/support?report='+report.id);
 }

 if(type!=='text'&&type!=='button')return reply('Please send text. Reply HELP to see what I understand.');
 const savedLearning=await loadLearning(c.user_id);const savedProfile=savedLearning.profile;c.style=learningStyle(savedProfile.style);c.level=savedLearning.path.practiceLevel;c.language=savedProfile.language;
 let levelDraft=await getDraft(c.user_id);
 if(levelDraft&&!levelDraft.data.revisiting&&(getMission(levelDraft.mission_id).track!==savedProfile.track||savedLearning.work.some(w=>w.mission_id===levelDraft!.mission_id))){await archiveCompletedDraft(c.user_id,levelDraft.mission_id);await db.prepare('UPDATE whatsapp_contacts SET current_mission=NULL WHERE user_id=?').bind(c.user_id).run();levelDraft=null;c.journeySynced=true;}
 if(levelDraft&&levelDraft.data.level!==c.level){const completed=(await completedIds(c.user_id)).has(levelDraft.mission_id);if(levelDraft.data.revisiting)c.level=levelDraft.data.level||c.level;else if(!completed){levelDraft.quiz=null;delete levelDraft.data.styleState;levelDraft.data.level=c.level;await putDraft(c.user_id,levelDraft)}}
 const dispatch=async(intent:MentorIntent|null):Promise<Out|null>=>{
 if(intent?.kind==='preference')return tutor(c,text);
 if(intent?.kind==='edit')return editParts(c);
 if(intent?.kind==='task-question')return currentQuestion(c);
 if(intent?.kind==='points')return points(c);
 if(intent?.kind==='journey'){const out=await roadmap(c);if(out.action==='reply')out.text+='\n\nOpen your journey: '+site()+'/learn';return out}
 if(intent?.kind==='learn')return tutor(c,text);
 if(intent?.kind==='progress'){const p=await learnerPerformance(c.user_id);return reply(`${p.name?p.name+', here':'Here'}’s your progress:\n${p.count}/10 missions saved · ${p.streak}-day streak\nToday: +${p.todayPoints} points\n*TODAY* → continue.`)}
 if(intent?.kind==='course')return chooseCourse(c,intent.track||'');
 if(intent?.kind==='continue')return today(c);
 if(intent?.kind==='save')return submit(c,'');
 if(intent?.kind==='draft')return showDraft(c);
 if(intent?.kind==='keep-draft'){const d=await getDraft(c.user_id);return reply(d?'Your draft is already kept. Take your time—message me when you want to continue.':'No WhatsApp draft is open yet. Want to start your next task?')}
 if(intent?.kind==='roadmap')return roadmap(c);
 if(intent?.kind==='profile')return tutor(c,text);
 if(intent?.kind==='greeting'){const name=await learnerName(c.user_id);return reply(`Hey${name?' '+name:''}! 👋 What’s on your mind?`)}
 if(intent?.kind==='frustrated')return tutor(c,text);
 if(intent?.kind==='clarify'){
  const draft=await getDraft(c.user_id);const m=getMission(draft?.mission_id||savedLearning.path.nextMissionId,c.level);
  const previous=await recentMentorTurn(c.user_id,'whatsapp',m.id);
  if(previous||aiProvider())return tutor(c,text,previous);
  const field=draft?currentStep(m,draft):'quiz';
  return reply(field==='ready'?'Your draft is filled in. Send EDIT to see the parts.':`Quick version: ${field==='quiz'?'choose the action you would take in this situation.':field==='reasoning'?'say what you made, what happened when you tested it, and what you changed.':(()=>{const f=m.practical?.fields.find(f=>'f:'+f.id===field);return f?shortFieldHint(m,f):'tell me which part is unclear.'})()}`);
 }
 return null;
 };
 const directed=await dispatch(mentorIntent(text));if(directed)return directed;
 switch(cmd){
  case 'today':case 'lesson':case 'next':case 'menu':if(!arg)return today(c);break;
  case 'practice':{const {path}=await loadLearning(c.user_id);if(!path.remediation)return reply('No focused practice is waiting. Send TODAY to continue.');if(!arg)return reply(path.remediation.prompt+'\nReply PRACTICE followed by your answer.');try{const checked=await checkSkillPractice(c.user_id,path.remediation.key,arg);return reply(checked.feedback+'\n'+(checked.accepted?'Skill check passed. Apply it to your creation. *TODAY* → continue.':checked.followUp));}catch(e){return reply(e instanceof FeedbackError?e.message:'Practice check unavailable. Your draft is safe; retry.')}}
  case 'drafts':return savedDrafts(c);
  case 'draft':return showDraft(c);
  case 'resume':return savedDrafts(c,arg.toLowerCase());
  case 'performance':case 'stats':return reply((await learnerPerformance(c.user_id)).text);
  case 'roadmap':return roadmap(c,arg.toLowerCase()==='all');
  case 'profile':case 'info':case 'plan':{const personal=await readContext(c.user_id),context=await mentorContext(c.user_id),d=await getDraft(c.user_id);const m=d&&await canUseMission(c.user_id,d.mission_id)?getMission(d.mission_id,c.level):null;return {action:'reply',text:await learnerOverview(c.user_id)+(personal?'\nPersonal setup: saved and locked · shared with the website.':''),context:{...context,currentPrompt:d&&m?{missionId:m.id,step:currentStep(m,d),text:currentStep(m,d)==='ready'?'All draft parts are filled in; final review has not been performed.':promptFor(m,currentStep(m,d),d,c.language,c.style)}:null}}}
  case 'question':return currentQuestion(c);
  case 'style':{
   const choices='1 · Casual 💬\n2 · Game 🎮\n3 · Story 📖\n4 · Facts ⚡';
   if(!arg)return reply(`Your style: *${learningStyles[learningStyle(c.style)]}*\n\n${choices}\n\nSend *STYLE GAME* (or 1–4). Same points; your current answer stays safe.`);
   const key=arg.toLowerCase(),picked=/^[1-4]$/.test(key)?learningStyleCodes[Number(key)-1]:learningStyleCodes.find(x=>x===key);
   if(!picked)return reply(`Choose one:\n${choices}\n\nExample: *STYLE STORY*`);
   const {profile}=await loadLearning(c.user_id);await saveProfile(c.user_id,{...profile,style:picked});
   return reply(`Style set: *${learningStyles[picked]}* ✅\nSynced with the website. Send *TODAY* to continue or *LEARN* for the idea.`);
  }
  case 'learn':{const d=await getDraft(c.user_id);if(!d)return reply('Send *TODAY* to start a challenge.');if(!await canUseMission(c.user_id,d.mission_id))return reply(membershipRequired+'\n'+site()+'/membership');const lm=localizeMission(getMission(d.mission_id,c.level),c.language);const personal=await readContext(c.user_id);const angle=personal?personalAngle(personal.answers,lm.track):null;return reply(`${chatStyleLesson({...lm,task:missionPractice(lm).trial},c.style,c.language)}${angle?'\n\nYour angle: '+angle.text:''}\n\n*Make:* ${missionPractice(lm).outcome}\n\nSend *TODAY* to continue.`)}
  case 'course':return chooseCourse(c,arg);
  case 'hint':return hint(c,arg);
  case 'yes':{const d=await getDraft(c.user_id);if(d?.pending_clue)return revealClue(c,d);break}
  case 'save':case 'submit':return submit(c,arg);
  case 'help':return reply(helpText);
  case 'cancel':{const d=await getDraft(c.user_id);if(d){await dropDraft(c.user_id);return reply('Discarded. Nothing was saved. Reply TODAY to start again.')}return reply('There is nothing to cancel.')}
  case 'edit':{
   if(!arg)return editParts(c);
   const d=await getDraft(c.user_id);if(!d)return reply('Reply TODAY to start a mission first.');
   const m=getMission(d.mission_id,c.level),steps=stepsFor(m),n=Number(arg);
   if(!Number.isInteger(n)||n<1||n>steps.length)return reply(steps.map((s,i)=>`${i+1}. ${s==='quiz'?'Your decision':s==='reasoning'?'Your reasoning':s==='checks'?'Self-review':s==='link'?'Link':m.practical!.fields.find(f=>'f:'+f.id===s)!.label}`).join('\n')+'\nSend *EDIT 2*, for example.');
   d.data.edit=steps[n-1];if(steps[n-1]==='quiz'){d.quiz=null;d.data.styleState=initialStyleState(c.style);}await putDraft(c.user_id,d);return reply(promptFor(m,steps[n-1],d,c.language,c.style));
  }
  case 'check':return check(c,arg);
  case 'points':case 'score':case 'balance':return points(c);
  case 'remind':case 'reminders':return remind(c,arg);
  case 'link':return reply('This number is already linked. Reply TODAY to continue.');
  case 'ask':if(arg)return tutor(c,arg);return reply('Type your question after ASK, for example: ASK what is a believable outcome?');
  case 'answer':{const d=await getDraft(c.user_id);if(d&&arg)return takeAnswer(c.user_id,c,getMission(d.mission_id,c.level),d,arg);break}
 }
 const d=await getDraft(c.user_id);
 const m=d?getMission(d.mission_id,c.level):null,step=m&&d?currentStep(m,d):null;
 if(d&&m&&step==='ready'&&/^[1-5](?:\s+[1-5])*$/.test(text))return reply(readyText(m,d));
 if(d&&m&&step!=='ready'&&/^[a-f1-6][).]?$/i.test(text))return takeAnswer(c.user_id,c,m,d,text);
 if(d&&m&&step==='quiz'&&learningStyle(c.style)==='facts'&&/^(?:true|false)[.!]?$/i.test(text))return takeAnswer(c.user_id,c,m,d,text);
 if(!d&&/^[a-f1-6]$/i.test(text))return reply('Reply TODAY first to get a mission, then answer with a letter.');
 const semantic=await interpretMentorMessage(text,{hasDraft:!!d,ready:step==='ready',mission:m?.title,prompt:m?(step==='quiz'?m.question:step==='reasoning'?'Show your created work, actual test result and improvement.':m.practical?.fields.find(f=>'f:'+f.id===step)?.hint):undefined});
 const action=await dispatch(semantic);if(action)return action;
 if(semantic?.kind==='answer'&&d&&m&&step!=='ready')return takeAnswer(c.user_id,c,m,d,text);
 // When interpretation is unavailable, ordinary questions still reach the tutor. Ambiguous text never becomes graded work.
 return tutor(c,text);
}

async function showDraft(c:Contact):Promise<Out>{
 const d=await getDraft(c.user_id);if(!d)return reply('No WhatsApp draft is open. Message TODAY to start from your saved journey.');
 const m=getMission(d.mission_id,c.level),parts=Object.entries(d.data.fields).filter(([,v])=>v).slice(-3).map(([id,v])=>`${m.practical?.fields.find(f=>f.id===id)?.label||id}: ${briefFocus(v,12)}`);
 return reply(`*Your draft · ${m.title}*\n${parts.length?parts.join('\n'):'Your task is open; no practical answer is saved yet.'}\n\n${currentStep(m,d)==='ready'?'Ready for the final check. Say “submit my work” when you’re ready.':'Your place is kept. Say “let’s continue” to pick up here.'}`);
}
async function editParts(c:Contact):Promise<Out>{
 const d=await getDraft(c.user_id);if(!d)return reply('No draft is open yet. Say “start my task” to begin.');
 if(!await canUseMission(c.user_id,d.mission_id))return reply(membershipRequired+'\n'+site()+'/membership');
 const m=getMission(d.mission_id,c.level),steps=stepsFor(m);
 return reply('Which part do you want to change?\n'+steps.map((s,i)=>`${i+1}. ${s==='quiz'?'Your first answer':s==='reasoning'?'Your work and test result':s==='checks'?'Self-review':s==='link'?'Project link':m.practical!.fields.find(f=>'f:'+f.id===s)!.label}`).join('\n')+'\nReply EDIT and the number, e.g. EDIT 2.');
}
async function currentQuestion(c:Contact):Promise<Out>{
 const d=await getDraft(c.user_id);if(!d)return today(c);
 if(!await canUseMission(c.user_id,d.mission_id))return reply(membershipRequired+'\n'+site()+'/membership');
 const m=getMission(d.mission_id,c.level),step=currentStep(m,d);
 return reply(step==='ready'?`*Your first question*\n${localizeMission(m,c.language).question}\n\nYour draft is filled in. Reply EDIT 1 to change this answer, or EDIT for another part.`:promptFor(m,step,d,c.language,c.style));
}
async function roadmap(c:Contact,all=false):Promise<Out>{
 const {profile}=await loadLearning(c.user_id);const rows=courseRoadmap(profile.track,await completedIds(c.user_id),await clearedKeys(c.user_id)),count=rows.filter(r=>r.status==='complete').length;
 const next=rows.findIndex(r=>r.status==='current'),visible=all?rows:rows.slice(Math.max(0,next),Math.max(0,next)+3);
 return reply(`🗺️ *${courseName(profile.track)}*\n${count}/10 saved · 10-day foundation\n\n${visible.map(r=>`${r.status==='complete'?'✅':r.status==='current'?'👉':'○'} Day ${r.day}: ${r.deliverable}`).join('\n')}\n\n${count===10?'🎉 Foundation done. Review your creations.':'*TODAY* → make your next piece'}\n*ROADMAP ALL* → all 10 days`);
}
