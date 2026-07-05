const SHELL_CACHE = "termometro-shell-v1";
const DASHBOARD_CACHE = "termometro-dashboard-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(["/es", "/en"])));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const isDashboard = /^\/(?:es|en)\/explorar/.test(url.pathname);

  if (!isDashboard) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(async (response) => {
        if (response.ok) {
          const cache = await caches.open(DASHBOARD_CACHE);
          await cache.put(event.request, response.clone());
        }
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});
