import { useEffect, useCallback, useRef } from 'react';
import { safeFetch } from '@/utils/safeFetch';

// Hook for optimizing API calls with caching and batching
export function useOptimizedAPI() {
  const cache = useRef(new Map());
  const pendingRequests = useRef(new Map());

  const optimizedFetch = useCallback(async (url, options = {}) => {
    // Check cache first
    if (cache.current.has(url)) {
      const cached = cache.current.get(url);
      const age = Date.now() - cached.timestamp;
      const maxAge = options.cacheTime || 300000; // 5 minutes default
      
      if (age < maxAge) {
        return cached.data;
      }
    }

    // Return pending request if already in progress
    if (pendingRequests.current.has(url)) {
      return pendingRequests.current.get(url);
    }

    // Create new request
    const request = safeFetch(url, options);
    pendingRequests.current.set(url, request);

    try {
      const result = await request;
      
      // Cache successful results
      if (result.success) {
        cache.current.set(url, {
          data: result,
          timestamp: Date.now()
        });
      }
      
      return result;
    } finally {
      pendingRequests.current.delete(url);
    }
  }, []);

  const clearCache = useCallback(() => {
    cache.current.clear();
    pendingRequests.current.clear();
  }, []);

  return { optimizedFetch, clearCache };
}

// Hook for preloading critical resources
export function useResourcePreloader() {
  const preloadedResources = useRef(new Set());

  const preloadImage = useCallback((src) => {
    if (preloadedResources.current.has(src)) return;
    
    const img = new Image();
    img.src = src;
    preloadedResources.current.add(src);
  }, []);

  const preloadFont = useCallback((fontUrl) => {
    if (preloadedResources.current.has(fontUrl)) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.href = fontUrl;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
    preloadedResources.current.add(fontUrl);
  }, []);

  const preloadScript = useCallback((scriptUrl) => {
    if (preloadedResources.current.has(scriptUrl)) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = scriptUrl;
    document.head.appendChild(link);
    preloadedResources.current.add(scriptUrl);
  }, []);

  return { preloadImage, preloadFont, preloadScript };
}

// Hook for monitoring performance metrics
export function usePerformanceMonitor() {
  const metrics = useRef({
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null
  });

  useEffect(() => {
    // Delay DOM observation until idle for better performance
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window && 'requestIdleCallback' in window) {
      requestIdleCallback(() => {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          metrics.current.lcp = lastEntry.startTime;
          
          if (lastEntry.startTime > 2500) {
            console.warn('LCP is slow:', lastEntry.startTime + 'ms');
          }
        });
        
        try {
          lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (e) {
          // LCP not supported
        }

      // First Input Delay
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          metrics.current.fid = entry.processingStart - entry.startTime;
          
          if (entry.processingStart - entry.startTime > 100) {
            console.warn('FID is slow:', entry.processingStart - entry.startTime + 'ms');
          }
        });
      });
      
      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        // FID not supported
      }

      return () => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
      };
    }
  }, []);

  const getMetrics = useCallback(() => {
    return { ...metrics.current };
  }, []);

  return { getMetrics };
}

// Hook for optimizing images with intersection observer
export function useImageOptimization() {
  const imageCache = useRef(new Map());
  const observerRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              const src = img.dataset.src;
              
              if (src && !imageCache.current.has(src)) {
                img.src = src;
                img.removeAttribute('data-src');
                imageCache.current.set(src, true);
                observerRef.current.unobserve(img);
              }
            }
          });
        },
        { threshold: 0.1 }
      );
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const observeImage = useCallback((imageElement) => {
    if (observerRef.current && imageElement) {
      observerRef.current.observe(imageElement);
    }
  }, []);

  return { observeImage };
}

// Hook for batch processing to reduce API calls
export function useBatchProcessor(batchSize = 5, delay = 1000) {
  const queue = useRef([]);
  const timeoutRef = useRef(null);

  const addToQueue = useCallback((item) => {
    queue.current.push(item);
    
    if (queue.current.length >= batchSize) {
      processBatch();
    } else {
      // Set timeout for delayed processing
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        if (queue.current.length > 0) {
          processBatch();
        }
      }, delay);
    }
  }, [batchSize, delay]);

  const processBatch = useCallback(async () => {
    if (queue.current.length === 0) return;
    
    const batch = [...queue.current];
    queue.current = [];
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    try {
      // Process batch items
      const results = await Promise.allSettled(
        batch.map(item => item.processor(item.data))
      );
      
      results.forEach((result, index) => {
        const item = batch[index];
        if (result.status === 'fulfilled') {
          item.onSuccess?.(result.value);
        } else {
          item.onError?.(result.reason);
        }
      });
    } catch (error) {
      console.error('Batch processing failed:', error);
      batch.forEach(item => item.onError?.(error));
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { addToQueue, processBatch };
}