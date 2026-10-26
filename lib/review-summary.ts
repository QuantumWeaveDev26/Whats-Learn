import type {Review} from './ai-feedback';
/** Only correct, on-topic practical evidence can establish a demonstrated skill. */
export function supportedPracticalReview(r:Review){return !r.blockingIssue?.trim()&&r.answerAssessment?.onTopic===true&&r.answerAssessment.correct===true&&r.practicalTest?.created===true&&r.practicalTest.performed===true&&r.practicalTest.reported===true}
export function reviewAccepted(r:Review){return supportedPracticalReview(r)&&r.checks.filter(c=>c.met).length>=3}
const sameText=(a:string,b:string)=>a.toLocaleLowerCase().replace(/[\p{P}\p{S}\s]+/gu,'')===b.toLocaleLowerCase().replace(/[\p{P}\p{S}\s]+/gu,'');
/** Safe display fallback for old reviews whose next step repeats the verdict. No new assessment. */
function actionCopy(r:Review){
 const text=[r.answerAssessment?.reason,r.nextStep,...r.checks.map(c=>c.note)].join(' ');
 const kn=/[\u0c80-\u0cff]/u.test(text),kang=/\b(nanu|nanna|beku|illa|andre|maadi|maadide|torisbeku|enu)\b/i.test(text);
 if(r.answerAssessment?.onTopic===false)return kn?'ಈ ಕೆಲಸಕ್ಕೆ ಹೊಂದುವಂತೆ ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಒಂದು ನಿಜವಾದ ಉದಾಹರಣೆಯೊಂದಿಗೆ ಮತ್ತೆ ಬರೆಯಿರಿ.':kang?'Ee task-ge sarihonduva ondu real example kottu answer matte bareyiri.':'Rewrite your answer for this task using one concrete example.';
 if(r.practicalTest?.reported===false)return kn?'ನೀವು ಮಾಡಿದ ಕೆಲಸ, ಒಂದು ನಿಜವಾದ ಪರೀಕ್ಷೆಯ ಫಲಿತಾಂಶ ಮತ್ತು ಮಾಡಿದ ಬದಲಾವಣೆಯನ್ನು ಸೇರಿಸಿ.':kang?'Nimma actual work, ondu test result mattu maadida change serisi.':'Add your actual work, one test result and the change you made.';
 return kn?'ಆ ಭಾಗವನ್ನು ಸರಿಪಡಿಸಿ, ಒಮ್ಮೆ ಪರೀಕ್ಷಿಸಿ, ಬದಲಾದ ಕೆಲಸವನ್ನು ಸಲ್ಲಿಸಿ.':kang?'Aa part fix maadi, once test maadi, changed work submit maadi.':'Fix that part, test it once, and submit the changed work.';
}
export function feedbackSummary(r:Review){
 const worked=r.answerAssessment?.onTopic&&r.answerAssessment.correct?r.strengths[0]||r.checks.find(c=>c.met)?.note||'No demonstrated strength yet.':'';
 const improve=r.blockingIssue||(r.answerAssessment?.correct===false?r.answerAssessment.reason:r.checks.find(c=>!c.met)?.note)||(r.practicalTest?.reported===false?r.practicalTest.note:'No required correction in this review.');
 const next=r.nextStep.trim()&&!sameText(r.nextStep,improve)?r.nextStep:actionCopy(r);
 return {worked,improve,next};
}

/** Stable skill families support continuity when criteria are translated or worded differently. */
export function skillKey(item:string){const t=item.toLowerCase();if(/audience|customer|ಗ್ರಾಹಕ|ಪ್ರೇಕ್ಷಕ|ग्राहक|दर्शक/.test(t))return 'audience';if(/test|result|measure|experiment|ಪರೀಕ್ಷ|ಫಲಿತ|परीक्षण|परिणाम/.test(t))return 'testing';if(/privacy|consent|permission|ಖಾಸಗಿ|ಅನುಮತಿ|गोपनीय|अनुमति/.test(t))return 'privacy';if(/offer|promise|hook|headline|ಕೊಡುಗೆ|ವಾಗ್ದಾನ|वादा|प्रस्ताव/.test(t))return 'message';return t.trim()}

export function shortFeedback(text:string,maxWords=24){const words=text.trim().split(/\s+/u);return words.length>maxWords?words.slice(0,maxWords).join(" ")+"…":text;}
