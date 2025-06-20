// Service Worker for SoulScroll
// Provides offline functionality and caching

const CACHE_NAME = 'soulscroll-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  // Handle API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Store successful API responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Return cached response if available
          return caches.match(event.request);
        })
    );
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Background sync for offline entries
self.addEventListener('sync', event => {
  if (event.tag === 'journal-sync') {
    event.waitUntil(syncJournalEntries());
  }
});

async function syncJournalEntries() {
  try {
    // Get offline entries from IndexedDB or localStorage
    const offlineEntries = await getOfflineEntries();
    
    for (const entry of offlineEntries) {
      try {
        await fetch('/api/journal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        });
        
        // Remove synced entry
        await removeOfflineEntry(entry.id);
      } catch (error) {
        console.error('Failed to sync entry:', error);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

async function getOfflineEntries() {
  // This would typically use IndexedDB
  // For now, return empty array
  return [];
}

async function removeOfflineEntry(id) {
  // Remove synced entry from offline storage
  console.log('Removing offline entry:', id);
}