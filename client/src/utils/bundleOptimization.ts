// Bundle optimization utilities

// Preload critical routes
export const preloadCriticalRoutes = () => {
  const criticalRoutes = [
    () => import('@/pages/Feed'),
    () => import('@/pages/dreams'),
    () => import('@/pages/mantras')
  ];

  // Preload when idle
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      criticalRoutes.forEach(route => {
        route().catch(() => {
          // Silently fail for preloading
        });
      });
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      criticalRoutes.forEach(route => {
        route().catch(() => {
          // Silently fail for preloading
        });
      });
    }, 2000);
  }
};

// Resource hints for better loading
export const addResourceHints = () => {
  const head = document.head;

  // Preconnect to common domains
  const preconnectDomains = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com'
  ];

  preconnectDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    head.appendChild(link);
  });

  // DNS prefetch for API domains
  const dnsPrefetchDomains = [
    'https://api.openai.com'
  ];

  dnsPrefetchDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    head.appendChild(link);
  });
};

// Code splitting optimization
export const optimizeCodeSplitting = () => {
  // Track which components are actually used
  const usageTracker = new Map<string, number>();

  const trackComponentUsage = (componentName: string) => {
    const count = usageTracker.get(componentName) || 0;
    usageTracker.set(componentName, count + 1);
  };

  // Report usage stats
  const reportUsage = () => {
    console.log('Component usage stats:', Object.fromEntries(usageTracker));
  };

  return {
    trackComponentUsage,
    reportUsage
  };
};

// Service Worker optimization
export const optimizeServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    // Update service worker when new version is available
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });

    // Handle service worker updates
    navigator.serviceWorker.register('/sw.js').then(registration => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, prompt user to update
              if (confirm('A new version is available. Reload to update?')) {
                newWorker.postMessage({ action: 'skipWaiting' });
              }
            }
          });
        }
      });
    });
  }
};

// Image optimization
export const optimizeImages = () => {
  // Lazy load images when they enter viewport
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      }
    });
  });

  // Observe all lazy images
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });

  return imageObserver;
};

// Critical CSS optimization
export const optimizeCriticalCSS = () => {
  // Inline critical CSS for above-the-fold content
  const criticalCSS = `
    .app-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    }
    
    .journal-editor {
      min-height: 400px;
    }
    
    .loading-spinner {
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;

  const style = document.createElement('style');
  style.textContent = criticalCSS;
  document.head.appendChild(style);
};

// Performance monitoring
export const setupPerformanceMonitoring = () => {
  // Monitor Core Web Vitals
  if ('web-vital' in window) {
    // This would typically use the web-vitals library
    // For now, use Performance Observer API
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            console.log('LCP:', entry.startTime);
          }
          if (entry.entryType === 'first-input') {
            console.log('FID:', entry.processingStart - entry.startTime);
          }
          if (entry.entryType === 'layout-shift') {
            console.log('CLS:', entry.value);
          }
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
    }
  }

  // Monitor bundle sizes
  if ('navigation' in performance) {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      console.log('Page load metrics:', {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        transferSize: navigation.transferSize,
        encodedBodySize: navigation.encodedBodySize
      });
    });
  }
};