// SoulScroll Service Worker with Advanced Cache Control
self.addEventListener('install', (event) => {
  console.log('SoulScroll Service Worker installing...');
  event.waitUntil(
    caches.open('soulscroll-static-v1.0.0').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/icon-192.png',
        '/manifest.json',
        '/styles.css'
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('SoulScroll Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== 'soulscroll-static-v1.0.0') {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Network request with cache fallback
        return fetch(event.request).then((response) => {
          // Don't cache API responses or non-GET requests
          if (!response || response.status !== 200 || response.type !== 'basic' || event.request.method !== 'GET') {
            return response;
          }
          
          // Cache static assets
          if (event.request.url.includes('.js') || event.request.url.includes('.css') || event.request.url.includes('.png')) {
            const responseToCache = response.clone();
            caches.open('soulscroll-static-v1.0.0')
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }
          
          return response;
        });
      })
  );
});
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then(cache => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      }),
      caches.open(DYNAMIC_CACHE_NAME) // Just open the dynamic cache
    ])
  );
  
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
  console.log('SoulScroll Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }

  // Handle static files and navigation
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests with cache-first strategy for specific routes
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  
  // Cache-first strategy for specific API routes
  if (API_CACHE_ROUTES.some(route => url.pathname.startsWith(route))) {
    try {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        // Return cached response and update in background
        fetchAndCache(request, cache);
        return cachedResponse;
      }
      
      // No cache, fetch and cache
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
      
    } catch (error) {
      console.log('API request failed:', error);
      return new Response(JSON.stringify({ error: 'Offline' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 503
      });
    }
  }
  
  // Network-first for other API requests
  try {
    return await fetch(request);
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Network unavailable' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 503
    });
  }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  try {
    // Check static cache first
    const staticCache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await staticCache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Check dynamic cache
    const dynamicCache = await caches.open(DYNAMIC_CACHE_NAME);
    const dynamicCachedResponse = await dynamicCache.match(request);
    
    if (dynamicCachedResponse) {
      return dynamicCachedResponse;
    }
    
    // Fetch from network
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const responseClone = response.clone();
      dynamicCache.put(request, responseClone);
    }
    
    return response;
    
  } catch (error) {
    console.log('Static request failed:', error);
    
    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/') || new Response('Offline', { status: 503 });
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Background fetch and cache
async function fetchAndCache(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
  } catch (error) {
    console.log('Background fetch failed:', error);
  }
}

// Handle background sync
self.addEventListener('sync', event => {
  if (event.tag === 'journal-sync') {
    event.waitUntil(syncJournalEntries());
  }
});

// Sync offline journal entries
async function syncJournalEntries() {
  try {
    // This would sync any offline journal entries
    // Implementation depends on how offline data is stored
    console.log('Syncing offline journal entries...');
  } catch (error) {
    console.log('Sync failed:', error);
  }
}

// Handle push notifications
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      {
        action: 'open',
        title: 'Open SoulScroll'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'SoulScroll', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});