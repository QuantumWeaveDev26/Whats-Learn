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
export type Contact={user_id:string;phone:string;state:string;language:string;consent_at:string;opted_out_at:string|null;last_inbound_at:string|null;last_reminder_at:string|null;current_mission:string|null;updated_at:string;verified_at:string|null;remind_state:string;remind_hour:number;remind_freq:string;quiet_start:number;quiet_end:number};
export type Out={action:'reply';text:string}|{action:'none';reason:string}|{action:'tutor';question:string;language:string;material:Record<string,unknown>;maxWords:number;fallback:string};
const reply=(text:string):Out=>({action:'reply',text:text.slice(0,3900)});
const none=(reason:string):Out=>({action:'none',reason});
export const TUTOR_DAILY_LIMIT=30;
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
export async function startLink(userId:string,phone:string,language:string,at=now()){
 const db=database(),stamp=at.toISOString();
 const taken=await db.prepare('SELECT user_id FROM whatsapp_contacts WHERE phone=? AND user_id<>? AND verified_at IS NOT NULL').bind(phone,userId).first();
 if(taken)return {ok:false as const,status:409,message:'This number is already linked to another WhatsLearn account.'};
 // A number someone typed but never proved does not reserve it: the person who really holds the phone can still link it.
 await db.batch([db.prepare('DELETE FROM whatsapp_link_codes WHERE user_id IN (SELECT user_id FROM whatsapp_contacts WHERE phone=? AND user_id<>? AND verified_at IS NULL)').bind(phone,userId),db.prepare('DELETE FROM whatsapp_contacts WHERE phone=? AND user_id<>? AND verified_at IS NULL').bind(phone,userId)]);
 await db.prepare("INSERT INTO whatsapp_contacts(user_id,phone,state,language,consent_at,updated_at) VALUES (?,?,'pending',?,?,?) ON CONFLICT(user_id) DO UPDATE SET phone=excluded.phone,state=CASE WHEN whatsapp_contacts.phone=excluded.phone AND whatsapp_contacts.verified_at IS NOT NULL THEN whatsapp_contacts.state ELSE 'pending' END,verified_at=CASE WHEN whatsapp_contacts.phone=excluded.phone THEN whatsapp_contacts.verified_at ELSE NULL END,language=excluded.language,consent_at=excluded.consent_at,opted_out_at=NULL,updated_at=excluded.updated_at").bind(userId,phone,language,stamp,stamp).run();
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
 return reply(`Linked. This number now shares your WhatsLearn progress with the website.\n\nReply TODAY for your next mission, HELP for all commands, STOP any time.`);
}
export async function unlink(userId:string){const db=database();await db.batch([db.prepare("UPDATE whatsapp_contacts SET state='opted_out',remind_state='off',opted_out_at=?,updated_at=? WHERE user_id=?").bind(now().toISOString(),now().toISOString(),userId),db.prepare('DELETE FROM whatsapp_link_codes WHERE user_id=?').bind(userId),db.prepare('DELETE FROM whatsapp_drafts WHERE user_id=?').bind(userId)])}

