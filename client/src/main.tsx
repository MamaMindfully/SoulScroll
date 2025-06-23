import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import SafeApp from "./components/SafeApp";
import "./index.css";
import { initSentry } from "./utils/sentry";
import { performanceMonitor } from "./utils/performance";
import { initializeGlobalAuthHandler } from "./utils/globalAuthHandler";
import { performanceMetrics } from "./utils/performanceMetrics";
import { deploymentValidator } from "./utils/deploymentValidator";
import { imageOptimizer } from "./utils/imageOptimization";
import "./utils/polyfills";


// Global fetch wrapper to handle 401 errors
window.fetch = (originalFetch => {
  return (...args) => {
    return originalFetch(...args).then(response => {
      if (response.status === 401) {
        console.warn('Global 401 detected. Session expired.');
        
        // Clear auth state
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('isAuthenticated');
        
        // Emit auth expired event
        window.dispatchEvent(new CustomEvent('authExpired', {
          detail: { reason: 'Session expired' }
        }));
        
        // Optional: Redirect to login (uncomment if needed)
        // window.location.href = '/login';
      }
      return response;
    });
  };
})(window.fetch);
import { setupCleanupHandlers, monitorMemory } from "./utils/memoryManagement";
import { 
  preloadCriticalRoutes, 
  addResourceHints, 
  optimizeServiceWorker,
  optimizeCriticalCSS,
  setupPerformanceMonitoring 
} from "./utils/bundleOptimization";
import { initializePerformanceOptimizations } from "./utils/finalOptimizations";

// Initialize Sentry and performance monitoring
initSentry();
performanceMonitor.startMark('app-initialization');

// Initialize service worker for PWA functionality with auto-reload (browser only)
if (typeof window !== 'undefined') {
  Promise.all([
    import('./utils/serviceWorkerRegistration'),
    import('./utils/versionChecker')
  ]).then(([{ register }, { versionChecker }]) => {
    // Register service worker
    register({
      onUpdate: registration => {
        if (registration && registration.waiting) {
          console.log('New service worker version available, activating...');
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      },
      onSuccess: registration => {
        console.log('Service worker registered successfully');
        // Start version checking after successful registration
        versionChecker.startChecking();
      }
    });

    // Listen for version updates
    versionChecker.onUpdate((type, data) => {
      if (type === 'update-available') {
        console.log('Auto-update triggered:', data);
        versionChecker.forceUpdate();
      }
    });
  }).catch(error => {
    console.error('Service worker initialization failed:', error);
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service worker controller changed, reloading page...');
      window.location.reload();
    });

    // Listen for service worker messages
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        console.log('Service worker updated notification received:', event.data);
        // Page will reload via controllerchange event
      }
    });
  }
}

// Initialize global authentication handler
import('./utils/globalAuthHandler').then(({ initializeGlobalAuthHandler }) => {
  initializeGlobalAuthHandler();
});

// Initialize development auth fix
import('./utils/authFix').then(({ initDevAuth }) => {
  initDevAuth();
});

// Initialize error capture system
import('./utils/errorCapture').then(() => {
  console.log('Error capture system initialized');
});

// Initialize performance optimizations with lazy loading
if (typeof window !== 'undefined') {
  // Use standard setTimeout for better compatibility
  setTimeout(() => {
    Promise.all([
      import('./utils/performanceOptimizer.js').catch(() => null),
      import('./utils/imageOptimizer').catch(() => null)
    ]).then(([perfModule, imgModule]) => {
      if (perfModule?.performanceOptimizer) {
        perfModule.performanceOptimizer.init();
      }
      
      if (imgModule?.imageOptimizer) {
        imgModule.imageOptimizer.preloadCriticalImages([
          '/icon-192.png',
          '/icon-512.png',
          '/insight-bg.png'
        ]);
      }
    }).catch(() => {
      // Silent fail for performance optimizations
    });
  }, 100);
}

// Initialize performance metrics tracking
console.log('SoulScroll performance tracking initialized');

// Enhanced Performance Observer for production monitoring
if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
  requestIdleCallback(() => {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'largest-contentful-paint') {
            console.log('LCP:', entry.startTime + 'ms');
          }
          if (entry.entryType === 'first-input') {
            console.log('FID:', entry.processingStart - entry.startTime + 'ms');
          }
          if (entry.entryType === 'layout-shift') {
            console.log('CLS:', entry.value);
          }
        });
      });
      
      // Observe Web Vitals
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      observer.observe({ type: 'first-input', buffered: true });
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (error) {
      console.log('Performance Observer not supported:', error);
    }
  });
}

// Make deployment validator available globally for debugging
window.validateDeployment = () => deploymentValidator.runAllChecks();

// Enhanced Performance Observer for Web Vitals
if ('PerformanceObserver' in window) {
  const runWhenIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
  runWhenIdle(() => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log('Performance entry observed:', {
          name: entry.name,
          startTime: entry.startTime,
          value: entry.value || entry.duration,
          type: entry.entryType
        });
        
        // Track in our metrics system
        if (window.soulScrollMetrics) {
          window.soulScrollMetrics.recordMetric(
            entry.entryType, 
            entry.value || entry.duration || entry.startTime,
            'ms'
          );
        }
      }
    });

    // Observe multiple performance entry types
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
    observer.observe({ type: 'first-input', buffered: true });
    observer.observe({ type: 'layout-shift', buffered: true });
    observer.observe({ type: 'resource', buffered: true });
    
    console.log('Performance Observer initialized with Web Vitals tracking');
  });
}

// Initialize comprehensive performance optimizations
initializePerformanceOptimizations();
addResourceHints();
optimizeCriticalCSS();
setupPerformanceMonitoring();
optimizeServiceWorker();

// Setup performance monitoring and cleanup
setupCleanupHandlers();

// Monitor memory usage in development
if (import.meta.env.DEV) {
  setInterval(() => {
    monitorMemory();
  }, 30000); // Check every 30 seconds
}

// Preload critical routes after initial load
window.addEventListener('load', () => {
  setTimeout(preloadCriticalRoutes, 1000);
});

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <SafeApp />
    </StrictMode>
  );
  
  performanceMonitor.endMark('app-initialization');
} else {
  throw new Error(
    "Root element with ID 'root' was not found in the document. Ensure there is a corresponding HTML element with the ID 'root' in your HTML file.",
  );
}
