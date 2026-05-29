const CACHE = 'assistant-v13';
const ASSETS = [
  './',
  './index.html',
  './gym-alison.html',
  './gym-darlene.html',
  './groceries.html',
  './schedule.html',
  './chores.html',
  './recipes.html',
  './fridge.html',
  './tracker.html',
  './styles.css',
  './gym.js',
  './gym-substitutes.js',
  './groceries.js',
  './schedule.js',
  './recipes.js',
  './fridge.js',
  './tracker.js',
  './chores.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
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
    caches.match(event.request).then((cached) =>
      cached ||
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy));
          return res;
        })
        .catch(() => cached)
    )
  );
});
