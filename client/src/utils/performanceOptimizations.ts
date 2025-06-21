// Performance optimization utilities

// Debounce function for reducing API calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function for performance-critical operations
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Lazy loading utility for components
export const lazyLoad = (componentImport: () => Promise<any>) => {
  return React.lazy(componentImport);
};

// Image optimization
export const optimizeImageUrl = (
  url: string, 
  width?: number, 
  height?: number,
  quality: number = 80
): string => {
  if (!url) return '';
  
  // If it's a local image, return as-is
  if (url.startsWith('/') || url.startsWith('./')) {
    return url;
  }
  
  // For external images, you could add image optimization service
  // This is a placeholder for services like Cloudinary, ImageKit, etc.
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  params.set('q', quality.toString());
  
  return url + (params.toString() ? `?${params.toString()}` : '');
};

// Memory management for large datasets
export class DataCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private maxSize: number;
  private ttl: number; // time to live in milliseconds

  constructor(maxSize: number = 100, ttl: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  set(key: string, data: T): void {
    // Remove expired entries
    this.cleanup();
    
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Virtual scrolling for large lists
export const calculateVisibleItems = (
  containerHeight: number,
  itemHeight: number,
  scrollTop: number,
  overscan: number = 5
) => {
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);
  
  return {
    start: Math.max(0, visibleStart - overscan),
    end: visibleEnd + overscan
  };
};

// Bundle splitting and code splitting helpers
export const preloadRoute = (routeImport: () => Promise<any>) => {
  // Preload the route component
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'script';
  
  // This is a simplified version - in practice you'd need to know the chunk name
  routeImport().catch(() => {
    // Silently fail for prefetching
  });
};

// Web Worker utilities for heavy computations
export const createWorker = (workerFunction: Function) => {
  const blob = new Blob([`(${workerFunction.toString()})()`], {
    type: 'application/javascript'
  });
  return new Worker(URL.createObjectURL(blob));
};

// Service Worker update handling
export const handleServiceWorkerUpdate = (registration: ServiceWorkerRegistration) => {
  if (registration.waiting) {
    // New service worker is waiting, show update prompt
    if (confirm('A new version is available. Reload to update?')) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }
};

// Performance monitoring
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();

  startMeasure(name: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      
      const measures = this.metrics.get(name)!;
      measures.push(duration);
      
      // Keep only last 100 measurements
      if (measures.length > 100) {
        measures.shift();
      }
      
      console.log(`${name}: ${duration.toFixed(2)}ms`);
    };
  }

  getAverageTime(name: string): number {
    const measures = this.metrics.get(name);
    if (!measures || measures.length === 0) return 0;
    
    return measures.reduce((sum, time) => sum + time, 0) / measures.length;
  }

  getMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {};
    
    for (const [name, measures] of this.metrics.entries()) {
      result[name] = {
        average: this.getAverageTime(name),
        count: measures.length
      };
    }
    
    return result;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();