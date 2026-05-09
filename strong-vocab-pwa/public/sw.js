const CACHE = "strong-vocab-v1";
const ASSETS = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", e =>
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)))
);

self.addEventListener("fetch", e => {
  if (e.request.url.includes("/api/")) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request)));
});
