// The build replaces these markers with the version and every local build asset.
const VERSION = "__BUILD_VERSION__";
const CACHE_PREFIX = "yijing-offline-";
const CACHE_NAME = CACHE_PREFIX + VERSION;
const PRECACHE_ASSETS = ["__PRECACHE_ASSETS__"];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    if (VERSION === "__BUILD_VERSION__") throw new Error("Build the app before enabling offline mode.");
    const cache = await caches.open(CACHE_NAME);
    try {
      // A worker cannot activate with a partially downloaded app.
      await cache.addAll(PRECACHE_ASSETS.map(url => new Request(url, { cache: "reload" })));
    } catch (error) {
      await caches.delete(CACHE_NAME);
      throw error;
    }
  })());
  // Updates wait until the user chooses to reload or closes all app windows.
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key =>
      (key.startsWith(CACHE_PREFIX) || key.startsWith("yijing-practice-")) && key !== CACHE_NAME
    ).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") {
    event.waitUntil(self.skipWaiting());
  }
  if (event.data?.type === "OFFLINE_STATUS") {
    event.waitUntil((async () => {
      const cache = await caches.open(CACHE_NAME);
      const entries = await Promise.all(PRECACHE_ASSETS.map(url => cache.match(url)));
      event.ports[0]?.postMessage({ ready: entries.every(Boolean), version: VERSION });
    })());
  }
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin ||
      url.pathname.startsWith("/api/") || url.pathname === "/sw.js") return;
  const asset = url.pathname === "/" ? "/index.html" : url.pathname;
  if (!PRECACHE_ASSETS.includes(asset)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    // HTML and its hashed JS/CSS always come from the same complete build.
    const cached = await cache.match(asset);
    if (cached) return cached;
    try {
      return await fetch(event.request);
    } catch {
      return new Response("Offline files are unavailable. Reconnect and reopen Yijing.", {
        status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }
  })());
});
