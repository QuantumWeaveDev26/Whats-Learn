/** An explicitly marked excerpt; full feedback remains on the learning page. */
export function briefFocus(text:string,maxWords=16){
 const words=text.trim().replace(/\s+/gu,' ').split(' ');
 return words.length>maxWords?words.slice(0,maxWords).join(' ')+'…':words.join(' ');
}
