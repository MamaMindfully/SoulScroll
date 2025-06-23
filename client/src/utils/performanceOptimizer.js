// Performance optimization utilities
class PerformanceOptimizer {
  constructor() {
    this.criticalResources = new Set();
    this.lazyResources = new Map();
    this.preloadQueue = [];
  }

  // Mark resources as critical for immediate loading
  markCritical(resource) {
    this.criticalResources.add(resource);
    this.preloadResource(resource);
  }

  // Preload resource with priority
  preloadResource(href, as = 'script', type = null) {
    if (document.querySelector(`link[href="${href}"]`)) {
      return; // Already preloaded
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) link.type = type;
    
    document.head.appendChild(link);
  }

  // Lazy load non-critical resources
  lazyLoad(resource, callback) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.loadResource(resource, callback);
      });
    } else {
      setTimeout(() => {
        this.loadResource(resource, callback);
      }, 100);
    }
  }

  // Load resource with callback
  loadResource(resource, callback) {
    if (resource.endsWith('.js')) {
      const script = document.createElement('script');
      script.src = resource;
      script.onload = callback;
      script.onerror = () => console.error('Failed to load:', resource);
      document.head.appendChild(script);
    } else if (resource.endsWith('.css')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = resource;
      link.onload = callback;
      link.onerror = () => console.error('Failed to load:', resource);
      document.head.appendChild(link);
    }
  }

  // Optimize images with intersection observer
  optimizeImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }

  // Bundle and defer non-critical JavaScript
  deferNonCritical() {
    const nonCriticalScripts = [
      '/src/components/AdminBetaDashboard.tsx',
      '/src/components/analytics/',
      '/src/utils/performanceOptimizer.js'
    ];

    requestIdleCallback(() => {
      nonCriticalScripts.forEach(script => {
        this.lazyLoad(script);
      });
    });
  }

  // Initialize all optimizations
  init() {
    // Preload critical resources
    this.markCritical('/fonts/Inter.woff2');
    this.markCritical('/icon-192.png');
    
    // Optimize images when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.optimizeImages();
      });
    } else {
      this.optimizeImages();
    }

    // Defer non-critical resources
    this.deferNonCritical();
  }
}

export const performanceOptimizer = new PerformanceOptimizer();