// ---------- drafts: the answer being built in chat. Deleted when saved, cancelled, or 24 hours old. ----------
type Draft={mission_id:string;quiz:number|null;data:{fields:Record<string,string>;reasoning?:string;link?:string;checks?:number[];edit?:string};pending_clue:string|null};
async function getDraft(userId:string):Promise<Draft|null>{
 const r=await database().prepare('SELECT mission_id,quiz,body,pending_clue,updated_at FROM whatsapp_drafts WHERE user_id=?').bind(userId).first<{mission_id:string;quiz:number|null;body:string|null;pending_clue:string|null;updated_at:string}>();
 if(!r)return null;
 if(Date.parse(r.updated_at)<Date.now()-864e5){await database().prepare('DELETE FROM whatsapp_drafts WHERE user_id=?').bind(userId).run();return null}
 let data:Draft['data'];try{data=JSON.parse(r.body||'')}catch{data={fields:{}}}
 return {mission_id:r.mission_id,quiz:r.quiz,data:{...data,fields:data.fields||{}},pending_clue:r.pending_clue};
}
async function putDraft(userId:string,d:Draft){await database().prepare('INSERT INTO whatsapp_drafts(user_id,mission_id,quiz,body,pending_clue,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET mission_id=excluded.mission_id,quiz=excluded.quiz,body=excluded.body,pending_clue=excluded.pending_clue,updated_at=excluded.updated_at').bind(userId,d.mission_id,d.quiz,JSON.stringify(d.data),d.pending_clue,now().toISOString()).run()}
const dropDraft=(userId:string)=>database().prepare('DELETE FROM whatsapp_drafts WHERE user_id=?').bind(userId).run();
const getMission=(id:string)=>missions.find(m=>m.id===id)!;
/** The parts of an answer, in order. */
export function stepsFor(m:Mission){return ['quiz',...(m.practical?.fields||[]).map(f=>'f:'+f.id),'reasoning',...(m.practical?.link?['link']:[]),'checks']}
const filled=(d:Draft,s:string)=>s==='quiz'?d.quiz!==null:s==='reasoning'?!!d.data.reasoning:s==='link'?d.data.link!==undefined:s==='checks'?!!d.data.checks:!!d.data.fields[s.slice(2)];
const currentStep=(m:Mission,d:Draft)=>d.data.edit||stepsFor(m).find(s=>!filled(d,s))||'ready';
function optionList(options:string[]){return options.map((o,i)=>`${letters[i]}) ${o}`).join('\n')}
function promptFor(m:Mission,step:string,d:Draft,language:string):string{
 const lm=localizeMission(m,language);
 if(step==='quiz')return `*Question 1 (understanding):* ${lm.question}\n${optionList(lm.options)}\n\nReply with the letter.`;
 if(step==='reasoning')return `*Your reasoning:* explain your choices in your own words (at least ${LIMITS.minReasoning} characters).`;
 if(step==='link')return `*Optional link* (${m.practical?.link?.label||'a draft you own'}): send an https address, or reply SKIP.`;
 if(step==='checks')return `*Self-review.* Which of these did you do? Reply the numbers, like 1 3 4, or 0 for none.\n${lm.checks.map((c,i)=>`${i+1}. ${c}`).join('\n')}`;
 const f=m.practical!.fields.find(x=>'f:'+x.id===step)!;const n=m.practical!.fields.indexOf(f)+1;
 const body=f.type==='choice'?`${optionList(f.options||[])}\n\nReply with the letter.`:f.type==='code'?`${f.starter?`Starter code (it has a problem to fix):\n${f.starter}\n\n`:''}Send your code in one message.`:`Reply with your text${f.type==='short'?` (up to ${LIMITS.short} characters)`:` (up to ${LIMITS.long} characters)`}.`;
 return `*Part ${n}: ${f.label}*\n${f.hint?f.hint+'\n':''}${body}`;
}
function readyText(m:Mission,d:Draft){
 return `All parts are in. Nothing is saved yet.\n\nReply *SUBMIT* to save and score it, *EDIT n* to change a part (${stepsFor(m).map((s,i)=>`${i+1}=${s==='quiz'?'question':s==='reasoning'?'reasoning':s==='checks'?'self-review':s==='link'?'link':m.practical!.fields.find(f=>'f:'+f.id===s)!.label}`).join(', ')}), or *CANCEL* to discard.`;
}
/** Applies one learner message to the part being asked for. Returns the reply. */
async function takeAnswer(userId:string,c:Contact,m:Mission,d:Draft,text:string):Promise<Out>{
 const step=currentStep(m,d),t=text.trim(),lm=localizeMission(m,c.language);
 const again=(why:string)=>reply(`${why}\n\n${promptFor(m,step,d,c.language)}`);
 const letter=(n:number)=>{const x=t.toUpperCase().replace(/[).\s]/g,'');const i=/^[A-F]$/.test(x)?letters.indexOf(x):/^[1-6]$/.test(x)?Number(x)-1:-1;return i>=0&&i<n?i:-1};
 if(step==='quiz'){const i=letter(lm.options.length);if(i<0)return again('Reply with one of the letters shown.');d.quiz=i}
 else if(step==='reasoning'){if(t.length>LIMITS.reasoning)return again(`Keep it under ${LIMITS.reasoning} characters.`);d.data.reasoning=t}
 else if(step==='link'){if(/^skip$/i.test(t))d.data.link='';else if(validLink(t))d.data.link=t;else return again('The link must start with https:// and be a normal web address.')}
 else if(step==='checks'){const nums=[...new Set((t.match(/\d+/g)||[]).map(Number))];if(!nums.length||nums.some(n=>n<0||n>m.checks.length))return again(`Reply numbers from 1 to ${m.checks.length}, or 0 for none.`);d.data.checks=nums.filter(n=>n>0)}
 else{
  const f=m.practical!.fields.find(x=>'f:'+x.id===step)!;
  if(f.type==='choice'){const i=letter(f.options?.length||0);if(i<0)return again('Reply with one of the letters shown.');d.data.fields[f.id]=f.options![i]}
  else{const max=f.type==='short'?LIMITS.short:f.type==='long'?LIMITS.long:LIMITS.code;if(t.length>max)return again(`That is ${t.length} characters; the limit is ${max}.`);d.data.fields[f.id]=t}
 }
 delete d.data.edit;d.pending_clue=null;await putDraft(userId,d);
 const next=currentStep(m,d);
 return reply(next==='ready'?readyText(m,d):promptFor(m,next,d,c.language));
}

