import {applicationCard} from './application-bank';
import {missionForLevel} from './mission-levels';
import {storyOutcomes} from './story-outcomes';
import type {Mission} from './missions';
import {learningStyle,type LearningStyle} from './learning-styles';
import {questionForStyle} from './style-questions';
import {miniChallenge} from './play';
import {quizFeedback} from './quiz-feedback';
export type StyleState={style:LearningStyle;stage:'decision'|'branch'|'impact'|'checkpoint'|'explain'|'rule'|'apply'|'ready';pick?:number;branch?:number;impact?:number;setbacks?:number;variant?:number;feedback?:string};
export function initialStyleState(style:unknown):StyleState{const kind=learningStyle(style);return {style:kind,stage:kind==='casual'?'explain':kind==='facts'?'rule':'decision'};}
export function currentStyleState(style:unknown,state?:StyleState):StyleState{return state?.style===learningStyle(style)?state:initialStyleState(style);}
const wrongIndex=(m:Mission)=>(m.answer+1)%m.options.length;
export const ruleIsTrue=(m:Mission,variant=0)=>([...m.question].reduce((n,c)=>((n*31)^c.charCodeAt(0))>>>0,7)+variant)%2===0;
export function factsStatement(m:Mission,variant=0){const scene=variant%2===0?m:missionForLevel(m,m.practiceLevel==='experienced'?'beginner':'experienced');const card=applicationCard(scene,variant);return {truth:ruleIsTrue(m,variant),text:variant>0?card.q+'\nClaim: '+card.options[ruleIsTrue(m,variant)?card.answer:(card.answer+1+(variant%2))%card.options.length]:scene.options[ruleIsTrue(m,variant)?scene.answer:wrongIndex(scene)]};}
export function applicationForState(m:Mission,s:StyleState){return (s.variant||0)>0?applicationCard(m,s.variant):{q:m.question,options:m.options,answer:m.answer,why:m.explanation};}
export const storyBranchAnswer=(m:Mission)=>Number(m.id.replace(/\D/g,''))%2;
export function storyConsequence(m:Mission,correct:boolean,pick?:number){const outcome=storyOutcomes[m.id];if(!outcome)return 'Consider how this choice changes the user’s next action.';return correct?'Possible ending: '+outcome[0]:'Alternate ending: '+outcome[1]+(pick===undefined?'':' Your move: “'+m.options[pick]+'”.');}

