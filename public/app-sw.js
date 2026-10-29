// Only /app navigations belong to this worker. Never store personalized HTML.
const PUBLIC_CACHE='wla-offline-v1',PUBLIC_GAME='/app-offline.html';
self.addEventListener('install',e=>{
 e.waitUntil(caches.open(PUBLIC_CACHE).then(cache=>cache.addAll([PUBLIC_GAME])).catch(()=>{}).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
 e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>/^wla-shell-v\d+$/.test(key)||(/^wla-offline-v\d+$/.test(key)&&key!==PUBLIC_CACHE)).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
const offline='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>WhatsLearn · Offline</title><style>body{margin:0;background:#F6F9F2;color:#202020;font:16px/1.6 Arial,sans-serif}main{max-width:28rem;margin:15vh auto;padding:24px}h1{font-size:24px}a{display:inline-block;padding:12px 22px;border-radius:24px;background:#087A4B;color:white;text-decoration:none}</style></head><body><main><h1>You’re offline</h1><p>Reconnect to open WhatsLearn and continue learning.</p><a href="/app">Try again</a></main></body></html>';
self.addEventListener('fetch',e=>{
 const r=e.request;if(r.method!=='GET')return;
 const url=new URL(r.url);
 if(url.origin!==self.location.origin)return;
 const publicGame=url.pathname===PUBLIC_GAME&&!url.search;
 if(!publicGame&&(r.mode!=='navigate'||(url.pathname!=='/app'&&!url.pathname.startsWith('/app/'))))return;
 const network=fetch(r);
 // Repair a failed precache on the next online visit, without holding up the app.
 // Both paths write only the exact public game, never the navigation response.
 e.waitUntil(network.then(async response=>{
  if(!response.ok)return;
  const cache=await caches.open(PUBLIC_CACHE);
  if(!publicGame&&await cache.match(PUBLIC_GAME))return;
  const page=publicGame?response.clone():await fetch(PUBLIC_GAME,{cache:'reload'});
  if(page.ok&&!page.redirected&&page.headers.get('Content-Type')?.includes('text/html'))await cache.put(PUBLIC_GAME,page);
 }).catch(()=>{}));
 e.respondWith(network.catch(async()=>{
  // Read only this named cache and exact public asset, never a cached account page.
  let page;try{page=await (await caches.open(PUBLIC_CACHE)).match(PUBLIC_GAME)}catch{}
  return new Response(page?await page.text():offline,{status:publicGame&&page?200:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
 }));
});
