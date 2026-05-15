const CACHE = 'gharayesi-v5';
const STATIC_ASSETS = ['/Test/', '/Test/index.html', '/Test/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC_ASSETS)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Never cache these — always live from network
  const alwaysLive = [
    'site-config.json',
    'firebasedatabase.app',
    'chatbot.js',
    'admin.html'
  ];
  if(alwaysLive.some(k => url.href.includes(k))){
    e.respondWith(
      fetch(e.request.url, { cache: 'no-store' })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Network first for everything else
  e.respondWith(
    fetch(e.request).then(res => {
      if(res.ok){
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});

self.addEventListener('message', e => {
  if(e.data === 'skipWaiting') self.skipWaiting();
});