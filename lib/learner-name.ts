import {database} from './storage';
import {readContext} from './learner-context-store';
/** Never use an email address, control character or WhatsApp formatting as a name. */
export function cleanLearnerName(value:unknown){
 if(typeof value!=='string'||value.includes('@'))return '';
 return value.replace(/[\p{Cc}\p{Cf}]/gu,' ').replace(/[*_~`<>]/g,'').replace(/\s+/gu,' ').trim().slice(0,60);
}
/** Submitted nickname wins, then submitted name, website name and verified account-link name. Never guess from email. */
export async function learnerName(userId:string){
 const db=database();const [personal,saved,contact]=await Promise.all([
  readContext(userId),
  db.prepare('SELECT display_name FROM learner_profiles WHERE user_id=?').bind(userId).first<{display_name:string|null}>(),
  db.prepare('SELECT display_name FROM whatsapp_contacts WHERE user_id=? AND verified_at IS NOT NULL').bind(userId).first<{display_name:string|null}>()
 ]);
 return cleanLearnerName(personal?.answers.nickname)||cleanLearnerName(personal?.answers.name)||cleanLearnerName(saved?.display_name)||cleanLearnerName(contact?.display_name);
}
/** Ensure an occasional personal address without relying on a model following the prompt. */
export function addressLearner(text:string,name:string){
 const words=(value:string)=>' '+value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim()+' ';
 return name&&!words(text).includes(words(name))?`${name}, ${text}`:text;
}
