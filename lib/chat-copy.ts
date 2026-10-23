/** An explicitly marked excerpt; full feedback remains on the learning page. */
export function briefFocus(text:string,maxWords=16){
 const words=text.trim().replace(/\s+/gu,' ').split(' ');
 return words.length>maxWords?words.slice(0,maxWords).join(' ')+'…':words.join(' ');
}

/** Openings that spend a short reply on generic praise instead of the learner's idea. */
export const genericMentorOpening=(text:string)=>/^(?:great job|good job|well done|awesome|amazing|love (?:your|the)|nice (?:work|job)|spot on)[!.,\s]/i.test(text.trim());
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