export function storyBranchOptions(m:Mission){const row=storyBranches[m.id];const pair=row?[...row]:['Check '+m.checks[0].toLowerCase()+' using the current work','Hand off the work after a visual check only'];return storyBranchAnswer(m)?pair.reverse():pair;}
const storyBranches:Record<string,[string,string]>={
 m1:['Qualify the delivery area before counting an enquiry','Count every reply as qualified interest'],m2:['Ask for the missing approved fact before publishing','Keep the plausible claim and add a disclaimer'],m3:['Cancel the queued follow-up when STOP arrives','Send the queued message because it was already scheduled'],m4:['Ask about the last real attempt and workaround','Ask whether the person likes the proposed idea'],m5:['Compare one changed variable under similar conditions','Choose the version with more clicks from different audiences'],m6:['Open the link on a phone and complete the enquiry','Approve the campaign because the post looks right'],m7:['Compare spend divided by qualified enquiries','Compare spend divided by all enquiries'],m8:['Time one real post and revise the schedule','Keep the daily schedule and catch up later'],m9:['Make consent optional and show how to stop messages','Keep preselected consent to reduce friction'],m10:['Check the complete customer path before handoff','Handoff the presentation and fix the journey later'],
 d1:['Force a failed save and check that success stays hidden','Only test a successful booking'],d2:['Try another user’s booking with a valid signed-in session','Trust the user ID sent in the browser request'],d3:['Verify that linked records refer to an existing customer','Copy customer details into each new booking'],d4:['Specify failure status and response shape as well as success','Document the happy-path body and leave errors to the frontend'],d5:['Send an order directly when stock is zero','Disable the browser button and consider stock enforced'],d6:['Reproduce the failure with the same inputs before editing','Change several likely causes at once'],d7:['Attempt a read as the wrong signed-in owner','Check only that some user is signed in'],d8:['Assert the stored result after the action','Pass the test if no exception is printed'],d9:['Review the diff and run relevant tests before merging','Merge the branch once it compiles'],d10:['Exercise failure and retry before release','Share the prototype after its homepage opens'],
 f1:['Show the character choosing at a visible cost','Explain the character’s feelings in a title card'],f2:['Check the cut for consistent action and screen direction','Choose the prettiest shot regardless of the previous action'],f3:['Test the live reaction against the generated shot','Choose the method solely because it is newer'],f4:['Give the actor an intention beneath the spoken line','Ask the actor to sound more emotional'],f5:['Direct an action the actor can play on another character','Ask for a stronger feeling without an objective'],f6:['Visit at the planned hour and record light and sound','Approve the location from one attractive photograph'],f7:['Listen to room tone across the actual cut','Put music over the gap without checking dialogue'],f8:['Test when the viewer learns the critical information','Shorten every shot equally'],f9:['Group setups while protecting the light-dependent shot','Shoot in script order regardless of location moves'],f10:['Disclose the generated material and check permission','Describe the entire film as live footage'],
 v1:['Show the sequence without explanation and ask what changes','Add a caption explaining disconnected pictures'],v2:['Keep one character reference across frames and inspect exports','Generate each frame independently and accept the best-looking'],v3:['Ask a first-year what the invitation asks them to do','Judge the line only by how clever it sounds'],v4:['Check which message a viewer notices first at phone size','Make every text block equally prominent'],v5:['Check contrast in greyscale at final print size','Check only the bright colour preview'],v6:['Compare the labelled values using an appropriate baseline','Crop the axis until the difference looks dramatic'],v7:['Remove a repeated slide and retest the story flow','Add another slide to explain the repeated point'],v8:['Resolve the unapproved logo and inspect the new export','Assume generated images are automatically cleared'],v9:['Narrow the promise to what the evidence supports','Keep the promise and hide the weak evidence'],v10:['Align the final invitation with the opening audience','Keep both audiences and add an extra ending']
};
const letters=(options:string[])=>options.map((o,i)=>String.fromCharCode(65+i)+') '+o).join('\n');
export function interactionPrompt(m:Mission,s:StyleState,channel:'chat'|'web'='chat'):string{
 if(s.stage==='ready')return 'Decision checked. Make and test your own creation next; this is not mission completion.';
 if(s.style==='casual')return (channel==='chat'?'*Question 1*\n':'')+(s.feedback||questionForStyle(m,'casual'))+(channel==='chat'?'\nYour take? One sentence, in your own words. Need help? Send ASK plus your question.':'\nOne sentence, in your own words.');
 if(s.style==='game'){
  if(s.stage==='checkpoint'){const mini=applicationCard(m,s.variant);return '🎮 CHECKPOINT 2/2 · Transfer it\n'+mini.q+'\n'+letters(mini.options)+'\nPick A / B / C. No points yet.';}
  return '🎮 CHECKPOINT 1/2 · Make the call\n'+questionForStyle(m,'game')+'\n'+letters(m.options)+'\nPick one move.';
 }
 if(s.style==='facts')return s.stage==='rule'?'⚡ TRUE OR FALSE?\n'+factsStatement(m,s.variant).text+(channel==='chat'?'\nReply TRUE / FALSE. Then apply the rule.':'\nChoose TRUE or FALSE. Then apply the rule.'):'⚡ APPLY THE RULE\n'+applicationForState(m,s).q+'\n'+letters(applicationForState(m,s).options)+'\nPick one answer.';
 if(s.stage==='branch')return '📖 SCENE 2 · '+(s.pick===m.answer?'Your first move helped. Before the handoff, one risk remains.':'Your first move hit a snag. You can recover before the handoff.')+'\n'+storyConsequence(m,s.pick===m.answer,s.pick)+'\nWhat do you do now?\n'+letters(storyBranchOptions(m))+'\nChoose A / B.';
 if(s.stage==='impact'){const card=applicationCard(m,s.variant);return '📖 SCENE 3 · Pressure test\n'+(s.pick===m.answer?'Your plan held up. A new constraint lands.':'You recovered. Now prove the fix survives a new constraint.')+'\n'+card.q+'\n'+letters(card.options)+'\nChoose A / B / C.';}
 if(s.stage==='explain')return '📖 NEXT SCENE · Your choice\nYour first choice: '+m.options[s.pick??m.answer]+'\nYour next move: '+storyBranchOptions(m)[s.branch??storyBranchAnswer(m)]+(s.impact===undefined?'':'\nPressure-test decision: '+applicationCard(m,s.variant).options[s.impact])+'\n'+storyConsequence(m,true)+'\nWhy does your choice support this ending? One sentence in your own words.';
 return '📖 YOUR MOVE\n'+questionForStyle(m,'story')+'\n'+letters(m.options)+'\nPick what happens next.';
}
export type StyleTurn={state:StyleState;completed?:boolean;needsCheck?:boolean;reply:string};
function picked(text:string,count:number){const t=text.trim().toUpperCase().replace(/[).\s]/g,'');const n=/^[A-F]$/.test(t)?t.charCodeAt(0)-65:/^[1-6]$/.test(t)?Number(t)-1:-1;return n>=0&&n<count?n:-1;}
/** Pure teaching progression. No scoring, completion, provider calls or data writes. */
export function styleTurn(m:Mission,state:StyleState,text:string,language='en'):StyleTurn{
 const s={...state};
 if(s.stage==='ready')return {state:s,completed:true,reply:'Decision already checked.'};
 if(s.stage==='explain')return {state:s,needsCheck:true,reply:''};
 if(s.style==='story'&&s.stage==='impact'){const card=applicationCard(m,s.variant),n=picked(text,card.options.length);if(n<0)return {state:s,reply:'Choose A, B or C.'};s.impact=n;if(n!==card.answer){s.setbacks=(s.setbacks||0)+1;return {state:s,reply:'That leaves the risk open. '+card.why+' Try another move.'};}s.stage='explain';return {state:s,reply:'Pressure test cleared. '+card.why+' Explain the link to your ending.'};}
 if(s.style==='story'&&s.stage==='branch'){const n=picked(text,2);if(n<0)return {state:s,reply:'Choose A or B for this scene.'};s.branch=n;if(n!==storyBranchAnswer(m))return {state:s,reply:storyConsequence(m,false)+' This risk is still open. Choose the move that checks the failure before handoff.'};s.stage='impact';return {state:s,reply:(s.pick===m.answer?'You protected the first decision.':'You recovered from the first decision.')+' One pressure test before your ending.'};}
 if(s.style==='facts'&&s.stage==='rule'){
  if(!/^(true|false|t|f|ಸರಿ|ತಪ್ಪು|nij[a]?|tappu|sari)$/i.test(text.trim()))return {state:s,reply:'Reply TRUE or FALSE for this statement.'};
  const saysTrue=/^(true|t|ಸರಿ|nij[a]?|sari)$/i.test(text.trim());
  if(saysTrue!==ruleIsTrue(m,s.variant))return {state:s,reply:quizFeedback(language,false,m.skill,m.explanation).text+' TRUE / FALSE?'};
  s.stage='apply';return {state:s,reply:ruleIsTrue(m,s.variant)?'True — the statement fits the rule. Now apply it.':'False — that statement misses the rule. Now apply it.'};
 }
 if(s.style==='game'&&s.stage==='checkpoint'){
  const mini=applicationCard(m,s.variant),pick=picked(text,mini.options.length);
  if(pick<0)return {state:s,reply:'Pick A, B or C for checkpoint 2.'};
  if(pick!==mini.answer)return {state:s,reply:'Checkpoint 2 stays open. '+mini.why};
  s.stage='ready';return {state:s,completed:true,reply:'Both checkpoints cleared ✅ Now build it. No mission points until your work passes review.'};
 }
 if(s.style==='facts'&&s.stage==='apply'&&(s.variant||0)>0){const card=applicationForState(m,s),n=picked(text,card.options.length);if(n<0)return {state:s,reply:'Pick one of the shown letters.'};if(n!==card.answer)return {state:s,reply:'Not yet. '+card.why};s.stage='ready';return {state:s,completed:true,reply:'Applied to a fresh situation. '+card.why};}
 const pick=picked(text,m.options.length);if(pick<0)return {state:s,reply:'Pick one of the shown letters.'};
 if(pick!==m.answer){s.pick=pick;if(s.style==='story'){s.stage='branch';return {state:s,reply:storyConsequence(m,false,pick)+' Your next scene gives you a chance to recover.'};}return {state:s,reply:s.style==='game'?'Checkpoint 1 stays open. '+quizFeedback(language,false,m.skill,m.explanation).text:quizFeedback(language,false,m.skill,m.explanation).text};}
 s.pick=pick;
 if(s.style==='game'){s.stage='checkpoint';return {state:s,reply:'Checkpoint 1 cleared. One more move.'};}
 if(s.style==='story'){s.stage='branch';return {state:s,reply:'The story takes your chosen path. One handoff decision remains.'};}
 s.stage='ready';return {state:s,completed:true,reply:'Rule checked and applied. Now use it in your creation.'};
}
export function checkedStyleTurn(state:StyleState,result:{accepted:boolean;feedback:string;followUp:string}):StyleTurn{
 return result.accepted?{state:{...state,stage:'ready',feedback:result.feedback},completed:true,reply:result.feedback}:{state:{...state,feedback:result.followUp},reply:result.feedback+'\n'+result.followUp};
}
