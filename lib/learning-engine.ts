import {curriculumFor} from './curriculum-context';
import {adaptiveSkills} from './adaptive-skills';
import {programmeNames} from './programmes';
import {skillTask,type SkillPracticeRecord} from './skill-practice';
import {skillKey,supportedPracticalReview} from './review-summary';
import type {LearningEvidence} from './learning-memory';
import {goals} from './personalization';
import {lessonLanguage} from './languages';
import {missions} from './missions';
import {defaultProfile,localizeMission,outcomePrompt,challengeInstruction,type Profile} from './personalization';

export type PracticeRecord={mission_id:string;checks:string;quiz:number};
export function reviewCount(checks:string){try{const values=JSON.parse(checks);return Array.isArray(values)?values.filter(v=>v===true).length:0}catch{return 0}}
export function learningPath(profile:Profile=defaultProfile,work:PracticeRecord[]=[],mode='adaptive',needsSupport=false,evidence:LearningEvidence[]=[],practice:SkillPracticeRecord[]=[]){
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
  const skills=adaptiveSkills(latest,practice);
  const repeated=weak?(skills[weak.item==='Correctness of the current work'?'correctness':skillKey(weak.item)]?.consecutiveMistakes||0):0;
  const strongEvidence=!!skillReview&&supportedPracticalReview(skillReview.review)&&skillReview.review.checks.length>0&&skillReview.review.checks.every(c=>c.met);
  let focus=weak?{skill:weak.item,instruction:weak.note,repeated,mastered:false}:strongEvidence?{skill:'Apply the skill to a new constraint',instruction:'Test a different audience, failure case or constraint and explain what changed.',repeated:0,mastered:true}:null;
  const task=weak&&skillReview?skillTask(skillReview.mission_id,weak.item,weak.note,skillReview.reviewKey||skillReview.created_at,!!skillReview.review.blockingIssue,missions.find(m=>m.id===skillReview.mission_id)?.brief||''):null;
  const practiceState=task?practice.find(p=>p.task_key===task.key):undefined;
  const passed=practiceState?.accepted?practiceState:undefined;
  if(task&&!passed&&(practiceState?.mistakes||0)>=2)task.prompt+=' Start with one concrete example; keep the rest of your work.';
  const transferred=!!(weak&&skillReview&&!skillReview.review.blockingIssue&&skills[skillKey(weak.item)]?.demonstrated&&skills[skillKey(weak.item)].lastReviewedAt>skillReview.created_at);
  const remediation=task&&!passed&&!transferred?task:null;
  if(transferred)focus={skill:weak!.item,instruction:'Apply the skill you demonstrated later to this creation, then request a whole-mission review.',repeated:0,mastered:true};
  if(passed){focus={skill:'Apply your practised fix',instruction:'Update your full creation with this fix, then request a whole-mission review.',repeated:0,mastered:false};skills[passed.skill]={...(skills[passed.skill]||{attempts:0,needsWork:0,consecutiveMistakes:0,lastReviewedAt:passed.created_at}),demonstrated:true};}
  const level=mode==='guided'||needsSupport?'guided':mode==='stretch'?'stretch':weak?'guided':strongEvidence?'stretch':revisit?'guided':profile.level==='experienced'||strong>=2?'stretch':'guided';
  const minutes=profile.minutes==='flexible'?next.minutes:Number(profile.minutes)||15;
  const sessionMinutes=Math.min(minutes,next.minutes);
  const goalPhrase:Record<string,string>={job:'find your first role',switch:'switch careers',upskill:'get better at your work',team:'build your team’s skills',freelance:'start freelancing',business:'grow your business',build:'make a project',explore:'explore something new'};
  const experience:Record<string,string>={beginner:'are starting fresh',practising:'have some practice',experienced:'have some experience'};
  const fit='You want to '+(goalPhrase[profile.goal]||goals[profile.goal]||'build a skill')+' in '+(programmeNames[profile.track]||profile.track)+', '+(experience[profile.level]||experience.beginner)+', and '+(profile.minutes==='flexible'?'chose a flexible pace.':'chose '+profile.minutes+' minutes.');
  const skillNames:Record<string,string>={message:'Your message works',audience:'Your audience choice works',testing:'Your test evidence works',privacy:'Your privacy decision works'};
  const strength=Object.entries(skills).find(([key,s])=>s.demonstrated&&key!==(weak?skillKey(weak.item):''));
  const lead=strength&&skillNames[strength[0]]?skillNames[strength[0]]+'; ':'';
  const reason=transferred?'You demonstrated this skill in a later task; apply it here instead of repeating the drill.':passed?'Your focused practice passed; apply this fix to your creation before the whole-mission review.':focus?(weak?(lead?lead+'practise ':'Practise ')+weak.item+' because '+(repeated>1?'it needed attention in '+repeated+' evaluated attempts.':weak.note.split(/[.!?]\s/)[0].replace(/[.!?]$/,'')+'.'):'Your evaluated work met every criterion; try a harder constraint instead of repeating the same example.'):revisit?'Revisit this creation because its saved review still has an unmet criterion.':completed.size===0?'Start with one useful creation that matches your chosen programme.':pool.every(m=>completed.has(m.id))?'Your course is complete; optionally improve a creation with a new constraint.':'Continue from your saved work with the next challenge in this programme.';
  if(remediation)remediation.reason=reason;

  const practiceLevel=skillReview?.review.profileLevel&&skillReview.review.profileLevel!==profile.level?profile.level:skillReview?.mission_id===next.id?skillReview.review.learningLevel||profile.level:strongEvidence?'experienced':repeated>1?'beginner':profile.level;
  const localized=localizeMission(next,profile.language,practiceLevel);
  const {answer: _answer,explanation: _explanation,...challenge}=localized;
  const firstChallengeWhy='Start here: '+localized.title+'. '+(practiceLevel==='experienced'?'You will test a real constraint and explain the trade-off, rather than repeat the basics.':practiceLevel==='practising'?'You will apply what you know, compare a result and improve one decision.':'It starts with one guided decision, then a small practical trial.');
  const firstField=localized.practical?.fields[0];
  const firstAction=firstField?'First action: '+firstField.label+'. '+firstField.hint:'First action: '+localized.task.split(/[.!]\s/)[0]+'.';
  return {version:'1.2.0',curriculum:curriculumFor(profile.track),nextTask:{kind:remediation?'focused-practice':passed||transferred?'apply-fix':strongEvidence?'stretch':'mission',missionId:remediation?.missionId||next.id,skill:remediation?.skill||focus?.skill||next.skill,reason},firstChallengeWhy,firstAction,remediation,practicePassed:passed||null,profile,contentLanguage:lessonLanguage(profile.language),translationAvailable:lessonLanguage(profile.language)===profile.language,nextMissionId:next.id,practiceLevel,fit,skills,focus,lastFeedback:skillReview?.review||null,revisit:!!revisit,level,reason,sessionMinutes,estimatedMissionMinutes:next.minutes,
    sessionHint:minutes<next.minutes?'Use this session for the first part of this task. Keep your draft and return to finish the full practical trial.':'Create, check and improve one practical response.',
    challenge:{...challenge,outcome:outcomePrompt(profile.goal,profile.language),guidance:challengeInstruction(level,profile.language,!!next.practical)},
    steps:pool.map(m=>({id:m.id,title:localizeMission(m,profile.language).title,completed:completed.has(m.id)})),
    progress:{creations:completed.size,xp:completed.size*50,milestone:completed.size>=5?'Five creations':completed.size>=3?'Three creations':completed.size>=1?'First creation':'Your first creation awaits'},
    assessment:latest.length?'Suggestions use your stored AI-reviewed criteria; AI feedback is not a certified assessment.':'Suggestions use your choices and practice checks; no AI skill evidence yet.'};
}
