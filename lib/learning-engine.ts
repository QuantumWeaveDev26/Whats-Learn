import {skillKey} from './review-summary';
import type {LearningEvidence} from './learning-memory';
import {goals} from './personalization';
import {lessonLanguage} from './languages';
import {missions} from './missions';
import {defaultProfile,localizeMission,outcomePrompt,challengeInstruction,type Profile} from './personalization';

export type PracticeRecord={mission_id:string;checks:string;quiz:number};
export function reviewCount(checks:string){try{const values=JSON.parse(checks);return Array.isArray(values)?values.filter(v=>v===true).length:0}catch{return 0}}
export function learningPath(profile:Profile=defaultProfile,work:PracticeRecord[]=[],mode='adaptive',needsSupport=false,evidence:LearningEvidence[]=[]){
  const current=missions.filter(m=>m.track===profile.track);
  const pool=current.length?current:missions.filter(m=>m.track===defaultProfile.track);
  const valid=work.filter(w=>missions.some(m=>m.id===w.mission_id&&m.answer===Number(w.quiz)));
  const completed=new Set(valid.filter(w=>pool.some(m=>m.id===w.mission_id)).map(w=>w.mission_id));
  const revisit=pool.find(m=>valid.some(w=>w.mission_id===m.id&&reviewCount(w.checks)<3));
  const latest=evidence.filter(e=>pool.some(m=>m.id===e.mission_id)).sort((a,b)=>b.created_at.localeCompare(a.created_at));
  const pending=latest.find((e,i)=>!completed.has(e.mission_id)&&latest.findIndex(x=>x.mission_id===e.mission_id)===i);
  const firstUnsaved=pool.find(m=>!completed.has(m.id));
  const pendingMission=pending&&pending.mission_id===firstUnsaved?.id?firstUnsaved:undefined;
  const next=pendingMission||firstUnsaved||revisit||pool[0];
  const strong=valid.filter(w=>pool.some(m=>m.id===w.mission_id)&&reviewCount(w.checks)>=4).length;
  const skillReview=latest.find(e=>e.mission_id===next.id)||latest[0];
  const weak=skillReview?.review.blockingIssue?{item:'Correctness of the current work',met:false,note:skillReview.review.blockingIssue}:skillReview?.review.checks.find(c=>!c.met);
  const repeated=weak?latest.filter(e=>e.mission_id===skillReview?.mission_id&&(weak.item==='Correctness of the current work'?!!e.review.blockingIssue:e.review.checks.some(c=>skillKey(c.item)===skillKey(weak.item)&&!c.met))).length:0;
  const strongEvidence=skillReview?.review.answerAssessment?.onTopic===true&&skillReview.review.answerAssessment.correct===true&&skillReview.review.practicalTest?.reported===true&&skillReview.review.checks.every(c=>c.met);
  const skills:Record<string,{demonstrated:boolean;attempts:number;needsWork:number}>={};
  for(const e of latest){
    // A specific unmet criterion must not erase other demonstrated skills. A
    // correctness veto still blocks mastery when the review contradicts itself.
    const supported=e.review.answerAssessment?.onTopic===true&&!e.review.blockingIssue&&e.review.practicalTest?.reported===true&&(e.review.answerAssessment.correct===true||e.review.checks.some(c=>!c.met));
    for(const check of e.review.checks){const key=skillKey(check.item);const state=skills[key]??={demonstrated:check.met&&supported,attempts:0,needsWork:0};state.attempts++;if(!check.met)state.needsWork++;}
  }
  const focus=weak?{skill:weak.item,instruction:weak.note,repeated,mastered:false}:strongEvidence?{skill:'Apply the skill to a new constraint',instruction:'Test a different audience, failure case or constraint and explain what changed.',repeated:0,mastered:true}:null;
  const level=mode==='guided'||needsSupport?'guided':mode==='stretch'?'stretch':weak?'guided':strongEvidence?'stretch':revisit?'guided':profile.level==='experienced'||strong>=2?'stretch':'guided';
  const minutes=profile.minutes==='flexible'?next.minutes:Number(profile.minutes)||15;
  const sessionMinutes=Math.min(minutes,next.minutes);
  const fit='Your goal: '+(goals[profile.goal]||profile.goal)+'. Starting point: '+profile.level+'. '+(profile.minutes==='flexible'?'Flexible sessions.':profile.minutes+' minutes per session.');
  const reason=focus?(weak?'Practise '+weak.item+' because '+(repeated>1?'it needed attention in '+repeated+' evaluated attempts.':weak.note):'Your evaluated work met every criterion; try a new constraint instead of repeating the same example.'):revisit?'Your self-review shows a skill to revisit before moving on.':completed.size===0?'Start with one useful creation that matches your chosen programme.':pool.every(m=>completed.has(m.id))?'You have tried every starter challenge here. Improve one with a new example.':'Continue from your saved work with the next challenge in this programme.';
  const practiceLevel=skillReview?.review.profileLevel&&skillReview.review.profileLevel!==profile.level?profile.level:skillReview?.mission_id===next.id?skillReview.review.learningLevel||profile.level:strongEvidence?'experienced':repeated>1?'beginner':profile.level;
  const localized=localizeMission(next,profile.language,practiceLevel);
  const {answer: _answer,explanation: _explanation,...challenge}=localized;
  return {version:'1.0.0',profile,contentLanguage:lessonLanguage(profile.language),translationAvailable:lessonLanguage(profile.language)===profile.language,nextMissionId:next.id,practiceLevel,fit,skills,focus,lastFeedback:skillReview?.review||null,revisit:!!revisit,level,reason,sessionMinutes,estimatedMissionMinutes:next.minutes,
    sessionHint:minutes<next.minutes?'Use this session for the first part of this task. Keep your draft and return to finish the full practical trial.':'Create, check and improve one practical response.',
    challenge:{...challenge,outcome:outcomePrompt(profile.goal,profile.language),guidance:challengeInstruction(level,profile.language,!!next.practical)},
    steps:pool.map(m=>({id:m.id,title:localizeMission(m,profile.language).title,completed:completed.has(m.id)})),
    progress:{creations:completed.size,xp:completed.size*50,milestone:completed.size>=5?'Five creations':completed.size>=3?'Three creations':completed.size>=1?'First creation':'Your first creation awaits'},
    assessment:latest.length?'Suggestions use your stored AI-reviewed criteria; AI feedback is not a certified assessment.':'Suggestions use your choices and practice checks; no AI skill evidence yet.'};
}
