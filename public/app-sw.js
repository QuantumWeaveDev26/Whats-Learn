// WhatsLearn app service worker (scope /app). Network first so accounts, progress and AI review are always live;
// only the app shell page is kept for a friendly offline message.
const SHELL='wla-shell-v1';
self.addEventListener('install',e=>{e.waitUntil(caches.open(SHELL).then(c=>c.addAll(['/app'])).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==SHELL).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||r.mode!=='navigate')return;
  e.respondWith(fetch(r).catch(()=>caches.match('/app').then(m=>m||new Response('<h1>You are offline</h1><p>Reconnect to keep learning.</p>',{headers:{'Content-Type':'text/html'}}))));
});
