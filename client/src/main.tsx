import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initSentry } from "./utils/sentry";
import { performanceMonitor } from "./utils/performance";
import { setupCleanupHandlers, monitorMemory } from "./utils/memoryManagement";
import { 
  preloadCriticalRoutes, 
  addResourceHints, 
  optimizeServiceWorker,
  optimizeCriticalCSS,
  setupPerformanceMonitoring 
} from "./utils/bundleOptimization";
import { initializePerformanceOptimizations } from "./utils/finalOptimizations";

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
} else {
  throw new Error(
    "Root element with ID 'root' was not found in the document. Ensure there is a corresponding HTML element with the ID 'root' in your HTML file.",
  );
}
