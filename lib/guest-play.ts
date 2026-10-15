import {validPlayEvent,type PlayEvent} from './play';
const KEY='whatslearn-guest-play-v1';
export function readGuestPlay():PlayEvent[]{try{const value=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(value)?value.filter(validPlayEvent):[]}catch{return []}}
export function saveGuestPlay(event:PlayEvent){const old=readGuestPlay();if(old.some(e=>e.event_id===event.event_id))return old;const next=[...old,event];localStorage.setItem(KEY,JSON.stringify(next));return next;}
