const CACHE_NAME = 'image-converter-v1';
const STATIC_CACHE_NAME = 'image-converter-static-v1';
const RUNTIME_CACHE_NAME = 'image-converter-runtime-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/logo.png',
  '/manifest.json',
  '/offline.html',
];

const CACHE_STRATEGIES = {
  NETWORK_FIRST: 'network-first',
  CACHE_FIRST: 'cache-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Skip waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Install failed', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');

  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== RUNTIME_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // Skip caching for external CDNs and chrome-extension requests
  if (url.hostname !== self.location.hostname &&
      (url.hostname === 'cdn.tailwindcss.com' ||
       url.hostname === 'aistudiocdn.com' ||
       url.protocol === 'chrome-extension:')) {
    return;
  }

  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(cacheFirst(request));
  } else if (url.pathname.endsWith('.png') || url.pathname.endsWith('.jpg') || url.pathname.endsWith('.jpeg') || url.pathname.endsWith('.gif') || url.pathname.endsWith('.webp') || url.pathname.endsWith('.svg')) {
    event.respondWith(cacheFirst(request));
  } else if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', error);
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }

    return new Response('Network error happened', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Both cache and network failed', error);
    return new Response('Resource not available', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => null);

  return cachedResponse || fetchPromise || new Response('Resource not available', {
    status: 404,
    headers: { 'Content-Type': 'text/plain' }
  });
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  console.log('Service Worker: Handling background sync');
}

self.addEventListener('push', (event) => {
  console.log('Service Worker: Push message received', event);

  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: 'image-converter-notification',
    renotify: true,
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/logo.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/logo.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Image Converter', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);

  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' })
        .then((clients) => {
          if (clients.length > 0) {
            return clients[0].focus();
          }
          return self.clients.openWindow('/');
        })
    );
  }
});
