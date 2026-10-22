import {missions} from './missions';
/** Account work is server-accepted; ignore other courses and invalid legacy decisions. */
export function courseProgress(track:string,work:{mission_id:string;quiz:number}[]){
 const course=missions.filter(m=>m.track===track);
 const saved=new Set(work.filter(w=>course.some(m=>m.id===w.mission_id&&m.answer===Number(w.quiz))).map(w=>w.mission_id)).size;
 return {saved,total:course.length,label:`${saved} saved mission${saved===1?'':'s'}`};
}
export function mentorQuestionExample(track:string){return track==='development'?'How can I test this feature safely?':track==='filmmaking'?'How can I show this emotion in one shot?':track==='storytelling'?'How can I connect these images into a story?':'How can I make this offer more specific?';}
