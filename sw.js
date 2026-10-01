const CACHE_NAME = "iron-rise-v2-cache-1";
const CORE_ASSETS = [
  "./",
  "index.html",
  "style.css",
  "game.js",
  "manifest.json",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/characters/stage-01.png",
  "assets/characters/stage-02.png",
  "assets/characters/stage-03.png",
  "assets/characters/stage-04.png",
  "assets/characters/stage-05.png",
  "assets/characters/stage-06.png",
  "assets/characters/stage-07.png",
  "assets/characters/stage-08.png",
  "assets/characters/stage-09.png",
  "assets/characters/stage-10.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first strategy: instant offline loads, falls back to network for
// anything not pre-cached, and updates the cache opportunistically.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
