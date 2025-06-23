// Service Worker Registration for SoulScroll PWA
// Handles registration, updates, and offline functionality

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

export function register(config) {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(window.location.href);
    if (publicUrl.origin !== window.location.origin) return;

    window.addEventListener('load', () => {
      const swUrl = `/service-worker.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.log('Service worker is active.');
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then(registration => {
      if (registration.waiting) {
        config && config.onUpdate && config.onUpdate(registration);
      }

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                config && config.onUpdate && config.onUpdate(registration);
              }
            }
          };
        }
      };
    })
    .catch(error => {
      console.error('Error during service worker registration:', error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
    .then(response => {
      if (
        response.status === 404 ||
        response.headers.get('content-type').indexOf('javascript') === -1
      ) {
        navigator.serviceWorker.ready.then(registration => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('No internet connection found. App is running in offline mode.');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
      })
      .catch(error => {
        console.error(error.message);
      });
  }
}

// Enhanced PWA features
export function checkForUpdates() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.update();
    });
  }
}

export function addToHomeScreen() {
  // Listen for beforeinstallprompt event
  let deferredPrompt;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button/prompt
    const installButton = document.getElementById('install-button');
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', () => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          console.log(choiceResult.outcome === 'accepted' ? 
            'User accepted the install prompt' : 
            'User dismissed the install prompt');
          deferredPrompt = null;
        });
      });
    }
  });
  
  // Track app installation
  window.addEventListener('appinstalled', () => {
    console.log('SoulScroll PWA was installed');
    // Track analytics or show success message
  });
}

// Initialize service worker with auto-reload functionality
export function initializeServiceWorker() {
  // Only initialize in browser environment
  if (typeof window === 'undefined') return;
  
  register({
    onUpdate: registration => {
      if (registration && registration.waiting) {
        // Skip waiting and activate new service worker immediately
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        console.log('New version detected, activating update...');
      }
    },
    onSuccess: (registration) => {
      console.log('SoulScroll is ready for offline use');
    }
  });
  
  // Auto-reload when the new service worker takes control
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service worker updated, reloading page...');
      window.location.reload();
    });
  }
  
  // Initialize PWA features
  addToHomeScreen();
  
  // Check for updates periodically
  setInterval(checkForUpdates, 60000); // Check every minute
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
      })
      .catch(error => {
        console.error(error.message);
      });
  }
}