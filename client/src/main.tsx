import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initSentry } from "./utils/sentry";
import { performanceMonitor } from "./utils/performance";
import { initializeGlobalAuthHandler } from "./utils/globalAuthHandler";
import { performanceMetrics } from "./utils/performanceMetrics";
import { deploymentValidator } from "./utils/deploymentValidator";
import { imageOptimizer } from "./utils/imageOptimization";
import "./utils/polyfills";
import { initializeServiceWorker } from "./utils/serviceWorkerRegistration";

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

// Initialize global authentication handler
initializeGlobalAuthHandler();

// Initialize performance metrics tracking
console.log('SoulScroll performance tracking initialized');

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
      <App />
    </StrictMode>
  );
  
  performanceMonitor.endMark('app-initialization');
} else {
  throw new Error(
    "Root element with ID 'root' was not found in the document. Ensure there is a corresponding HTML element with the ID 'root' in your HTML file.",
  );
}
