// Fieldmark offline cache.
// Bump this whenever index.html or vendor files change, to force an update.
const CACHE = 'fieldmark-v1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './vendor/pdf.min.js',
  './vendor/pdf.worker.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // addAll fails hard if any single file 404s — cache what exists individually instead,
      // so a missing optional asset (e.g. icons before you've added them) doesn't break install.
      Promise.all(APP_SHELL.map((url) => cache.add(url).catch(() => {})))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((res) => {
          // Cache same-origin responses as we go, so anything not pre-cached
          // on install still works offline the next time it's opened.
          if (res.ok && new URL(event.request.url).origin === self.location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
