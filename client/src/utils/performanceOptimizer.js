// Performance optimization utilities
function createPerformanceOptimizer() {
  const criticalResources = new Set();
  const lazyResources = new Map();
  const preloadQueue = [];

  // Mark resources as critical for immediate loading
  function markCritical(resource) {
    criticalResources.add(resource);
    preloadResource(resource);
  }

  // Preload resource with priority
  function preloadResource(href, as = 'script', type = null) {
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

  // Optimize images with intersection observer
  function optimizeImages() {
    const images = document.querySelectorAll('img[data-src]');
    if (!images.length) return;

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

  // Initialize all optimizations
  function init() {
    try {
      // Preload critical resources
      markCritical('/fonts/Inter.woff2');
      markCritical('/icon-192.png');
      
      // Optimize images when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', optimizeImages);
      } else {
        optimizeImages();
      }
    } catch (error) {
      console.log('Performance optimization error:', error);
    }
  }

  return {
    markCritical,
    preloadResource,
    optimizeImages,
    init
  };
}

// Create and export the optimizer
const performanceOptimizer = createPerformanceOptimizer();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.performanceOptimizer = performanceOptimizer;
}

export { performanceOptimizer };