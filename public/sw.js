const CACHE_NAME = 'image-converter-cache-v3';
const APP_SHELL_URLS = [
    '/',
    '/index.html',
];

// Install: Caches the app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching app shell');
                return cache.addAll(APP_SHELL_URLS);
            })
            .then(() => self.skipWaiting())
    );
});

// Listen for skipWaiting message
self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});

// Activate: Cleans up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: Serves assets from cache or network
self.addEventListener('fetch', (event) => {
    // For navigation requests, always use network first and force cache update
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request, { cache: 'reload' })
                .then(response => {
                    // If the fetch is successful, clone it and update cache
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // If the network fails, serve the main page from the cache
                    return caches.match('/');
                })
        );
        return;
    }

    // For all other requests (assets), use a cache-first strategy
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // If we have a response in the cache, return it
                if (cachedResponse) {
                    return cachedResponse;
                }
                // Otherwise, fetch from the network
                return fetch(event.request).then((networkResponse) => {
                    // And cache the new response
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    return networkResponse;
                });
            })
    );
});
