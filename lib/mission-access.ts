import {missions,type Mission} from './missions';
export const FREE_MISSIONS_PER_COURSE=3;
export const membershipRequired='Explore includes missions 1–3 in each course. Choose an active paid plan to continue with missions 4–10. Your saved work stays yours.';
export function needsMembership(mission:Mission,paid=false){return !paid&&missions.filter(m=>m.track===mission.track).findIndex(m=>m.id===mission.id)>=FREE_MISSIONS_PER_COURSE}
