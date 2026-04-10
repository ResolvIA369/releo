// REleo App Service Worker — Offline-first for educational content
// Bumping CACHE_NAME forces all clients to drop the old cache.

const CACHE_NAME = "releo-v3";

const SHELL_URLS = [
  "/dashboard",
  "/learn",
  "/play",
  "/profile",
  "/onboarding",
];

// Install: cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

// Activate: clean ALL old caches (any name that isn't the current one)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first with cache fallback (only for navigation)
// Critical: NEVER cache non-2xx responses, otherwise a transient
// 500 from the origin would stick forever.
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful, basic (same-origin) navigation responses
        if (response && response.ok && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline: serve from cache
        return caches.match(event.request).then((cached) => {
          return cached || caches.match("/dashboard");
        });
      })
  );
});
