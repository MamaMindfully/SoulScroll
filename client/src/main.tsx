import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initSentry } from "./utils/sentry";
import { performanceMonitor } from "./utils/performance";
import { initializeGlobalAuthHandler } from "./utils/globalAuthHandler";
import { performanceMetrics } from "./utils/performanceMetrics";
import { deploymentValidator } from "./utils/deploymentValidator";

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
