import { addBreadcrumb, captureError } from './sentry';

interface PerformanceMetrics {
  name: string;
  duration: number;
  type: string;
}

class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.setupObservers();
  }

  private setupObservers() {
    // Navigation timing observer
    if ('PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.reportNavigationMetrics(navEntry);
            }
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);
      } catch (error) {
        console.warn('Navigation observer not supported');
      }

      // Long task observer
      try {
        const taskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.reportLongTask(entry);
          }
        });
        taskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(taskObserver);
      } catch (error) {
        console.warn('Long task observer not supported');
      }

      // Largest Contentful Paint observer
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.reportLCP(entry);
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (error) {
        console.warn('LCP observer not supported');
      }
    }
  }

  private reportNavigationMetrics(entry: PerformanceNavigationTiming) {
    const metrics = {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      firstPaint: entry.responseEnd - entry.requestStart,
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize
    };

    console.log('Navigation metrics:', metrics);
    addBreadcrumb('Navigation completed', 'performance', metrics);

    // Report slow navigation
    if (metrics.domContentLoaded > 2000) {
      console.warn('Slow DOM load detected:', metrics.domContentLoaded + 'ms');
      addBreadcrumb('Slow DOM load detected', 'performance', {
        duration: metrics.domContentLoaded
      });
    }
  }

  private reportLongTask(entry: PerformanceEntry) {
    console.warn('Long task detected:', {
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime
    });

    addBreadcrumb('Long task detected', 'performance', {
      name: entry.name,
      duration: entry.duration
    });

    // Capture as error if task is very long
    if (entry.duration > 500) {
      captureError(new Error(`Long task: ${entry.name} (${entry.duration}ms)`), {
        taskDuration: entry.duration,
        taskName: entry.name
      });
    }
  }

  private reportLCP(entry: PerformanceEntry) {
    console.log('Largest Contentful Paint:', entry.startTime + 'ms');
    addBreadcrumb('LCP measured', 'performance', {
      lcp: entry.startTime
    });

    // Report slow LCP
    if (entry.startTime > 2500) {
      console.warn('Slow LCP detected:', entry.startTime + 'ms');
      addBreadcrumb('Slow LCP detected', 'performance', {
        lcp: entry.startTime
      });
    }
  }

  // Manual performance marking
  startMark(name: string) {
    const startTime = performance.now();
    this.marks.set(name, startTime);
    addBreadcrumb(`Performance mark started: ${name}`, 'performance');
  }

  endMark(name: string) {
    const startTime = this.marks.get(name);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.marks.delete(name);
      
      console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
      addBreadcrumb(`Performance mark ended: ${name}`, 'performance', {
        duration: duration.toFixed(2)
      });

      // Report slow operations
      if (duration > 1000) {
        console.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`);
        captureError(new Error(`Slow operation: ${name}`), {
          operationName: name,
          duration: duration.toFixed(2)
        });
      }

      return duration;
    }
    return 0;
  }

  // Component render timing
  measureComponent(componentName: string, renderFn: () => void) {
    this.startMark(`component-${componentName}`);
    renderFn();
    this.endMark(`component-${componentName}`);
  }

  // API call timing
  measureApiCall(endpoint: string, callFn: () => Promise<any>) {
    this.startMark(`api-${endpoint}`);
    return callFn().finally(() => {
      this.endMark(`api-${endpoint}`);
    });
  }

  // Memory usage monitoring
  reportMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryInfo = {
        usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
      };

      console.log('Memory usage (MB):', memoryInfo);
      addBreadcrumb('Memory usage reported', 'performance', memoryInfo);

      // Alert on high memory usage
      if (memoryInfo.usedJSHeapSize > 100) {
        console.warn('High memory usage detected:', memoryInfo.usedJSHeapSize + 'MB');
        addBreadcrumb('High memory usage detected', 'performance', memoryInfo);
      }
    }
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.marks.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Auto-report memory usage every 30 seconds
setInterval(() => {
  performanceMonitor.reportMemoryUsage();
}, 30000);