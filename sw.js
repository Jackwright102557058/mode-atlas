try { importScripts('./assets/app/mode-atlas-version.js'); } catch (e) {}
const MODE_ATLAS_VERSION = self.ModeAtlasVersion || self.MODE_ATLAS_VERSION || 'dev-local';
const CACHE_NAME = 'mode-atlas-' + MODE_ATLAS_VERSION;

const CORE_ASSETS = [
  './',
  './assets/android-chrome-512.png',
  './assets/app/mode-atlas-early-loader.js',
  './assets/app/mode-atlas-presets.js',
  './assets/app/mode-atlas-head-bootstrap.js',
  './assets/app/mode-atlas-toast.js',
  './assets/app/mode-atlas-theme.js',
  './assets/app/mode-atlas-save-repair.js',
  './assets/app/mode-atlas-page-state.js',
  './assets/app/mode-atlas-dev-console.js',
  './assets/app/mode-atlas-pwa.js',
  './assets/app/mode-atlas-about.js',
  './assets/app/mode-atlas-kana-metrics.js',
  './assets/pages/mode-atlas-kana-dashboard.js',
  './assets/results/mode-atlas-results-insights.js',
  './assets/app/mode-atlas-confusable-mode.js',
  './assets/app/mode-atlas-sounds.js',
  './assets/app/mode-atlas-stable-controls.js',
  './assets/app/mode-atlas-storage.js',
  './assets/apple-touch-icon.png',
  './assets/css/mode-atlas-default-page.css',
  './assets/css/mode-atlas-home-page.css',
  './assets/css/mode-atlas-kana-page.css',
  './assets/css/mode-atlas-page-shared.css',
  './assets/css/mode-atlas-app-polish.css',
  './assets/css/mode-atlas-responsive.css',
  './assets/css/mode-atlas-kana-dashboard.css',
  './assets/css/mode-atlas-results-insights.css',
  './assets/css/mode-atlas-achievements.css',
  './assets/css/mode-atlas-theme.css',
  './assets/css/mode-atlas-reverse-input-control-fix.css',
  './assets/css/mode-atlas-reverse-page.css',
  './assets/css/mode-atlas-study-shared.css',
  './assets/css/mode-atlas-test-page.css',
  './assets/css/mode-atlas-wordbank-page.css',
  './assets/data/mode-atlas-kana-data.js',
  './assets/favicon-32.png',
  './assets/mode-atlas-icon.svg',
  './assets/pages/mode-atlas-default-page.js',
  './assets/pages/mode-atlas-home-page.js',
  './assets/pages/mode-atlas-kana-dashboard-fallback.js',
  './assets/pages/mode-atlas-kana-page.js',
  './assets/pages/mode-atlas-reverse-page.js',
  './assets/pages/mode-atlas-test-page.js',
  './assets/pages/mode-atlas-wordbank-page.js',
  './assets/results/mode-atlas-results-engine.js',
  './assets/results/mode-atlas-results-storage.js',
  './assets/results/mode-atlas-results-ui.js',
  './assets/social-preview.svg',
  './assets/trainer/mode-atlas-modifier-direct-click-repair.js',
  './assets/trainer/mode-atlas-modifier-keep-open.js',
  './assets/trainer/mode-atlas-reverse-input-control-fix.js',
  './assets/trainer/mode-atlas-session-controls.js',
  './assets/trainer/mode-atlas-trainer-core.js',
  './assets/trainer/mode-atlas-trainer-shared.js',
  './assets/ui/mode-atlas-profile-menu.js',
  './assets/ui/mode-atlas-settings-menu.js',
  './assets/ui/mode-atlas-profile-drawer-bindings.js',
  './assets/ui/mode-atlas-study-cloud-bindings.js',
  './assets/ui/mode-atlas-study-nav-hidden.js',
  './assets/ui/mode-atlas-v2.16.1-preset-menu-clean',
  './cloud-sync.js',
  './reading/',
  './default.html',
  './firebase-config.js',
  './index.html',
  './kana/',
  './kana.html',
  './writing/',
  './reverse.html',
  './site.webmanifest',
  './results/',
  './test.html',
  './wordbank.html',
  './privacy/',
  './privacy/index.html',
  './terms/',
  './terms/index.html'
];

// Files that should always bypass the service worker.
// This lets Google and browsers fetch the real files directly.
function shouldBypassServiceWorker(url) {
  return (
    url.pathname === '/sitemap.xml' ||
    url.pathname === '/robots.txt' ||
    url.pathname === '/CNAME' ||
    url.pathname.startsWith('/.well-known/')
  );
}

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

      await Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && /^mode-atlas-/i.test(k))
          .map(k => caches.delete(k))
      );

      await self.clients.claim();
    } catch (err) {}
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  // Do not intercept sitemap, robots, GitHub Pages domain files,
  // or certificate/verification files.
  if (shouldBypassServiceWorker(url)) return;

  event.respondWith((async () => {
    try {
      const fresh = await fetch(event.request);
      const cache = await caches.open(CACHE_NAME);

      cache.put(event.request, fresh.clone()).catch(() => {});

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