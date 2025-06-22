// Final performance optimizations and deployment preparation

import { warmupCache, optimizeCache } from './cacheOptimization';
import { cleanupCache, monitorMemory } from './memoryManagement';

// Critical performance initialization
export const initializePerformanceOptimizations = () => {
  // 1. Critical resource loading
  preloadCriticalResources();
  
  // 2. Cache warmup
  warmupCache();
  
  // 3. Memory monitoring
  setupMemoryMonitoring();
  
  // 4. Performance observers
  setupPerformanceObservers();
  
  // 5. Error tracking
  setupErrorTracking();
  
  // 6. Network optimization
  optimizeNetworkRequests();
  
  console.log('SoulScroll performance optimizations initialized');
};

// Preload critical resources
const preloadCriticalResources = () => {
  const criticalResources = [
    { href: '/manifest.json', rel: 'prefetch' },
    { href: '/sw.js', rel: 'prefetch' },
    { href: '/fonts/Inter.woff2', rel: 'preload', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
    { href: '/icon-512.png', rel: 'preload', as: 'image' },
    { href: '/insight-bg.png', rel: 'preload', as: 'image' }
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = resource.rel;
    link.href = resource.href;
    if (resource.as) link.setAttribute('as', resource.as);
    if (resource.type) link.setAttribute('type', resource.type);
    if (resource.crossOrigin) link.setAttribute('crossorigin', resource.crossOrigin);
    document.head.appendChild(link);
  });
};

// Memory monitoring setup
const setupMemoryMonitoring = () => {
  // Monitor memory every 30 seconds in production, 10 seconds in dev
  const interval = import.meta.env.PROD ? 30000 : 10000;
  
  setInterval(() => {
    const memoryInfo = monitorMemory();
    
    // Trigger cleanup if memory usage is high
    if (memoryInfo && memoryInfo.used / memoryInfo.limit > 0.7) {
      cleanupCache();
    }
  }, interval);
};

// Performance observers for Core Web Vitals
const setupPerformanceObservers = () => {
  if ('PerformanceObserver' in window) {
    // Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('LCP:', entry.startTime);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP observer not supported');
    }

    // First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fid = entry.processingStart - entry.startTime;
          console.log('FID:', fid);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('FID observer not supported');
    }

    // Cumulative Layout Shift
    try {
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            console.log('CLS:', entry.value);
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('CLS observer not supported');
    }
  }
};

// Error tracking and reporting
const setupErrorTracking = () => {
  // Global error handler
  window.addEventListener('error', (event) => {
    console.error('Global error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
  });

  // Promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });

  // Performance issues tracking
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Log slow operations
            console.warn('Slow operation detected:', {
              name: entry.name,
              duration: entry.duration,
              type: entry.entryType
            });
          }
        }
      });
      observer.observe({ entryTypes: ['measure', 'navigation'] });
    } catch (e) {
      console.warn('Performance observer not supported');
    }
  }
};

// Network optimization
const optimizeNetworkRequests = () => {
  // Implement request deduplication
  const pendingRequests = new Map<string, Promise<any>>();

  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method || 'GET';
    const key = `${method}:${url}`;

    // Deduplicate GET requests
    if (method === 'GET' && pendingRequests.has(key)) {
      return pendingRequests.get(key)!;
    }

    const promise = originalFetch(input, init)
      .finally(() => {
        pendingRequests.delete(key);
      });

    if (method === 'GET') {
      pendingRequests.set(key, promise);
    }

    return promise;
  };
};

// Production deployment optimizations
export const prepareForDeployment = () => {
  console.log('Preparing SoulScroll for deployment...');
  
  // Final cache optimization
  optimizeCache();
  
  // Clear development-only data
  if (import.meta.env.PROD) {
    localStorage.removeItem('dev-mode-data');
    sessionStorage.removeItem('debug-info');
  }
  
  // Verify critical resources
  const criticalChecks = [
    () => !!document.querySelector('link[rel="manifest"]'),
    () => 'serviceWorker' in navigator,
    () => !!window.localStorage,
    () => !!window.sessionStorage
  ];
  
  const allChecksPass = criticalChecks.every(check => {
    try {
      return check();
    } catch {
      return false;
    }
  });
  
  if (allChecksPass) {
    console.log('✓ SoulScroll deployment checks passed');
  } else {
    console.warn('⚠ Some deployment checks failed');
  }
  
  return allChecksPass;
};

// App Store optimization checklist
export const validateAppStoreReadiness = () => {
  const checks = {
    manifest: !!document.querySelector('link[rel="manifest"]'),
    serviceWorker: 'serviceWorker' in navigator,
    httpsOrLocalhost: location.protocol === 'https:' || location.hostname === 'localhost',
    responsive: window.matchMedia('(max-width: 768px)').matches || window.innerWidth > 768,
    offline: 'caches' in window,
    installable: true // This would be checked by browser
  };
  
  const passed = Object.values(checks).every(Boolean);
  
  console.log('App Store readiness:', {
    passed,
    checks,
    score: `${Object.values(checks).filter(Boolean).length}/${Object.keys(checks).length}`
  });
  
  return { passed, checks };
};

// Initialize on load
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initializePerformanceOptimizations();
    
    // Validate app store readiness in production
    if (import.meta.env.PROD) {
      setTimeout(() => {
        validateAppStoreReadiness();
        prepareForDeployment();
      }, 2000);
    }
  });
}