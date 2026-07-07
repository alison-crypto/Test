const CACHE = 'assistant-v40';
const ASSETS = [
  './',
  './index.html',
  './auth.html',
  './reset.html',
  './diet-alison.html',
  './hyrox.html',
  './gym-alison.html',
  './gym-darlene.html',
  './groceries.html',
  './schedule.html',
  './chores.html',
  './recipes.html',
  './fridge.html',
  './tracker.html',
  './plan.html',
  './plan-source.html',
  './plan.js',
  './diet-alison.js',
  './styles.css',
  './gym.js',
  './gym-extras.js',
  './gym-substitutes.js',
  './gym-rpg.js',
  './hyrox.js',
  './groceries.js',
  './groceries-plan.js',
  './schedule.js',
  './recipes.js',
  './fridge.js',
  './tracker.js',
  './chores.js',
  './auth.js',
  './reset.js',
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

// App code (HTML/JS/CSS + navigations) is served NETWORK-FIRST so a fresh
// deploy shows up immediately when online — falling back to cache only when
// offline. Everything else (icons, images, fonts, cross-origin assets) stays
// cache-first for speed. This stops the PWA from pinning a stale app shell.
function isAppShell(url, request) {
  if (request.mode === 'navigate') return true;
  if (url.origin !== self.location.origin) return false;
  return /\.(?:html|js|css)$/.test(url.pathname) || url.pathname === '/' || url.pathname.endsWith('/');
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Supabase API/auth/storage must always hit the network — never cache responses
  // (stale auth tokens or stale data would break sync).
  if (url.hostname.endsWith('.supabase.co')) return;

  if (isAppShell(url, event.request)) {
    // Network-first: fetch fresh, update the cache, fall back to cache offline.
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static assets.
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
