const CACHE_NAME = "discipline-cache-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/logo.jpg",
  "/manifest.json"
];

// Install Event
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Stale-while-revalidate for local requests)
self.addEventListener("fetch", (e) => {
  // Only cache GET requests and from same origin (or CDN/fonts)
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch new version in the background to update the cache
        fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, networkResponse);
            });
          }
        }).catch(() => {/* Ignore network errors during background fetch */});
        return cachedResponse;
      }

      return fetch(e.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
          return networkResponse;
        }

        // Cache new static requests on the fly
        if (isSameOrigin) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }

        return networkResponse;
      }).catch(() => {
        // Offline Fallback for html pages
        if (e.request.mode === "navigate") {
          return caches.match("/");
        }
      });
    })
  );
});

// Notification Click Event (PWA Focus)
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow("/");
      }
    })
  );
});

