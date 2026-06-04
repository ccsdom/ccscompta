const CACHE_NAME = 'ccs-compta-v2';
const LEGACY_CACHES = ['ccs-compta-v1'];

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Keep HTML navigations network-first. Caching them can serve stale Next.js
  // pages that reference obsolete CSS/JS chunks after a rollout.
  event.respondWith(fetch(event.request));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME || LEGACY_CACHES.includes(cacheName))
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});
