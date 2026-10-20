import {reminderCopy} from './reminder-copy';
import {localizeMission} from './personalization';
import {briefFocus} from './chat-copy';
import {completedIds,loadScores} from './mission-points';
import {loadLearning} from './learning-service';
import {missions} from './missions';
import {starLearnerProgress} from './course-titles';
import {programmeNames} from './programmes';
import {practiceDay} from './play';
import {learnerName} from './learner-name';
export async function learnerPerformance(userId:string,at=new Date()){
 const [done,scores,{profile,path}]=await Promise.all([completedIds(userId),loadScores(userId,at),loadLearning(userId)]);
 const today=practiceDay(at.toISOString()),since=practiceDay(new Date(at.getTime()-6*864e5).toISOString());
 const recent=scores.scores.filter(s=>s.day>=since&&s.day<=today),mine=missions.filter(m=>m.track===profile.track);
 const count=mine.filter(m=>done.has(m.id)).length,star=starLearnerProgress(profile.track,done,scores.scores);
 const name=await learnerName(userId);
 const todayPoints=scores.scores.filter(s=>s.day===today).reduce((n,s)=>n+s.points,0),copy=reminderCopy(profile.language);
 const nextTitle=localizeMission(missions.find(m=>m.id===path.nextMissionId)!,profile.language,profile.level).title;
 return {name,count,nextTitle,star,todayPoints,weekMissions:recent.length,weekPoints:recent.reduce((n,s)=>n+s.points,0),streak:scores.streak.current,balance:scores.balance,
 text:`${copy.fallback?copy.fallback+'\n':''}*${copy.progress}${name?', '+name:''}*\n${programmeNames[profile.track]} · ${count}/10 ${copy.saved}\n${count===10?'🌟 Star Learner — earned! Help and breaks welcome.':`${copy.next}: *${nextTitle}*\n${path.focus?'Focus: '+briefFocus(path.focus.instruction):briefFocus(path.reason)}`}\n\n${count===10?'*ROADMAP* → review your work':'*TODAY* → pick up where you left off'}\n*POINTS* → optional reward details`};
}
