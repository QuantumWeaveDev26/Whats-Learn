import {lessonLanguage} from './languages';
import {missions} from './missions';
import {defaultProfile,localizeMission,outcomePrompt,challengeInstruction,type Profile} from './personalization';

export type PracticeRecord={mission_id:string;checks:string;quiz:number};
export function reviewCount(checks:string){try{const values=JSON.parse(checks);return Array.isArray(values)?values.filter(v=>v===true).length:0}catch{return 0}}
export function learningPath(profile:Profile=defaultProfile,work:PracticeRecord[]=[],mode='adaptive',needsSupport=false){
  const current=missions.filter(m=>m.track===profile.track);
  const pool=current.length?current:missions.filter(m=>m.track===defaultProfile.track);
  const valid=work.filter(w=>missions.some(m=>m.id===w.mission_id&&m.answer===Number(w.quiz)));
  const completed=new Set(valid.map(w=>w.mission_id));
  const revisit=pool.find(m=>valid.some(w=>w.mission_id===m.id&&reviewCount(w.checks)<3));
  const next=revisit||pool.find(m=>!completed.has(m.id))||pool[0];
  const strong=valid.filter(w=>pool.some(m=>m.id===w.mission_id)&&reviewCount(w.checks)>=4).length;
  const level=mode==='guided'||needsSupport?'guided':mode==='stretch'?'stretch':revisit?'guided':profile.level==='experienced'||strong>=2?'stretch':'guided';
  const minutes=profile.minutes==='flexible'?next.minutes:Number(profile.minutes)||15;
  const sessionMinutes=Math.min(minutes,next.minutes);
  const reason=revisit?'Your self-review shows a skill to revisit before moving on.':completed.size===0?'Start with one useful creation that matches your chosen programme.':pool.every(m=>completed.has(m.id))?'You have tried every starter challenge here. Improve one with a new example.':'Continue from your saved work with the next challenge in this programme.';
  const localized=localizeMission(next,profile.language);
  const {answer: _answer,explanation: _explanation,...challenge}=localized;
  return {version:'1.0.0',profile,contentLanguage:lessonLanguage(profile.language),translationAvailable:lessonLanguage(profile.language)===profile.language,nextMissionId:next.id,revisit:!!revisit,level,reason,sessionMinutes,estimatedMissionMinutes:next.minutes,
    sessionHint:minutes<next.minutes?'Use this short session to choose your audience and draft the first part. Return to finish; the full mission takes longer.':'Create, check and improve one practical response.',
    challenge:{...challenge,outcome:outcomePrompt(profile.goal,profile.language),guidance:challengeInstruction(level,profile.language,!!next.practical)},
    steps:pool.map(m=>({id:m.id,title:localizeMission(m,profile.language).title,completed:completed.has(m.id)})),
    progress:{creations:completed.size,xp:completed.size*50,milestone:completed.size>=5?'Five creations':completed.size>=3?'Three creations':completed.size>=1?'First creation':'Your first creation awaits'},
    assessment:'Suggestions use completed knowledge checks and learner self-review, not independent skill assessment.'};
}
