// Minimal Service Worker for Loop Community
const CACHE_NAME = 'loop-community-v1';

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => 
        Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch - cache assets for faster loading
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  if (request.method !== 'GET') return;
  
  // Cache static assets
  if (request.url.includes('/assets/')) {
    event.respondWith(
      caches.match(request)
        .then(response => response || fetch(request)
          .then(fetchResponse => {
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, fetchResponse.clone()));
            return fetchResponse;
          })
        )
    );
  }
});