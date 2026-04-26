const CACHE_NAME = 'ccs-compta-v1';
const urlsToCache = [
  '/',
  '/login',
  '/dashboard/scan',
  '/dashboard/my-documents'
];

// Installation : Mise en cache des ressources vitales
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[PWA] Fichiers en cache pre-load');
        // Ignore cache errors in dev if some paths don't return 200 immediately
        return cache.addAll(urlsToCache).catch(err => console.error("Cache.addAll warning:", err));
      })
  );
});

// Interception des requêtes réseau
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit : on retourne la ressource
        if (response) {
          return response;
        }

        // On fetch sinon
        return fetch(event.request).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Optionnel : on pourrait cloner la rep et la cacher.
            return response;
          }
        ).catch(() => {
            // Offline Mode Fallback
            if (event.request.mode === 'navigate') {
                return caches.match('/dashboard/scan'); // Rediriger sur le scanner
            }
        });
      })
  );
});

self.addEventListener('activate', event => {
    // Nettoyer les vieux caches
    const cacheAllowlist = [CACHE_NAME];
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheAllowlist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
});
