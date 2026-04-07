// Service Worker BRAVO3 - Cache mínimo para PWA
const CACHE_NAME = 'bravo3-v1';
const ESSENTIAL = ['./index.html', './manifest.json'];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ESSENTIAL).catch(function() {});
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  // Solo cachear el HTML principal y manifest. Todo lo demás (API, fuentes, etc) va a red.
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.pathname.endsWith('index.html') || url.pathname.endsWith('/') || url.pathname.endsWith('manifest.json')) {
    e.respondWith(
      fetch(e.request).then(function(resp) {
        // Guardar en cache la versión más reciente
        const respClone = resp.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, respClone).catch(function() {}); });
        return resp;
      }).catch(function() {
        // Si no hay red, servir desde cache
        return caches.match(e.request);
      })
    );
  }
});
