const MODE_ATLAS_VERSION = '2.11.2';
const CACHE_NAME = 'mode-atlas-v' + MODE_ATLAS_VERSION;
const CORE_ASSETS = [
  './',
  './index.html',
  './kana.html',
  './default.html',
  './reverse.html',
  './test.html',
  './wordbank.html',
  './site.webmanifest',
  './assets/mode-atlas-icon.svg',
  './assets/favicon-32.png',
  './assets/apple-touch-icon.png',
  './assets/android-chrome-512.png',
  './assets/social-preview.svg',
  './assets/css/mode-atlas-page-shared.css',
  './assets/css/mode-atlas-qol.css',
  './assets/app/mode-atlas-storage.js',
  './assets/app/mode-atlas-qol.js',
  './assets/app/mode-atlas-app-runtime.js',
  './assets/app/mode-atlas-sounds.js'
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
      await Promise.all(keys.filter(k => k !== CACHE_NAME && /^mode-atlas-/i.test(k)).map(k => caches.delete(k)));
      await self.clients.claim();
    } catch (err) {}
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    try {
      const fresh = await fetch(event.request);
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, fresh.clone()).catch(()=>{});
      return fresh;
    } catch (err) {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      if (event.request.mode === 'navigate') {
        const fallback = await caches.match('./index.html');
        if (fallback) return fallback;
      }
      throw err;
    }
  })());
});
