// Only /app navigations belong to this worker. Never store personalized HTML.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>{
 e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>/^wla-shell-v\d+$/.test(key)).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
const offline='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>WhatsLearn · Offline</title><style>body{margin:0;background:#F6F9F2;color:#202020;font:16px/1.6 Arial,sans-serif}main{max-width:28rem;margin:15vh auto;padding:24px}h1{font-size:24px}a{display:inline-block;padding:12px 22px;border-radius:24px;background:#087A4B;color:white;text-decoration:none}</style></head><body><main><h1>You’re offline</h1><p>Reconnect to open WhatsLearn and continue learning.</p><a href="/app">Try again</a></main></body></html>';
self.addEventListener('fetch',e=>{
 const r=e.request;if(r.method!=='GET'||r.mode!=='navigate')return;
 const url=new URL(r.url);
 if(url.origin!==self.location.origin||(url.pathname!=='/app'&&!url.pathname.startsWith('/app/')))return;
 e.respondWith(fetch(r).catch(()=>new Response(offline,{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}})));
});
