/** An explicitly marked excerpt; full feedback remains on the learning page. */
export function briefFocus(text:string,maxWords=16){
 const words=text.trim().replace(/\s+/gu,' ').split(' ');
 return words.length>maxWords?words.slice(0,maxWords).join(' ')+'…':words.join(' ');
}

/** Openings that spend a short reply on generic praise instead of the learner's idea. */
export const genericMentorOpening=(text:string)=>/^(?:great job|good job|well done|awesome|amazing|love (?:your|the)|nice (?:work|job)|spot on)[!.,\s]/i.test(text.trim());
/** Simple English greetings need no model, task introduction or assessment credit. */
export function mentorGreeting(question:string,language:string,context:unknown){
 if(language!=='English'||!/^\s*(?:hi+|hello+|hey+|helo|good\s+(?:morning|afternoon|evening))[\s!.,?]*$/i.test(question))return null;
 const c=context&&typeof context==='object'?context as {name?:unknown;recentConversation?:unknown}:{};
 if(c.recentConversation)return 'What’s on your mind?';
 const name=typeof c.name==='string'&&!c.name.includes('@')?c.name.replace(/[\p{Cc}\p{Cf}*_~`<>]/gu,' ').replace(/\s+/gu,' ').trim().slice(0,60):'';
 return name?`Hey ${name}! What’s on your mind?`:'Hey! What’s on your mind?';
}
/** Remove repeated English salutations without cutting the useful explanation. */
export function directMentorOpening(text:string,language:string,context:unknown){
 if(language!=='English')return text;
 const c=context&&typeof context==='object'?context as {name?:unknown}:{};
 const name=typeof c.name==='string'?c.name.trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&'):'';
 const prefix=name?new RegExp(`^(?:(?:hi|hey|hello|sure)[, ]+${name}[!,:.]+\\s*|(?:hi|hey|hello)[!,:.]+\\s*|${name}[,:]+\\s*)`,'i'):/^(?:hi|hey|hello)[!,:.]+\s*/i;
 return text.trim().replace(prefix,'').trim()||text;
}
/** Ordinary tutoring is not a graded review. Reject claims about work the mentor has not assessed. */
export const unrequestedMentorAssessment=(text:string)=>/\b(?:your|the)\s+(?:draft|answer|submission|work|fix|code|response)\s+(?:(?:looks?|sounds?)\s+(?:good|great|strong|correct|complete|clear|ready)|(?:is|was|has been)\s+(?:correct|complete|approved|perfect|excellent)|(?:correctly|successfully)\s+(?:ensures?|shows?|handles?|fixes?)|(?:explains?|describes?|addresses?|handles?)\b[^.!?\n]{0,100}\b(?:well|correctly|clearly))\b/i.test(text);
/** An outage in optional shortening should not hide an otherwise useful answer. Never cut code or a sentence. */
export function completeMentorExcerpt(text:string,maxWords:number){
 if(text.includes('```'))return null;
 const sentences=text.match(/[\s\S]*?[.!?।॥。！？]+(?=\s|$)/gu)||[];
 let result='';
 for(const sentence of sentences){const next=(result+(result?'\n':'')+sentence.trim()).trim();if(next.split(/\s+/u).length>maxWords)break;result=next;}
 result=result.replace(/(?:^|\n)\s*\d+[.)]\s*$/u,'').trim();
 return result.split(/\s+/u).length>=4?result:null;
}
export const mentorTone='Sound like a sharp, friendly peer in India. Lead with the answer or one concrete detail from the learner. One useful point and at most one next action. No greeting, corporate intro, generic praise, fake hype, forced slang, or repeated instructions. Use 1–2 short lines and at most one emoji when it adds meaning. Keep Kannada and Kanglish natural; keep technical words in English where clearer, never translate English slang literally. Never confuse playful tone with accepting a wrong answer.';
