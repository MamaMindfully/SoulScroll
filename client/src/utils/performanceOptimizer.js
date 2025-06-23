// Performance optimization utilities to improve LCP and reduce load times

// Lazy loading for heavy components
export const optimizeImageLoading = () => {
  // Add intersection observer for images
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
};

// Defer non-critical resource loading
export const optimizeMemoryUsage = () => {
  // Clean up event listeners and observers
  const cleanup = () => {
    // Remove stale listeners
    const staleElements = document.querySelectorAll('[data-cleanup]');
    staleElements.forEach(el => {
      if (el.cleanup) el.cleanup();
    });
  };

  // Run cleanup every 30 seconds
  setInterval(cleanup, 30000);
};

// Bundle optimization for faster loading
export const optimizeBundleLoading = () => {
  // Preload critical routes
  const criticalRoutes = ['/home', '/journal', '/insights'];
  
  criticalRoutes.forEach(route => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  });
};

// Delay effect hook for performance optimizations
export const useDelayedEffect = (callback, delay = 1000) => {
  return setTimeout(callback, delay);
};

// Critical resource preloader
export const preloadCriticalResources = () => {
  // Preload critical fonts
  const fontPreloads = [
    '/fonts/Inter-Regular.woff2',
    '/fonts/Inter-SemiBold.woff2'
  ];

  fontPreloads.forEach(font => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = font;
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });

  // Preload service worker
  if ('serviceWorker' in navigator) {
    setTimeout(() => {
      navigator.serviceWorker.register('/service-worker.js')
        .catch(error => console.log('SW registration failed'));
    }, 2000);
  }
};

// Reduce API call frequency
export const debounceApiCalls = (func, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Memory leak prevention
export const preventMemoryLeaks = () => {
  // Clear intervals and timeouts on page unload
  window.addEventListener('beforeunload', () => {
    // Clear all timeouts and intervals
    for (let i = 1; i < 99999; i++) {
      window.clearTimeout(i);
      window.clearInterval(i);
    }
  });
};

// Initialize all optimizations
export const initializePerformanceOptimizations = () => {
  preloadCriticalResources();
  optimizeImageLoading();
  optimizeMemoryUsage();
  optimizeBundleLoading();
  preventMemoryLeaks();
};