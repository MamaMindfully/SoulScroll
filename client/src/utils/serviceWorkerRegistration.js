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
      const swUrl = `./service-worker.js`;

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
                console.log('New service worker installed, triggering update');
                config && config.onUpdate && config.onUpdate(registration);
              } else {
                console.log('Service worker installed for the first time');
                config && config.onSuccess && config.onSuccess(registration);
              }
            }
          };
        }
      };

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'SW_UPDATED') {
          console.log('Service worker updated to version:', event.data.version);
          config && config.onUpdate && config.onUpdate(registration);
        }
      });

      // Periodic version check (every 30 seconds when page is visible)
      if (!isLocalhost) {
        setInterval(async () => {
          if (!document.hidden) {
            try {
              const response = await fetch('/api/sw-version');
              const { version } = await response.json();
              
              // Get current SW version
              const channel = new MessageChannel();
              navigator.serviceWorker.controller?.postMessage(
                { type: 'GET_VERSION' }, 
                [channel.port2]
              );
              
              channel.port1.onmessage = (e) => {
                if (e.data.type === 'VERSION_RESPONSE' && e.data.version !== version) {
                  console.log('Version mismatch detected, updating service worker');
                  registration.update();
                }
              };
            } catch (error) {
              console.log('Version check failed:', error);
            }
          }
        }, 30000);
      }
    })
    .catch(error => {
      console.error('Error during service worker registration:', error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
    .then(response => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
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