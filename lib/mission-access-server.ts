import {hasPaidAccess} from './billing/service';
import {missions} from './missions';
import {needsMembership} from './mission-access';
/** Rechecked on every protected operation. A client flag or old checkout preference grants nothing. */
export async function canUseMission(userId:string,missionId:string){const m=missions.find(m=>m.id===missionId);return !!m&&(!needsMembership(m)||await hasPaidAccess(userId))}
