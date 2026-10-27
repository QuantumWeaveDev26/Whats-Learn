import {database} from './storage';
import {readContext} from './learner-context-store';
/** Never use an email address, control character or WhatsApp formatting as a name. */
export function cleanLearnerName(value:unknown){
 if(typeof value!=='string'||value.includes('@'))return '';
 return value.replace(/[\p{Cc}\p{Cf}]/gu,' ').replace(/[*_~`<>]/g,'').replace(/\s+/gu,' ').trim().slice(0,60);
}
/** An explicit Settings preference wins without editing the locked sign-up answers. */
export async function saveLearnerName(userId:string,value:string){
 const name=cleanLearnerName(value),db=database();
 await db.batch([
  db.prepare('UPDATE learner_profiles SET display_name=? WHERE user_id=?').bind(name,userId),
  db.prepare('INSERT INTO learning_sessions(user_id,session_key,payload,updated_at) VALUES (?,?,?,?) ON CONFLICT(user_id,session_key) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at').bind(userId,'preferred-address-name',JSON.stringify({name}),new Date().toISOString())
 ]);
 return name;
}
/** Settings preference, submitted nickname/name, website name, then verified link name. Never guess from email. */
export async function learnerName(userId:string){
 const db=database();const [personal,saved,contact,preferred]=await Promise.all([
  readContext(userId),
  db.prepare('SELECT display_name FROM learner_profiles WHERE user_id=?').bind(userId).first<{display_name:string|null}>(),
  db.prepare('SELECT display_name FROM whatsapp_contacts WHERE user_id=? AND verified_at IS NOT NULL').bind(userId).first<{display_name:string|null}>(),
  db.prepare('SELECT payload FROM learning_sessions WHERE user_id=? AND session_key=?').bind(userId,'preferred-address-name').first<{payload:string}>()
 ]);
 if(preferred){try{const p=JSON.parse(preferred.payload);if(p&&typeof p.name==='string')return cleanLearnerName(p.name);}catch{/* Ignore malformed preferences rather than inventing an identity. */}}
 return cleanLearnerName(personal?.answers.nickname)||cleanLearnerName(personal?.answers.name)||cleanLearnerName(saved?.display_name)||cleanLearnerName(contact?.display_name);
}
/** Ensure an occasional personal address without relying on a model following the prompt. */
export function addressLearner(text:string,name:string){
 const words=(value:string)=>' '+value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim()+' ';
 return name&&!words(text).includes(words(name))?`${name}, ${text}`:text;
}
