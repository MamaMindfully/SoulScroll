import { useEffect } from 'react';

// Performance optimization hooks
export const useDelayedEffect = (callback: () => void, delay: number = 2000) => {
  
  
  useEffect(() => {
    
    
    const timer = setTimeout(() => {
      callback();
    }, delay);

    return () => clearTimeout(timer);
  }, [callback, delay]);
};

export const useIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) => {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    
    const observer = new IntersectionObserver(callback, options);
    return () => observer.disconnect();
  }, [callback, options]);
};

// Image optimization utilities
export const optimizeImageLoading = () => {
  if (typeof window === 'undefined') return;
  
  // Add loading="lazy" to all images without explicit loading attribute
  const images = document.querySelectorAll('img:not([loading])');
  images.forEach(img => {
    img.setAttribute('loading', 'lazy');
  });
  
  // Preload above-the-fold images
  const priorityImages = document.querySelectorAll('img[data-priority="true"]');
  priorityImages.forEach(img => {
    img.setAttribute('loading', 'eager');
  });
};

// Memory optimization
export const optimizeMemoryUsage = () => {
  if (typeof window === 'undefined') return;
  
  // Clean up unused event listeners
  const cleanupOldListeners = () => {
    // Remove any orphaned event listeners
    document.querySelectorAll('[data-cleanup="true"]').forEach(element => {
      const clone = element.cloneNode(true);
      element.parentNode?.replaceChild(clone, element);
    });
  };
  
  // Run cleanup every 5 minutes
  setInterval(cleanupOldListeners, 5 * 60 * 1000);
};

// Bundle optimization
export const optimizeBundleLoading = () => {
  if (typeof window === 'undefined') return;
  
  // Preload critical chunks after initial load
  window.addEventListener('load', () => {
    setTimeout(() => {
      // Preload commonly accessed routes
      const criticalRoutes = ['/insights', '/timeline', '/settings'];
      criticalRoutes.forEach(route => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });
    }, 3000);
  });
};