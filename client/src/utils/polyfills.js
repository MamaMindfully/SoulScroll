// Browser compatibility polyfills for SoulScroll
// Ensures modern performance APIs work across all browsers

// Request Idle Callback polyfill
if (!window.requestIdleCallback) {
  window.requestIdleCallback = function(callback, options = {}) {
    const timeout = options.timeout || 5000;
    const startTime = performance.now();
    
    return setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining() {
          return Math.max(0, 50 - (performance.now() - startTime));
        }
      });
    }, 1);
  };
}

if (!window.cancelIdleCallback) {
  window.cancelIdleCallback = function(id) {
    clearTimeout(id);
  };
}

// Intersection Observer polyfill check
if (!window.IntersectionObserver) {
  console.warn('IntersectionObserver not supported. Lazy loading may not work optimally.');
  
  // Basic fallback for intersection observer
  window.IntersectionObserver = class {
    constructor(callback) {
      this.callback = callback;
      this.elements = new Set();
    }
    
    observe(element) {
      this.elements.add(element);
      // Immediately trigger callback for fallback
      setTimeout(() => {
        this.callback([{
          target: element,
          isIntersecting: true
        }]);
      }, 100);
    }
    
    unobserve(element) {
      this.elements.delete(element);
    }
    
    disconnect() {
      this.elements.clear();
    }
  };
}

// Performance Observer polyfill check
if (!window.PerformanceObserver) {
  console.warn('PerformanceObserver not supported. Performance metrics will be limited.');
  
  // Basic fallback
  window.PerformanceObserver = class {
    constructor(callback) {
      this.callback = callback;
    }
    
    observe() {
      // No-op fallback
    }
    
    disconnect() {
      // No-op fallback
    }
  };
}

// Web Vitals polyfills for older browsers
if (!window.PerformanceNavigationTiming) {
  console.warn('Navigation Timing API not fully supported.');
}

// Loading attribute support check
export function supportsLazyLoading() {
  return 'loading' in HTMLImageElement.prototype;
}

// Add loading="lazy" polyfill for older browsers
if (!supportsLazyLoading()) {
  console.warn('Native lazy loading not supported. Using intersection observer fallback.');
  
  // Simple lazy loading polyfill
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  
  if (window.IntersectionObserver) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          imageObserver.unobserve(img);
        }
      });
    });
    
    lazyImages.forEach(img => {
      if (img.src && !img.dataset.src) {
        img.dataset.src = img.src;
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InRyYW5zcGFyZW50Ii8+PC9zdmc+';
      }
      imageObserver.observe(img);
    });
  }
}

console.log('Browser polyfills loaded successfully');