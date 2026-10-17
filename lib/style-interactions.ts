import type {Mission} from './missions';
import {learningStyle,type LearningStyle} from './learning-styles';
import {questionForStyle} from './style-questions';
import {miniChallenge} from './play';
import {quizFeedback} from './quiz-feedback';
export type StyleState={style:LearningStyle;stage:'decision'|'checkpoint'|'explain'|'rule'|'apply'|'ready';pick?:number;feedback?:string};
export function initialStyleState(style:unknown):StyleState{const kind=learningStyle(style);return {style:kind,stage:kind==='casual'?'explain':kind==='facts'?'rule':'decision'};}
export function currentStyleState(style:unknown,state?:StyleState):StyleState{return state?.style===learningStyle(style)?state:initialStyleState(style);}
const wrongIndex=(m:Mission)=>(m.answer+1)%m.options.length;
export const ruleIsTrue=(m:Mission)=>Number(m.id.slice(1))%2===0;
export function storyConsequence(m:Mission,correct:boolean){
 if(m.id==='d1')return correct?'Possible ending: the parent can distinguish a confirmed booking from a failed attempt.':'Alternate ending: the parent expects a trial slot, but the tutor may have no saved booking. The parent has been misled.';
 const scenes:Record<string,[string,string]>={marketing:['Possible ending: the customer has a clearer, evidence-backed next step.','Alternate ending: the campaign reaches people, but its message or evidence may not support their next step.'],development:['Possible ending: the user can rely on the checked behaviour instead of an unchecked assumption.','Alternate ending: someone relies on the app, but the unchecked behaviour can give them a misleading or unsafe result.'],filmmaking:['Possible ending: a viewer has a clearer reason to follow the character and the scene.','Alternate ending: the viewer loses the intended connection between the character, the action and its result.'],storytelling:['Possible ending: the viewer can connect the message to its intended action.','Alternate ending: the viewer notices the images but misses the message or intended action.']};
 return (scenes[m.track]||scenes.development)[correct?0:1];
}

const letters=(options:string[])=>options.map((o,i)=>String.fromCharCode(65+i)+') '+o).join('\n');
export function interactionPrompt(m:Mission,s:StyleState,channel:'chat'|'web'='chat'):string{
 if(s.stage==='ready')return 'Decision checked. Make and test your own creation next; this is not mission completion.';
 if(s.style==='casual')return (channel==='chat'?'*Question 1*\n':'')+(s.feedback||questionForStyle(m,'casual'))+(channel==='chat'?'\nYour take? One sentence, in your own words. Need help? Send ASK plus your question.':'\nOne sentence, in your own words.');
 if(s.style==='game'){
  if(s.stage==='checkpoint'){const mini=miniChallenge(m.id);return '🎮 CHECKPOINT 2/2 · Transfer it\n'+mini.q+'\n'+letters(mini.options)+'\nPick A / B. No points yet.';}
  return '🎮 CHECKPOINT 1/2 · Make the call\n'+questionForStyle(m,'game')+'\n'+letters(m.options)+'\nPick one move.';
 }
 if(s.style==='facts')return s.stage==='rule'?'⚡ TRUE OR FALSE?\n'+m.options[ruleIsTrue(m)?m.answer:wrongIndex(m)]+(channel==='chat'?'\nReply TRUE / FALSE. Then apply the rule.':'\nChoose TRUE or FALSE. Then apply the rule.'):'⚡ APPLY THE RULE\n'+questionForStyle(m,'facts')+'\n'+letters(m.options)+'\nPick one answer.';
 if(s.stage==='explain')return '📖 NEXT SCENE · Your choice\nYou chose: '+m.options[m.answer]+'\n'+storyConsequence(m,true)+'\nWhy does your choice support this ending? One sentence in your own words.';
 return '📖 YOUR MOVE\n'+questionForStyle(m,'story')+'\n'+letters(m.options)+'\nPick what happens next.';
}
export type StyleTurn={state:StyleState;completed?:boolean;needsCheck?:boolean;reply:string};
function picked(text:string,count:number){const t=text.trim().toUpperCase().replace(/[).\s]/g,'');const n=/^[A-F]$/.test(t)?t.charCodeAt(0)-65:/^[1-6]$/.test(t)?Number(t)-1:-1;return n>=0&&n<count?n:-1;}
/** Pure teaching progression. No scoring, completion, provider calls or data writes. */
export function styleTurn(m:Mission,state:StyleState,text:string,language='en'):StyleTurn{
 const s={...state};
 if(s.stage==='ready')return {state:s,completed:true,reply:'Decision already checked.'};
 if(s.stage==='explain')return {state:s,needsCheck:true,reply:''};
 if(s.style==='facts'&&s.stage==='rule'){
  if(!/^(true|false|t|f|ಸರಿ|ತಪ್ಪು|nij[a]?|tappu|sari)$/i.test(text.trim()))return {state:s,reply:'Reply TRUE or FALSE for this statement.'};
  const saysTrue=/^(true|t|ಸರಿ|nij[a]?|sari)$/i.test(text.trim());
  if(saysTrue!==ruleIsTrue(m))return {state:s,reply:quizFeedback(language,false,m.skill,m.explanation).text+' TRUE / FALSE?'};
  s.stage='apply';return {state:s,reply:ruleIsTrue(m)?'True — the statement fits the rule. Now apply it.':'False — that statement misses the rule. Now apply it.'};
 }
 if(s.style==='game'&&s.stage==='checkpoint'){
  const mini=miniChallenge(m.id),pick=picked(text,mini.options.length);
  if(pick<0)return {state:s,reply:'Pick A or B for checkpoint 2.'};
  if(pick!==mini.answer)return {state:s,reply:'Checkpoint 2 stays open. '+mini.why};
  s.stage='ready';return {state:s,completed:true,reply:'Both checkpoints cleared ✅ Now build it. No mission points until your work passes review.'};
 }
 const pick=picked(text,m.options.length);if(pick<0)return {state:s,reply:'Pick one of the shown letters.'};
 if(pick!==m.answer){s.pick=pick;return {state:s,reply:s.style==='story'?storyConsequence(m,false)+' You chose “'+m.options[pick]+'”. '+m.explanation+' Rewind and choose again.':s.style==='game'?'Checkpoint 1 stays open. '+quizFeedback(language,false,m.skill,m.explanation).text:quizFeedback(language,false,m.skill,m.explanation).text};}
 s.pick=pick;
 if(s.style==='game'){s.stage='checkpoint';return {state:s,reply:'Checkpoint 1 cleared. One more move.'};}
 if(s.style==='story'){s.stage='explain';return {state:s,reply:'The story takes your chosen path. Explain the consequence next.'};}
 s.stage='ready';return {state:s,completed:true,reply:'Rule checked and applied. Now use it in your creation.'};
}
export function checkedStyleTurn(state:StyleState,result:{accepted:boolean;feedback:string;followUp:string}):StyleTurn{
 return result.accepted?{state:{...state,stage:'ready',feedback:result.feedback},completed:true,reply:result.feedback}:{state:{...state,feedback:result.followUp},reply:result.feedback+'\n'+result.followUp};
}
