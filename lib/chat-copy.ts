/** An explicitly marked excerpt; full feedback remains on the learning page. */
export function briefFocus(text:string,maxWords=16){
 const words=text.trim().replace(/\s+/gu,' ').split(' ');
 return words.length>maxWords?words.slice(0,maxWords).join(' ')+'…':words.join(' ');
}

/** Openings that spend a short reply on generic praise instead of the learner's idea. */
export const genericMentorOpening=(text:string)=>/^(?:great job|good job|well done|awesome|amazing|love (?:your|the)|nice (?:work|job)|spot on)[!.,\s]/i.test(text.trim());
export const mentorTone='Sound like a sharp, friendly peer in India. Lead with the answer or one concrete detail from the learner. One useful point and at most one next action. No greeting, corporate intro, generic praise, fake hype, forced slang, or repeated instructions. Use 1–2 short lines and at most one emoji when it adds meaning. Keep Kannada and Kanglish natural; keep technical words in English where clearer, never translate English slang literally. Never confuse playful tone with accepting a wrong answer.';
