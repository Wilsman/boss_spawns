// Cache-first for immutable tarkov.dev map assets: tiles, SVG backgrounds,
// and boss portraits all live on assets.tarkov.dev.
const CACHE = "map-assets-v2";
const HOST = "assets.tarkov.dev";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (new URL(request.url).hostname !== HOST) return;
  event.respondWith(
    caches.match(request).then((hit) => {
      // An opaque (no-cors) response cannot satisfy a CORS request such as
      // the SVG background fetch; only reuse it for no-cors requests.
      if (hit && (request.mode === "no-cors" || hit.type !== "opaque"))
        return hit;
      return fetch(request).then((response) => {
        if (response.ok || response.type === "opaque") {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
