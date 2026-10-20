import {createHash} from 'node:crypto';
/** Stable, opaque identity marker for the requesting account only. */
export function accountKey(userId:string){return createHash('sha256').update(userId).digest('hex').slice(0,24)}

export function matchesAccount(request:Request,userId:string){const expected=request.headers.get('x-whatslearn-account');return !expected||expected===accountKey(userId)}
