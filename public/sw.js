// ─────────────────────────────────────────────────────────────────────────────
// MoneyLeft service worker
// Provides offline support and PWA installability.
// ─────────────────────────────────────────────────────────────────────────────

// Bump this version any time you change this file or want to invalidate caches.
const CACHE_VERSION = "moneyleft-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Files to cache when the service worker installs (app shell).
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-icon.png",
  "/offline.html",
];

// ─── Install: cache the app shell ────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      // Use addAll but tolerate individual failures (e.g. offline.html missing)
      Promise.all(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((err) => console.warn(`SW: failed to cache ${url}`, err))
        )
      )
    )
  );
  self.skipWaiting();
});

// ─── Activate: clean up old caches ───────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch: serve from cache, falling back to network ────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Don't cache anything that isn't from our origin (Supabase, Anthropic, etc.)
  if (url.origin !== self.location.origin) return;

  // NEVER cache auth-related routes or API calls — always fresh from network
  if (url.pathname.startsWith("/api/") ||
      url.pathname.startsWith("/auth/") ||
      url.pathname === "/login" ||
      url.pathname === "/signup" ||
      url.pathname === "/reset-password" ||
      url.pathname === "/forgot-password") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/offline.html").then((m) => m || new Response("Offline", { status: 503 }))
      )
    );
    return;
  }

  // Strategy: stale-while-revalidate for navigation, cache-first for everything else
  if (request.mode === "navigate") {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function networkFirstWithFallback(request) {
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offline = await caches.match("/offline.html");
    if (offline) return offline;
    return new Response("You are offline.", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    // Refresh in background
    fetch(request).then((fresh) => {
      if (fresh && fresh.ok) {
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, fresh.clone()));
      }
    }).catch(() => {});
    return cached;
  }
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

// ─── Listen for skip-waiting messages from the page ─────────────────────────
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") self.skipWaiting();
});
