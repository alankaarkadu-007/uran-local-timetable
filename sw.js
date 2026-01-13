const CACHE_VERSION = 'v3';
const CACHE_NAME = `uran-local-${CACHE_VERSION}`;

const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

/* ===== INSTALL ===== */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

/* ===== ACTIVATE ===== */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME)
            .map(k => caches.delete(k))
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
      return cached || fetch(event.request).then(response => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    }).catch(() => caches.match('./index.html'))
  );
});

/* ===== UPDATE FROM UI ===== */
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* ===== NOTIFICATION (future ready) ===== */
self.addEventListener('push', event => {
  const data = event.data ? event.data.text() : '🚆 Uran Local Train Reminder';

  event.waitUntil(
    self.registration.showNotification('Uran Local Train', {
      body: data,
      icon: 'icons/icon-192.png',
      badge: 'icons/icon-192.png'
    })
  );
});
