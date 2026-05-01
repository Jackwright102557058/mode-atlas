const CACHE_NAME = 'mode-atlas-v2.10.17';
const CORE_ASSETS = [
  './',
  './index.html',
  './kana.html',
  './default.html',
  './reverse.html',
  './test.html',
  './wordbank.html',
  './cloud-sync.js',
  './firebase-config.js',
  './site.webmanifest',
  './assets/mode-atlas-qol.css',
  './assets/mode-atlas-qol.js',
  './assets/mode-atlas-qol-batch.js',
  './assets/mode-atlas-stable-controls.js',
  './assets/mode-atlas-auth-single-button.js',
  './assets/mode-atlas-about.js',
  './assets/mode-atlas-achievements-mastery.js'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(CORE_ASSETS);
    } catch (err) {
      // Network-first app: cache failures should never block installation.
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k !== CACHE_NAME && /^mode-atlas-/.test(k)).map(k => caches.delete(k)));
      await self.clients.claim();
    } catch (err) {}
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith((async () => {
    try {
      const fresh = await fetch(event.request);
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, fresh.clone()).catch(()=>{});
      return fresh;
    } catch (err) {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      throw err;
    }
  })());
});
