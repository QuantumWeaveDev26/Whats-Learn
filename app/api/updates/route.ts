import {database} from '@/lib/storage';
import {cachedReleases,fetchRelease,releaseSources,releaseStatus,type Release} from '@/lib/official-releases';
export async function GET(){
 let cached:{payload:string;updated_at:string}|null=null;
 const reply=(items:Release[],updatedAt:string|null,failed=false)=>{
  const sources=releaseStatus(items),stale=failed||sources.some(s=>s.stale);
  return Response.json({items,updatedAt,stale,sources},{status:!items.length&&failed?503:200,headers:{'Cache-Control':stale?'no-store':'public, max-age=300'}});
 };
 try{
  const db=database();cached=await db.prepare('SELECT payload,updated_at FROM content_cache WHERE id=?').bind('official-releases').first();
  const previous=cachedReleases(cached?.payload);
  if(cached&&Date.now()-Date.parse(cached.updated_at)<21600000&&releaseStatus(previous).every(s=>!s.stale))return reply(previous,cached.updated_at);
  const now=new Date().toISOString();
  // Atomic lease prevents concurrent visitors from triggering duplicate upstream requests.
  const lock=await db.prepare('INSERT INTO content_cache (id,payload,updated_at) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET updated_at=excluded.updated_at WHERE content_cache.updated_at < ?').bind('refresh-lease','[]',now,new Date(Date.now()-60000).toISOString()).run();
  if(!lock.meta.changes)return reply(previous,cached?.updated_at||null,true);
  let successes=0;
  const results=await Promise.all(releaseSources.map(async s=>{try{const item=await fetchRelease(s,now);successes++;return item;}catch{return previous.find(x=>x.id===s.id)||null;}}));
  const items=results.filter((r):r is Release=>r!==null);
  // A fallback is not a successful upstream check. Preserve each source's actual check time.
  if(successes)await db.prepare('INSERT INTO content_cache (id,payload,updated_at) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at').bind('official-releases',JSON.stringify(items),now).run();
  return reply(items,successes?now:cached?.updated_at||null,successes!==releaseSources.length);
 }catch{return reply(cachedReleases(cached?.payload),cached?.updated_at||null,true);}
}
