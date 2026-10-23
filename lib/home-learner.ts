import {courseProgress} from './learner-entry';
import {programmes} from './programmes';

export type HomeLearner={status:'loading'|'guest'|'unavailable'}|{status:'account';courseId:string|null;hasStarted:boolean;progress?:Record<string,{saved:number;total:number}>};
export type HomeAccountSnapshot={accountKey?:string;hasStarted?:boolean;profile?:{track?:string}|null};
export type HomeWorkSnapshot={accountKey?:string;work:{mission_id:string;quiz:number}[]};
/** Account responses, never device preferences, determine the returning homepage. */
export function accountHomeState(account:HomeAccountSnapshot,work?:HomeWorkSnapshot):HomeLearner{
 if(!account.accountKey)return {status:'unavailable'};
 const courseId=programmes.find(p=>p.id===account.profile?.track)?.id||null;
 const progress=work?.accountKey===account.accountKey?Object.fromEntries(programmes.map(p=>{const {saved,total}=courseProgress(p.id,work.work);return [p.id,{saved,total}]})):undefined;
 return {status:'account',courseId,hasStarted:account.hasStarted===true,...(progress?{progress}:{})};
}
export function homePrimaryAction(learner:HomeLearner){
 if(learner.status!=='account'||!learner.courseId)return {label:'Try my first challenge',href:'#start'};
 const progress=learner.progress?.[learner.courseId];
 if(progress&&progress.total>0&&progress.saved===progress.total)return {label:'View My Creations',href:'/learn?view=portfolio'};
 return {label:learner.hasStarted||(progress?.saved||0)>0?'Continue Learning':'Start my first task',href:'/learn'};
}
