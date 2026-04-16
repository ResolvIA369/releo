// REleo App Service Worker — Offline-first for educational content
//
// Update strategy: CONTROLLED BY THE USER.
// A new SW installs silently in the background but does NOT call
// skipWaiting(). It sits in "waiting" state until the app sends
// a { type: "SKIP_WAITING" } message (triggered by the user
// tapping "Actualizar" in the UI banner). Only then does the new
// SW take over and the page reloads with the fresh code.

const CACHE_NAME = "releo-v4";

const SHELL_URLS = [
  "/dashboard",
  "/learn",
  "/play",
  "/profile",
  "/onboarding",
];

// ─── Install: cache app shell, but do NOT skipWaiting ────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
  );
  // Intentionally no self.skipWaiting() — the user controls activation.
});

// ─── Activate: clean old caches, claim clients ──────────────────
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

// ─── Message: user approved the update → skipWaiting ─────────────
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ─── Fetch: network-first with cache fallback (navigation only) ──
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.ok && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match("/dashboard");
        });
      })
  );
});
