import {database} from '@/lib/storage';
type Release={id:string;title:string;url:string;publishedAt:string;track:string;source:string};
const sources=[{id:'react',repo:'facebook/react',source:'React',track:'development'},{id:'gutenberg',repo:'WordPress/gutenberg',source:'WordPress Gutenberg',track:'marketing'},{id:'diffusers',repo:'huggingface/diffusers',source:'Hugging Face Diffusers',track:'filmmaking'}];
export async function GET(){
 let cached:{payload:string;updated_at:string}|null=null;
 try{
  const db=database();cached=await db.prepare('SELECT payload,updated_at FROM content_cache WHERE id=?').bind('official-releases').first();
  if(cached&&Date.now()-Date.parse(cached.updated_at)<21600000)return Response.json({items:JSON.parse(cached.payload),updatedAt:cached.updated_at},{headers:{'Cache-Control':'public, max-age=300'}});
  const now=new Date().toISOString();
  // Atomic lease prevents concurrent visitors from triggering duplicate upstream requests.
  const lock=await db.prepare('INSERT INTO content_cache (id,payload,updated_at) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET updated_at=excluded.updated_at WHERE content_cache.updated_at < ?').bind('refresh-lease','[]',now,new Date(Date.now()-60000).toISOString()).run();
  if(!lock.meta.changes)return Response.json({items:cached?JSON.parse(cached.payload):[],updatedAt:cached?.updated_at||null},{headers:{'Cache-Control':'no-store'}});
  const previous:Release[]=cached?JSON.parse(cached.payload):[];
  const results=await Promise.all(sources.map(async s=>{try{
   const r=await fetch(`https://api.github.com/repos/${s.repo}/releases/latest`,{headers:{'Accept':'application/vnd.github+json','User-Agent':'WhatsLearn/1.0'},signal:AbortSignal.timeout(7000)});
   if(!r.ok)throw Error();const d:any=await r.json();
   if(d.draft||d.prerelease||typeof d.name!=='string'||d.name.length>180||typeof d.html_url!=='string'||!d.html_url.startsWith(`https://github.com/${s.repo}/releases/`)||!Number.isFinite(Date.parse(d.published_at)))throw Error();
   return {id:s.id,title:d.name,url:d.html_url,publishedAt:d.published_at,track:s.track,source:s.source};
  }catch{return previous.find(x=>x.id===s.id)||null}}));
  const items=results.filter(Boolean);
  if(items.length)await db.prepare('INSERT INTO content_cache (id,payload,updated_at) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at').bind('official-releases',JSON.stringify(items),now).run();
  return Response.json({items,updatedAt:items.length?now:cached?.updated_at||null},{headers:{'Cache-Control':items.length?'public, max-age=300':'no-store'}});
 }catch{return Response.json({items:cached?JSON.parse(cached.payload):[],updatedAt:cached?.updated_at||null},{status:cached?200:503,headers:{'Cache-Control':'no-store'}})}
}
