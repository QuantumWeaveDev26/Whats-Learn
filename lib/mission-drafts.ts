/** Unsaved writing stays on this device, separated by the authenticated learner. */
const KEY='whatslearn-mission-drafts-v1';
type Draft={body:string;updated_at:string};
function storageKey(scope:string){return scope==='guest'?KEY:KEY+':'+encodeURIComponent(scope)}
function readAll(scope:string):Record<string,Draft>{try{const raw=JSON.parse(localStorage.getItem(storageKey(scope))||'{}');return raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{}}catch{return {}}}
export function readMissionDraft(missionId:string,scope='guest'):string|null{const d=readAll(scope)[missionId];return d&&typeof d.body==='string'&&d.body.length<=9000?d.body:null}
export function saveMissionDraft(missionId:string,body:string,scope='guest'){try{const all=readAll(scope);if(body.trim())all[missionId]={body:body.slice(0,9000),updated_at:new Date().toISOString()};else delete all[missionId];localStorage.setItem(storageKey(scope),JSON.stringify(all))}catch{/* Keep the current editor intact when device storage is unavailable. */}}
export function clearMissionDraft(missionId:string,scope='guest'){saveMissionDraft(missionId,'',scope)}
