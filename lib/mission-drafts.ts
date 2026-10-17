/** Unsaved writing stays on this device, separated by the authenticated learner. */
const KEY='whatslearn-mission-drafts-v1';
type Draft={body:string;updated_at:string};
function storageKey(scope:string){return scope==='guest'?KEY:KEY+':'+encodeURIComponent(scope)}
function readAll(scope:string):Record<string,Draft>{try{const raw=JSON.parse(localStorage.getItem(storageKey(scope))||'{}');return raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{}}catch{return {}}}
export function readMissionDraft(missionId:string,scope='guest'):string|null{const d=readAll(scope)[missionId];return d&&typeof d.body==='string'&&d.body.length<=9000?d.body:null}
export function saveMissionDraft(missionId:string,body:string,scope='guest'){try{const all=readAll(scope);if(body.trim())all[missionId]={body:body.slice(0,9000),updated_at:new Date().toISOString()};else delete all[missionId];localStorage.setItem(storageKey(scope),JSON.stringify(all))}catch{/* Keep the current editor intact when device storage is unavailable. */}}
export function clearMissionDraft(missionId:string,scope='guest'){saveMissionDraft(missionId,'',scope)}

export function guestMissionDrafts(){return Object.entries(readAll('guest')).filter(([key,d])=>/^[a-z]\d{1,2}(?:@(beginner|practising|experienced))?$/.test(key)&&typeof d?.body==='string'&&d.body.trim().length>0&&d.body.length<=9000).map(([key,d])=>({key,...d}));}
/** Explicit device-local recovery. Never overwrite an account draft or grant completion. */
export function importGuestMissionDrafts(scope:string){
 if(!scope.startsWith('account:')||scope.length<=8)throw new Error('Sign in before importing drafts.');
 const guest=readAll('guest'),owned=readAll(scope),keys:string[]=[],conflicts:string[]=[];
 for(const d of guestMissionDrafts()){if(owned[d.key]?.body&&owned[d.key].body!==d.body){conflicts.push(d.key);continue;}owned[d.key]={body:d.body,updated_at:d.updated_at};keys.push(d.key);}
 localStorage.setItem(storageKey(scope),JSON.stringify(owned));
 const confirmed=readAll(scope);for(const key of keys){if(confirmed[key]?.body!==guest[key].body)throw new Error('Draft import could not be confirmed. Guest copies are kept.');}
 for(const key of keys)delete guest[key];localStorage.setItem(storageKey('guest'),JSON.stringify(guest));
 return {keys,conflicts};
}
