const CACHE_NAME = 'ocean-pinball-v16';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './bundle.dfb0b7fbaaaa.js'
];

// Install: cache all assets
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(ASSETS.map(asset => cache.add(asset)));
  })());
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch:
// - navigation: network-first + cache update (so installed PWA actually refreshes after deploy)
// - others: stale-while-revalidate for same-origin GET
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // App shell (HTML): always try network first.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        await cache.put('./index.html', res.clone());
        return res;
      } catch (e) {
        const cached = await caches.match('./index.html');
        return cached || Response.error();
      }
    })());
    return;
  }

  // Assets: serve cache immediately, update in background.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    const fetched = fetch(req)
      .then(async res => {
        if (res && res.ok) await cache.put(req, res.clone());
        return res;
      })
      .catch(() => cached);
    return cached || fetched;
  })());
});
