const CACHE_NAME = 'ocean-pinball-v2';
const ASSETS = [
  './',
  './pinball_web.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install: cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
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

// Fetch: cache-first, fallback to network, navigation always returns main page
self.addEventListener('fetch', event => {
  // For navigation requests (opening the app), always serve the main HTML
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./pinball_web.html')
        .then(cached => cached || fetch('./pinball_web.html'))
        .catch(() => caches.match('./pinball_web.html'))
    );
    return;
  }
  // For other requests: cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});
