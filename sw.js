const CACHE = "us-emergency-v1-1";

const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-180.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  /*
   * For the actual emergency-contact page, always try the
   * live website first when connected. If offline, use the
   * cached copy.
   */
  if (
    request.mode === "navigate" ||
    request.destination === "document" ||
    request.url.endsWith("/index.html")
  ) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();

          caches.open(CACHE).then(cache => {
            cache.put("./index.html", copy);
          });

          return response;
        })
        .catch(() => caches.match("./index.html"))
    );

    return;
  }

  /*
   * Other app assets remain available offline.
   */
  event.respondWith(
    caches.match(request).then(
      cached => cached || fetch(request)
    )
  );
});
