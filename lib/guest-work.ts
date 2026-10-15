import {missions} from './missions';
export type Work={mission_id:string;body:string;checks:string;quiz:number;updated_at:string};
const KEY='whatslearn-guest-work-v1';
export function readGuestWork():Work[]{try{const raw=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(raw))return [];const seen=new Set<string>();return raw.filter((w:Work)=>{const m=missions.find(m=>m.id===w.mission_id);if(!m||seen.has(w.mission_id)||typeof w.body!=='string'||w.body.length>9000||!Number.isFinite(Date.parse(w.updated_at)))return false;const c=JSON.parse(w.checks);if(!Array.isArray(c)||c.length!==5||c.some(v=>typeof v!=='boolean')||w.quiz!==m.answer)return false;seen.add(w.mission_id);return true})}catch{return []}}
export function saveGuestWork(work:Work){const next=[...readGuestWork().filter(w=>w.mission_id!==work.mission_id),work];localStorage.setItem(KEY,JSON.stringify(next));return next}
