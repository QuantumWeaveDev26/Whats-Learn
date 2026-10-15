import {queueNotice} from './whatsapp-jobs';
/** Called after the website saves a mission or clears a mini challenge. Never blocks or breaks the website: any failure here is swallowed. */
export async function noticeMission(userId:string,missionId:string,title:string,status:string,points?:number){try{await queueNotice(userId,'mission',missionId,{missionId,title,status,points})}catch{}}
export async function noticeBadge(userId:string,key:string,title:string){try{await queueNotice(userId,'badge',key,{title})}catch{}}
