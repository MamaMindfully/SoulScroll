import React, { useEffect } from 'react';

interface PerformanceOptimizerProps {
  children: React.ReactNode;
}

const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({ children }) => {
  useEffect(() => {
    // Preload critical resources
    const preloadCriticalResources = () => {
      // Preload fonts
      const fontLink = document.createElement('link');
      fontLink.rel = 'preload';
      fontLink.href = '/fonts/inter-var.woff2';
      fontLink.as = 'font';
      fontLink.type = 'font/woff2';
      fontLink.crossOrigin = 'anonymous';
      document.head.appendChild(fontLink);
    };

    // Optimize images
    const optimizeImages = () => {
      const images = document.querySelectorAll('img[data-src]');
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src || '';
            img.classList.remove('loading-skeleton');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    };

    // Reduce layout shifts
    const preventLayoutShifts = () => {
      // Add aspect ratio containers for dynamic content
      const dynamicContainers = document.querySelectorAll('[data-dynamic-height]');
      dynamicContainers.forEach(container => {
        const element = container as HTMLElement;
        if (!element.style.minHeight) {
          element.style.minHeight = '100px'; // Minimum height to prevent shifts
        }
      });
    };

    // Memory management
    const optimizeMemory = () => {
      // Clean up unused event listeners
      const cleanupOldListeners = () => {
        // Remove old analytics events
        const oldEvents = document.querySelectorAll('[data-old-event]');
        oldEvents.forEach(el => el.remove());
      };

      // Cleanup every 5 minutes
      const memoryCleanup = setInterval(cleanupOldListeners, 5 * 60 * 1000);
      
      return () => clearInterval(memoryCleanup);
    };

    // Service Worker registration for caching
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/sw.js');
        } catch (error) {
          // console.log('Service Worker registration failed:', error);
        }
      }
    };

    // Initialize optimizations
    preloadCriticalResources();
    optimizeImages();
    preventLayoutShifts();
    const cleanupMemory = optimizeMemory();
    registerServiceWorker();

    // Performance monitoring
    const measurePerformance = () => {
      if ('performance' in window) {
        // Measure page load time
        window.addEventListener('load', () => {
          const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
          // console.log(`Page load time: ${loadTime}ms`);
          
          // Report to analytics if needed
          if (loadTime > 3000) {
            // console.warn('Slow page load detected');
          }
        });

        // Measure Core Web Vitals
        if ('PerformanceObserver' in window) {
          // Largest Contentful Paint
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            // console.log('LCP:', lastEntry.startTime);
          }).observe({ entryTypes: ['largest-contentful-paint'] });

          // First Input Delay
          new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
              // console.log('FID:', entry.processingStart - entry.startTime);
            });
          }).observe({ entryTypes: ['first-input'] });
        }
      }
    };

    measurePerformance();

    return cleanupMemory;
  }, []);

  return <>{children}</>;
};

export default PerformanceOptimizer;