import {qualityOwner} from '@/lib/quality/access';
import {listQualityItems,updateQualityItem,qualityUpdate,QualityError} from '@/lib/quality/store';
import {sameOrigin} from '@/lib/storage';
const out=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});
const failed=(e:unknown)=>e instanceof QualityError?out({error:e.message},e.status):e instanceof SyntaxError?out({error:'Invalid request.'},400):out({error:'Quality records could not load. Retry.'},503);
export async function GET(request:Request){const owner=await qualityOwner();if(!owner)return new Response('Not found',{status:404});try{return out(await listQualityItems(owner,Object.fromEntries(new URL(request.url).searchParams)))}catch(e){return failed(e)}}
export async function POST(request:Request){if(!sameOrigin(request))return out({error:'Invalid request origin.'},403);const owner=await qualityOwner();if(!owner)return new Response('Not found',{status:404});try{const raw=await request.text();if(raw.length>4000)return out({error:'Request too large.'},413);const p=qualityUpdate.safeParse(JSON.parse(raw));if(!p.success)return out({error:'Choose a status and add a short resolution when resolving.'},400);return out(await updateQualityItem(owner,p.data))}catch(e){return failed(e)}}
