const CACHE_VERSION = 'v7'; // 🔥 always increase
const CACHE_NAME = `uran-local-${CACHE_VERSION}`;

// Static files (rarely change)
const STATIC_FILES = [
  './',
  './index.html',
  './manifest.json'
];

/* ===== INSTALL ===== */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_FILES))
  );
  self.skipWaiting();
});

/* ===== ACTIVATE ===== */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => key !== CACHE_NAME && caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/* ===== FETCH ===== */
self.addEventListener('fetch', event => {

  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 🔥 1. HTML → Network First
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 🔥 2. ads.json → Network First
  if (url.pathname.includes('ads.json')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // ⚡ 3. timetable.json → Stale While Revalidate
  if (url.pathname.includes('timetable.json')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return res;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // ⚡ 4. Images → Stale While Revalidate
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return res;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 🧊 5. बाकी files → Cache First
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(res => {
        if (url.origin === self.location.origin) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return res;
      });
    })
  );
});

/* ===== UPDATE CONTROL ===== */
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
