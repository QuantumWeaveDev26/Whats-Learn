export type Release={id:string;title:string;url:string;publishedAt:string;track:string;source:string;checkedAt?:string};
export const releaseSources=[{id:'react',repo:'facebook/react',source:'React',track:'development'},{id:'gutenberg',repo:'WordPress/gutenberg',source:'WordPress Gutenberg',track:'marketing'},{id:'diffusers',repo:'huggingface/diffusers',source:'Hugging Face Diffusers',track:'filmmaking'}];
export function cachedReleases(payload?:string|null):Release[]{
 try{const items=JSON.parse(payload||'[]');return Array.isArray(items)?items.filter((r:Release)=>r&&releaseSources.some(s=>s.id===r.id&&s.track===r.track&&s.source===r.source&&typeof r.url==='string'&&r.url.startsWith(`https://github.com/${s.repo}/releases/`))&&typeof r.title==='string'&&r.title.length<=180&&Number.isFinite(Date.parse(r.publishedAt))):[];}catch{return [];}
}
export function releaseStatus(items:Release[],at=Date.now()){
 return releaseSources.map(s=>{const r=items.find(r=>r.id===s.id),checked=r?.checkedAt&&Date.parse(r.checkedAt);return {id:s.id,checkedAt:checked&&Number.isFinite(checked)?r!.checkedAt:null,stale:!checked||!Number.isFinite(checked)||checked>at||at-checked>=21600000};});
}
export async function fetchRelease(s:typeof releaseSources[number],at:string):Promise<Release>{
 const response=await fetch(`https://api.github.com/repos/${s.repo}/releases/latest`,{headers:{'Accept':'application/vnd.github+json','User-Agent':'WhatsLearn/1.0'},signal:AbortSignal.timeout(7000)});
 if(!response.ok||!response.body)throw Error('Release unavailable');
 const reader=response.body.getReader(),chunks:Uint8Array[]=[];let bytes=0;
 try{for(;;){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.byteLength;if(bytes>262144)throw Error('Release too large');chunks.push(chunk.value);}}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
 const buffer=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.byteLength;}
 const d=JSON.parse(new TextDecoder().decode(buffer));
 if(d.draft||d.prerelease||typeof d.name!=='string'||!d.name.trim()||d.name.length>180||typeof d.html_url!=='string'||!d.html_url.startsWith(`https://github.com/${s.repo}/releases/`)||!Number.isFinite(Date.parse(d.published_at)))throw Error('Invalid release');
 return {id:s.id,title:d.name,url:d.html_url,publishedAt:d.published_at,track:s.track,source:s.source,checkedAt:at};
}
