/** Unsaved challenge-editor writing, kept on this device until the learner saves the creation. */
const KEY='whatslearn-mission-drafts-v1';
type Draft={body:string;updated_at:string};
function readAll():Record<string,Draft>{try{const raw=JSON.parse(localStorage.getItem(KEY)||'{}');return raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{}}catch{return {}}}
export function readMissionDraft(missionId:string):string|null{const d=readAll()[missionId];return d&&typeof d.body==='string'&&d.body.length<=9000?d.body:null}
export function saveMissionDraft(missionId:string,body:string){try{const all=readAll();if(body.trim())all[missionId]={body:body.slice(0,9000),updated_at:new Date().toISOString()};else delete all[missionId];localStorage.setItem(KEY,JSON.stringify(all))}catch{/* storage unavailable: the draft stays in this visit only */}}
export function clearMissionDraft(missionId:string){saveMissionDraft(missionId,'')}
