import type {Mission} from './missions';
import {aiReady,reviewChatPart,FeedbackError} from './ai-feedback';
import {aiAllowance} from './ai-usage';
import {allow} from './auth/limits';
import {looksLikeGibberish} from './text-signals';
export async function checkStyleExplanation(userId:string,m:Mission,raw:string,language:string,style='casual'){
 const answer=raw.trim();if(answer.length<15||answer.length>1200||looksLikeGibberish(answer))throw new FeedbackError('Give one real sentence (15–1200 characters).',422);
 if(!aiReady())throw new FeedbackError('AI check is unavailable. Keep your answer and retry; nothing was assessed.',503);
 const {limit}=await aiAllowance(userId);
 if(!await allow('whatsapp-chat-check',userId,limit>3?40:20,86400,Date.now()+19800000))throw new FeedbackError('Today’s chat practice checks are used. Your answer is kept; return after midnight India time.',429);
 return reviewChatPart(m.id,{label:'Explain the correct understanding decision in your own words',type:'concept-explanation',hint:'Question: '+m.question+' Reference decision: '+m.options[m.answer]+' Why: '+m.explanation},answer,{},null,language,m.practiceLevel||'beginner',style);
}
