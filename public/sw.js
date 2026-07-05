self.addEventListener("install", (event) => {
  event.waitUntil(caches.open("termometro-shell-v1").then((cache) => cache.addAll(["/es"])));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
