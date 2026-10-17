import {briefFocus} from './chat-copy';
import {completedIds,loadScores} from './mission-points';
import {loadLearning} from './learning-service';
import {missions} from './missions';
import {starLearnerProgress} from './course-titles';
import {programmeNames} from './programmes';
import {practiceDay} from './play';
import {database} from './storage';
export async function learnerPerformance(userId:string,at=new Date()){
 const [done,scores,{profile,path}]=await Promise.all([completedIds(userId),loadScores(userId,at),loadLearning(userId)]);
 const today=practiceDay(at.toISOString()),since=practiceDay(new Date(at.getTime()-6*864e5).toISOString());
 const recent=scores.scores.filter(s=>s.day>=since&&s.day<=today),mine=missions.filter(m=>m.track===profile.track);
 const count=mine.filter(m=>done.has(m.id)).length,star=starLearnerProgress(profile.track,done,scores.scores);
 const saved=await database().prepare('SELECT display_name FROM learner_profiles WHERE user_id=?').bind(userId).first<{display_name:string|null}>();
 const name=saved?.display_name&&!saved.display_name.includes('@')?saved.display_name.slice(0,60):'learner';
 const todayScore=scores.scores.find(s=>s.day===today);
 return {name,count,star,todayPoints:todayScore?.points||0,weekMissions:recent.length,weekPoints:recent.reduce((n,s)=>n+s.points,0),streak:scores.streak.current,balance:scores.balance,
 text:`*Your progress, ${name}*\n${programmeNames[profile.track]} · ${count}/10 creations saved\n${count===10?'🌟 Star Learner — earned! Help and breaks welcome.':`Next: *${path.challenge.title}*\n${path.focus?'Focus: '+briefFocus(path.focus.instruction):briefFocus(path.reason)}`}\n\n${count===10?'*ROADMAP* → review your work':'*TODAY* → pick up where you left off'}\n*POINTS* → optional reward details`};
}
