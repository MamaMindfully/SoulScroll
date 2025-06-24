// Service Worker Registration for SoulScroll AI
// Best practice registration with update handling

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
};

export function register(config?: Config) {
  if ('serviceWorker' in navigator) {
    const swUrl = '/service-worker.js';

    if (isLocalhost) {
      // For localhost, check if service worker exists
      checkValidServiceWorker(swUrl, config);
    } else {
      // For production, register normally
      registerValidSW(swUrl, config);
    }
  }
}

function registerValidSW(swUrl: string, config?: Config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('[SW] Service worker registered:', registration);
      
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content is available and will be used when all tabs are closed
              console.log('[SW] New content available, will update on next visit');
              
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // Content is cached for the first time
              console.log('[SW] Content cached for offline use');
              
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('[SW] Service worker registration failed:', error);
    });
}

function checkValidServiceWorker(swUrl: string, config?: Config) {
  // Check if the service worker can be found
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      // Ensure service worker exists, and that we really are getting a JS file
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found, probably a different app
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found, proceed as normal
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('[SW] No internet connection, app running in offline mode');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
        console.log('[SW] Service worker unregistered');
      })
      .catch((error) => {
        console.error('[SW] Service worker unregistration failed:', error);
      });
  }
}

// Helper to force update the service worker
export function updateServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.update();
      console.log('[SW] Manual update triggered');
    });
  }
}

// Check if service worker is controlling the page
export function isServiceWorkerActive(): boolean {
  return navigator.serviceWorker?.controller !== null;
}

// Get service worker version
export async function getServiceWorkerVersion(): Promise<string | null> {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.version || null);
      };
      
      navigator.serviceWorker.controller?.postMessage(
        { type: 'GET_VERSION' },
        [messageChannel.port2]
      );
      
      // Timeout after 1 second
      setTimeout(() => resolve(null), 1000);
    });
  }
  return null;
}