import {qualityOwner} from '@/lib/quality/access';
import {alertStatus,dispatchAlerts,retryFailedAlerts} from '@/lib/quality/alerts';
import {sameOrigin} from '@/lib/storage';
const out=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});
export async function GET(){if(!await qualityOwner())return new Response('Not found',{status:404});try{return out(await alertStatus())}catch{return out({error:'Alert status unavailable.'},503)}}
export async function POST(request:Request){if(!sameOrigin(request))return out({error:'Invalid origin.'},403);if(!await qualityOwner())return new Response('Not found',{status:404});try{await retryFailedAlerts();return out({...await dispatchAlerts(),...await alertStatus()})}catch{return out({error:'Alerts could not be checked. Requests remain saved.'},503)}}
