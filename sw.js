const CACHE = "workout-tracker-v4";
const BASE  = self.location.pathname.replace(/\/sw\.js$/, "");

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll([BASE + "/", BASE + "/index.html"]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;

  // Navigation requests → network first so index.html always reflects latest deploy
  if (e.request.mode === "navigate") {
    const indexUrl = BASE + "/index.html";
    e.respondWith(
      fetch(indexUrl)
        .then(res => {
          caches.open(CACHE).then(c => c.put(indexUrl, res.clone()));
          return res;
        })
        .catch(() => caches.match(indexUrl))
    );
    return;
  }

  // Cache-first for static assets; populate cache on first network hit
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok && new URL(e.request.url).origin === self.location.origin) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      });
    })
  );
});