// ---------- messages ----------
function missionIntro(m:Mission,language:string){
 const lm=localizeMission(m,language);
 return `*${lm.title}*  ·  ${positionInCourse(m)}/10  ·  ${lm.minutes} min\n\n${lm.brief}\n\n*The idea:* ${lm.lesson}\n\n*Your task:* ${lm.task}\n\nThis has 2 questions: understanding (25 points) and a practical task (75 points). A clue costs 5 points. A wrong answer costs nothing and you can retry.\n\nReply HINT for a clue, EDIT n to change a part, CANCEL to stop.`;
}
function checkpointText(cp:Checkpoint){return `*Mini challenge: ${cp.title}*\n${cp.scenario}\n\n1. ${cp.parts[0].q}\n${optionList(cp.parts[0].options)}\n\n2. ${cp.parts[1].q}\n${optionList(cp.parts[1].options)}\n\nReply CHECK with a letter for each, like *CHECK B A*. It adds no points and does not use your daily mission.`}
async function setCurrent(userId:string,missionId:string){await database().prepare('UPDATE whatsapp_contacts SET current_mission=?,updated_at=? WHERE user_id=?').bind(missionId,now().toISOString(),userId).run()}
async function today(c:Contact):Promise<Out>{
 const userId=c.user_id;await ensureAccount(userId);
 const {path,work}=await loadLearning(userId);const done=await completedIds(userId),cleared=await clearedKeys(userId);
 const track=path.profile.track,list=missionsOfCourse(track);
 const open=await getDraft(userId);
 if(open&&open.mission_id){const m=getMission(open.mission_id);const step=currentStep(m,open);return reply(`You are partway through *${localizeMission(m,c.language).title}*.\n\n${step==='ready'?readyText(m,open):promptFor(m,step,open,c.language)}\n\n(CANCEL discards this answer.)`)}
 if(list.every(m=>done.has(m.id))){
  const fin=checkpointFor(track,10);
  if(fin&&!cleared.has(checkpointKey(track,10)))return reply(`You finished every mission in ${courseName(track)}.\n\n${checkpointText(fin)}`);
  return reply(`You finished ${courseName(track)} and its mini challenges. Send COURSE to start another course, or open ${site()}/learn.`);
 }
 const next=list.find(m=>!done.has(m.id))!;
 const lock=lockFor(next,done,cleared);
 if(lock.locked&&lock.checkpoint){const cp=checkpointFor(lock.checkpoint.track,lock.checkpoint.after)!;return reply(`${lock.message}\n\n${checkpointText(cp)}`)}
 if(lock.locked)return reply(lock.message);
 const scores=await loadScores(userId);
 if(scores.todayUsed)return reply(`${dailyLimitMessage}\n\nStreak: ${scores.streak.current} day${scores.streak.current===1?'':'s'}. Points: ${scores.balance}.`);
 void work;await setCurrent(userId,next.id);
 await putDraft(userId,{mission_id:next.id,quiz:null,data:{fields:{}},pending_clue:null});
 const d=(await getDraft(userId))!;
 return reply(`${missionIntro(next,c.language)}\n\n${promptFor(next,'quiz',d,c.language)}`);
}
async function chooseCourse(c:Contact,arg:string):Promise<Out>{
 const list=courseTitles.map((t,i)=>`${i+1}. ${t.course}`).join('\n');
 const {profile}=await loadLearning(c.user_id);
 if(!arg)return reply(`You are on *${courseName(profile.track)}*. Your progress in each course is kept.\n\n${list}\n\nReply COURSE 1, 2, 3 or 4 to switch.`);
 const a=arg.toLowerCase();const hit=/^[1-4]$/.test(a)?courseTitles[Number(a)-1]:courseTitles.find(t=>t.track===a||t.course.toLowerCase().includes(a));
 if(!hit)return reply(`I did not find that course.\n\n${list}\n\nReply COURSE 1, 2, 3 or 4.`);
 await saveProfile(c.user_id,{...profile,track:hit.track});await dropDraft(c.user_id);
 return reply(`Course set to *${hit.course}*. The website uses the same course. Reply TODAY for your next mission.`);
}
async function hint(c:Contact,arg:string):Promise<Out>{
 const d=await getDraft(c.user_id);if(!d)return reply('Reply TODAY first, then HINT for a clue about that mission.');
 const m=getMission(d.mission_id),example=/^example$/i.test(arg.trim());const clue=example?'example':'hint';
 const used=(await database().prepare('SELECT clue FROM mission_clues WHERE user_id=? AND mission_id=?').bind(c.user_id,m.id).all()).results.map(r=>String(r.clue));
 const cost=used.includes(clue)?0:clueDeduction(used.length+1)-clueDeduction(used.length);
 d.pending_clue=clue;
 if(cost>0){await putDraft(c.user_id,d);return reply(`${example?'The worked example':'A hint'} costs ${cost} points (your balance is ${await pointsBalance(c.user_id)}). Reply *YES* to reveal it, or keep going without it.`)}
 return revealClue(c,d);
}
async function revealClue(c:Contact,d:Draft):Promise<Out>{
 const m=getMission(d.mission_id),clue=(d.pending_clue||'hint') as 'hint'|'example';d.pending_clue=null;await putDraft(c.user_id,d);
 const r=await recordClue(c.user_id,m.id,clue);
 if(!r.allowed)return reply(r.message||'This clue cannot be revealed right now.');
 const lm=localizeMission(m,c.language);
 const body=clue==='example'?`*Worked example:* ${lm.example}`:`*Hint:* ${lm.checks[0]}`;
 return reply(`${body}\n\n${r.charged?`${r.charged} points used. `:''}Balance: ${r.balance} points.`);
}
async function submit(c:Contact,arg:string):Promise<Out>{
 const d=await getDraft(c.user_id);if(!d)return reply('There is nothing to submit. Reply TODAY to start a mission.');
 const m=getMission(d.mission_id),step=currentStep(m,d);
 if(step!=='ready')return reply(`Your answer is not complete yet.\n\n${promptFor(m,step,d,c.language)}`);
 // Eligibility first: the same order check and mini-challenge check the website runs.
 const lock=lockFor(m,await completedIds(c.user_id),await clearedKeys(c.user_id));
 if(lock.locked)return reply(`${lock.message} Your answer was not saved.`);
 const checks=m.checks.map((_,i)=>d.data.checks!.includes(i+1));
 const answer:Answer={fields:d.data.fields,reasoning:d.data.reasoning||'',link:d.data.link||''};
 const data={missionId:m.id,body:composeAnswer(m.practical,answer),checks,quiz:d.quiz!};
 void arg;
 const bad=precheck(m,data);
 if(bad){
  // A wrong understanding answer sends the learner back to that question only; everything else stays.
  if(d.quiz!==m.answer){d.quiz=null;await putDraft(c.user_id,d);return reply(`${bad}\n\n${promptFor(m,'quiz',d,c.language)}`)}
  return reply(`${bad}\n\nNothing was saved. Reply EDIT n to change a part, then SUBMIT again.`);
 }
 const r=await saveMissionWork(c.user_id,data);
 if(!r.saved)return reply(`${r.message}\n\nNothing was saved. Your answer is kept for 24 hours${r.status==='daily-limit'?'; reply SUBMIT again tomorrow':'; reply EDIT n to change a part'}.`);
 await dropDraft(c.user_id);
 const balance=await pointsBalance(c.user_id),scores=await loadScores(c.user_id);
 return reply(`${r.message}\n\nBalance: ${balance} points. Streak: ${scores.streak.current} day${scores.streak.current===1?'':'s'}. It also shows on the website.\n\nReply TODAY for what is next.`);
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
const helpText=`WhatsLearn commands:\n*TODAY* next mission\n*HINT* a clue (costs points, asks first)\n*SUBMIT* save your finished answer\n*EDIT n* change a part · *CANCEL* discard\n*COURSE* pick a course\n*CHECK B A* answer a mini challenge\n*POINTS* balance and streak\n*REMIND 7pm daily* reminders (also weekdays, weekly, OFF)\n*STOP* no more messages\n\nOr just ask a question about your mission.`;

// ---------- reminders: opt-in settings ----------
function parseHour(t:string){const m=t.toLowerCase().match(/^(\d{1,2})(?::?(\d{2}))?\s*(am|pm)?$/);if(!m)return null;let h=Number(m[1]);if(m[3]==='pm'&&h<12)h+=12;if(m[3]==='am'&&h===12)h=0;return h>=0&&h<=23?h:null}
export const inQuiet=(hour:number,start:number,end:number)=>start===end?false:start<end?hour>=start&&hour<end:hour>=start||hour<end;
const hourText=(h:number)=>`${h%12||12}${h<12?'am':'pm'}`;
async function remind(c:Contact,arg:string):Promise<Out>{
 const db=database(),words=arg.toLowerCase().split(/\s+/).filter(Boolean);
 const show=()=>reply(c.remind_state==='on'?`Reminders are *on*: ${c.remind_freq} at ${hourText(c.remind_hour)} India time. Quiet hours ${hourText(c.quiet_start)} to ${hourText(c.quiet_end)}.\nChange: REMIND 7pm weekdays · REMIND QUIET 10pm 7am · REMIND OFF`:`Reminders are *off*. Turn them on with, for example, *REMIND 7pm daily* (daily, weekdays or weekly; India time). One message at most per reminder day, never during quiet hours (${hourText(c.quiet_start)} to ${hourText(c.quiet_end)}).`);
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

// ---------- tutor (OpenAI in n8n, grounded in approved material) ----------
const questionLike=(t:string)=>/\?\s*$/.test(t)||(t.length<200&&/^(what|why|how|when|where|who|which|can|could|should|is|are|do|does|explain|help|tell|i don't|i do not|i'm stuck|im stuck|meaning)\b/i.test(t));
const generic=/\b(mission|task|lesson|hint|clue|question|option|checklist|stuck|confus|understand|mean|idea|part)\b/i;
export function relevance(text:string,mission:Mission,track:string):'ok'|'wrong-course'|'unclear'{
 const hits=courseHits(text),mine=hits[track]||0,others=Object.entries(hits).filter(([t])=>t!==track).sort((a,b)=>b[1]-a[1])[0];
 if(missionHits(mission,text)>=1||mine>=2&&(!others||others[1]<mine+2))return 'ok';
 if(others&&others[1]>=2&&others[1]>=mine+2)return 'wrong-course';
 if(generic.test(text)&&text.trim().split(/\s+/).length>=3)return 'ok';
 return 'unclear';
}
async function tutor(c:Contact,text:string):Promise<Out>{
 const {path,profile}=await loadLearning(c.user_id);const d=await getDraft(c.user_id);
 const m=getMission(d?.mission_id||c.current_mission||path.nextMissionId),track=profile.track;
 const q=text.trim().slice(0,500);
 const rel=relevance(q,m,track);
 if(rel==='wrong-course'){
  const hits=courseHits(q),best=Object.entries(hits).filter(([t])=>t!==track).sort((a,b)=>b[1]-a[1])[0][0];
  return reply(`That sounds like *${courseName(best)}*, but you are on *${courseName(track)}*. Reply COURSE to switch, or ask about "${localizeMission(m,c.language).title}".`);
 }
 if(rel==='unclear')return reply(`I can help with your *${courseName(track)}* course, starting with "${localizeMission(m,c.language).title}". Which part is unclear: the idea, the task or the question?`);
 const day=ist().day,db=database();
 const used=await db.prepare('SELECT count FROM whatsapp_tutor_usage WHERE user_id=? AND day=?').bind(c.user_id,day).first<{count:number}>();
 if((used?.count||0)>=TUTOR_DAILY_LIMIT)return reply('You have used today\'s tutor questions. Commands like TODAY, HINT and SUBMIT still work, and the tutor is back after midnight India time.');
 await db.prepare('INSERT INTO whatsapp_tutor_usage(user_id,day,count) VALUES (?,?,1) ON CONFLICT(user_id,day) DO UPDATE SET count=count+1').bind(c.user_id,day).run();
 const lm=localizeMission(m,c.language);
 // Approved course material only. The answer key, the explanation and the worked example are never sent out of WhatsLearn.
 return {action:'tutor',question:q,language:c.language,maxWords:90,fallback:`I could not reach the tutor just now. Try again, or open ${site()}/learn?mission=${m.id}.`,material:{course:courseName(track),title:lm.title,skill:lm.skill,brief:lm.brief,lesson:lm.lesson,task:lm.task,checklist:lm.checks,question:lm.question,options:lm.options}};
}

// ---------- entry point ----------
const STOP_WORDS=['stop','unsubscribe','end','pause','optout','opt out','रुको','बंद','ನಿಲ್ಲಿಸಿ'];
export type Inbound={wamid:string;from:string;text:string;type?:string};
/** One inbound WhatsApp message. Returns what n8n should do next. Duplicate message ids do nothing. */
export async function handleBridgeMessage(m:Inbound,at=now()):Promise<Out>{
 const db=database();
 const from=String(m.from||'').replace(/\D/g,'');
 if(!m.wamid||from.length<8||from.length>15)return none('invalid');
 const seen=await db.prepare('INSERT OR IGNORE INTO whatsapp_events(id,kind,processed_at) VALUES (?,?,?)').bind(m.wamid,m.type||'text',at.toISOString()).run();
 if(!seen.meta.changes)return none('duplicate');
 try{return await route(from,String(m.text||''),m.type||'text',at)}
 catch(e){await db.prepare('DELETE FROM whatsapp_events WHERE id=?').bind(m.wamid).run();throw e}
}
async function route(from:string,raw:string,type:string,at:Date):Promise<Out>{
 const db=database(),text=raw.trim().replace(/\s+/g,' ').slice(0,4000);
 const word=text.toLowerCase();const [cmdRaw,...rest]=text.split(' ');const cmd=cmdRaw.toLowerCase().replace(/[.!,:;]+$/,'');const arg=rest.join(' ');
 const linkMatch=text.match(/^\s*link\s+([A-Za-z0-9-]{6,12})\s*$/i);
 if(linkMatch)return confirmLink(from,linkMatch[1].replace(/-/g,''),at);
 const c=await db.prepare('SELECT * FROM whatsapp_contacts WHERE phone=? AND verified_at IS NOT NULL').bind(from).first<Contact>();
 if(!c){
  if(STOP_WORDS.includes(word)){await db.batch([db.prepare("UPDATE whatsapp_contacts SET state='opted_out',remind_state='off',updated_at=? WHERE phone=?").bind(at.toISOString(),from),db.prepare('DELETE FROM whatsapp_link_codes WHERE phone=?').bind(from)]);return reply('You will not get more WhatsLearn messages here.')}
  return reply(`Welcome to WhatsLearn. To learn here, link this number to your account first: open ${site()}/settings, turn on WhatsApp lessons, then send the code you see as *LINK CODE* from this number.`);
 }
 await db.prepare('UPDATE whatsapp_contacts SET last_inbound_at=?,updated_at=? WHERE user_id=?').bind(at.toISOString(),at.toISOString(),c.user_id).run();
 if(STOP_WORDS.includes(word)){await unlink(c.user_id);return reply('You will not get more WhatsLearn messages or reminders. Send START any time to turn lessons back on.')}
 if(cmd==='start'&&!arg){await db.prepare("UPDATE whatsapp_contacts SET state='opted_in',opted_out_at=NULL,updated_at=? WHERE user_id=?").bind(at.toISOString(),c.user_id).run();return reply('Welcome back. Lessons are on; reminders stay off until you send REMIND 7pm daily. Reply TODAY for your next mission.')}
 if(c.state!=='opted_in')return none('opted-out');
 if(type!=='text'&&type!=='button')return reply('Please send text. Reply HELP to see what I understand.');
 switch(cmd){
  case 'today':case 'lesson':case 'next':case 'hi':case 'hello':case 'menu':if(!arg)return today(c);break;
  case 'course':return chooseCourse(c,arg);
  case 'hint':return hint(c,arg);
  case 'yes':{const d=await getDraft(c.user_id);if(d?.pending_clue)return revealClue(c,d);break}
  case 'submit':return submit(c,arg);
  case 'help':return reply(helpText);
  case 'cancel':{const d=await getDraft(c.user_id);if(d){await dropDraft(c.user_id);return reply('Discarded. Nothing was saved. Reply TODAY to start again.')}return reply('There is nothing to cancel.')}
  case 'edit':{
   const d=await getDraft(c.user_id);if(!d)return reply('Reply TODAY to start a mission first.');
   const m=getMission(d.mission_id),steps=stepsFor(m),n=Number(arg);
   if(!Number.isInteger(n)||n<1||n>steps.length)return reply(`Reply EDIT with a number from 1 to ${steps.length}.`);
   d.data.edit=steps[n-1];await putDraft(c.user_id,d);return reply(promptFor(m,steps[n-1],d,c.language));
  }
  case 'check':return check(c,arg);
  case 'points':case 'score':case 'balance':return points(c);
  case 'remind':case 'reminders':return remind(c,arg);
  case 'link':return reply('This number is already linked. Reply TODAY to continue.');
  case 'ask':if(arg)return tutor(c,arg);return reply('Type your question after ASK, for example: ASK what is a believable outcome?');
  case 'answer':{const d=await getDraft(c.user_id);if(d&&arg)return takeAnswer(c.user_id,c,getMission(d.mission_id),d,arg);break}
 }
 const d=await getDraft(c.user_id);
 if(d){
  const m=getMission(d.mission_id),step=currentStep(m,d);
  if(!questionLike(text))return step==='ready'?reply(readyText(m,d)):takeAnswer(c.user_id,c,m,d,text);
 }else if(/^[a-f1-6]$/i.test(text))return reply('Reply TODAY first to get a mission, then answer with a letter.');
 return tutor(c,text);
}
