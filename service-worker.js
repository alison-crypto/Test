const CACHE = 'assistant-v21';
const ASSETS = [
  './',
  './index.html',
  './auth.html',
  './gym-alison.html',
  './gym-darlene.html',
  './groceries.html',
  './schedule.html',
  './chores.html',
  './recipes.html',
  './fridge.html',
  './tracker.html',
  './plan.html',
  './styles.css',
  './gym.js',
  './gym-extras.js',
  './gym-substitutes.js',
  './groceries.js',
  './schedule.js',
  './recipes.js',
  './fridge.js',
  './tracker.js',
  './chores.js',
  './auth.js',
  './auth-gate.js',
  './sync.js',
  './supabase-client.js',
  './supabase-config.js',
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
  const url = new URL(event.request.url);
  // Supabase API/auth/storage must always hit the network — never cache responses
  // (stale auth tokens or stale data would break sync).
  if (url.hostname.endsWith('.supabase.co')) return;
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
