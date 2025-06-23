// SoulScroll Service Worker - Progressive Web App functionality with auto-reload
const CACHE_NAME = 'soulscroll-v1.0.1';
const urlsToCache = [
  '/',
  '/src/main.tsx',
  '/src/index.css',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service worker received SKIP_WAITING message');
    self.skipWaiting();
  }
});

// Install - cache resources
self.addEventListener('install', (event) => {
  console.log('Service worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell resources');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Failed to cache resources:', error);
      })
  );
});

// Activate - clean old caches and take control
self.addEventListener('activate', (event) => {
  console.log('Service worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service worker taking control of all pages');
      return self.clients.claim();
    })
  );
});

// Enhanced fetch strategy with better error handling
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and external URLs
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            })
            .catch((error) => {
              console.log('Cache put failed:', error);
            });
        }
        return response;
      })
      .catch((error) => {
        console.log('Network fetch failed, trying cache:', error);
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return a meaningful offline response for API calls
          if (event.request.url.includes('/api/')) {
            return new Response(
              JSON.stringify({ 
                message: 'Offline mode - cached data not available',
                offline: true 
              }),
              { 
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }
          throw error;
        });
      })
  );
});

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    event.waitUntil(syncOfflineData());
  }
});

// Sync offline journal entries when connection restored
async function syncOfflineData() {
  try {
    // Check if we have offline journal entries to sync
    const offlineEntries = await getOfflineEntries();
    if (offlineEntries.length > 0) {
      console.log(`Syncing ${offlineEntries.length} offline entries`);
      // Implementation would sync with your API
    }
  } catch (error) {
    console.error('Failed to sync offline data:', error);
  }
}

async function getOfflineEntries() {
  // This would integrate with your offline storage system
  return [];
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Time for your daily reflection with Luma',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data,
    actions: [
      {
        action: 'open',
        title: 'Open Luma',
      },
      {
        action: 'close',
        title: 'Later',
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Luma', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync for offline entries
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-journal-entries') {
    event.waitUntil(syncOfflineEntries());
  }
});

async function syncOfflineEntries() {
  try {
    const response = await fetch('/api/sync-offline', {
      method: 'POST',
      credentials: 'include'
    });
    return response;
  } catch (error) {
    console.log('Sync failed:', error);
    throw error;
  }
}