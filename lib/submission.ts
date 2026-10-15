import type {Mission} from './missions';
import {checkWriting} from './writing-check';
import {checkAnswerShape,parseAnswer,scoringText,LIMITS} from './practical';
export const MAX_BODY=LIMITS.total;
export const retryNote='A wrong answer never costs points and never locks anything. You can answer again as often as you like.';
/** The learner's own typed words from an answer (structured parts: short and long text plus reasoning; choices and code are left out). */
export const answerText=(mission:Mission,body:string)=>mission.practical?scoringText(mission.practical,body).text:body;
/** English text for a wrong understanding answer on the server. The website shows the same thing in the learner's language (lib/quiz-feedback.ts). */
export function wrongAnswerMessage(mission:Mission){return `That answer is not correct. Concept to reconsider: ${mission.skill}. ${mission.explanation} ${retryNote}`}
/** Everything that must be true before work is saved, shared by the website, the guest store and the assistant tool. Returns an error message or null. */
export function precheck(mission:Mission,d:{body:string;checks:boolean[];quiz:number}):string|null{
 if(d.quiz!==mission.answer)return wrongAnswerMessage(mission);
 if(d.body.length>MAX_BODY)return 'Your answer is too long.';
 const shape=checkAnswerShape(mission.practical,parseAnswer(mission.practical,d.body));
 if(!shape.ok)return shape.errors.join(' ')+' Your work has not been saved.';
 const w=checkWriting(mission,answerText(mission,d.body),d.checks);
 if(w.blocked)return w.tip+' Your work has not been saved.';
 return null;
}
