const CACHE_VERSION = 'v5';
const CACHE_NAME = `uran-local-${CACHE_VERSION}`;

// 🔥 Cache ALL important files
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './ads.json'
];

/* ===== INSTALL ===== */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

/* ===== ACTIVATE ===== */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

/* ===== FETCH ===== */
self.addEventListener('fetch', event => {

  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {

      // ✅ Return cache first
      if (cached) return cached;

      // 🌐 Fetch from network
      return fetch(event.request).then(response => {

        // Cache only same-origin
        if (event.request.url.startsWith(self.location.origin)) {
          const clone = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }

        return response;
      });

    }).catch(() => {
      // 🔥 Offline fallback
      return caches.match('./index.html');
    })
  );
});

/* ===== UPDATE CONTROL ===== */
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
