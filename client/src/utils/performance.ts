class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private measurements: Array<{ name: string; duration: number; timestamp: Date }> = [];

  // Start a performance mark
  startMark(name: string): void {
    this.marks.set(name, performance.now());
  }

  // End a performance mark and record duration
  endMark(name: string): number {
    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`Performance mark '${name}' not found`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(name);

    this.measurements.push({
      name,
      duration,
      timestamp: new Date()
    });

    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  // Get performance statistics
  getStats(): any {
    const stats = {
      totalMeasurements: this.measurements.length,
      averageDuration: 0,
      slowestOperation: null as any,
      fastestOperation: null as any,
      recentMeasurements: this.measurements.slice(-10)
    };

    if (this.measurements.length > 0) {
      const durations = this.measurements.map(m => m.duration);
      stats.averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      stats.slowestOperation = this.measurements.reduce((slowest, current) => 
        current.duration > slowest.duration ? current : slowest
      );
      stats.fastestOperation = this.measurements.reduce((fastest, current) => 
        current.duration < fastest.duration ? current : fastest
      );
    }

    return stats;
  }

  // Clear old measurements (keep last 100)
  cleanup(): void {
    if (this.measurements.length > 100) {
      this.measurements = this.measurements.slice(-100);
    }
  }

  // Report Core Web Vitals
  reportWebVitals(): void {
    // Report LCP (Largest Contentful Paint)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Report FID (First Input Delay)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        console.log('FID:', entry.processingStart - entry.startTime);
      });
    }).observe({ entryTypes: ['first-input'] });

    // Report CLS (Cumulative Layout Shift)
    new PerformanceObserver((list) => {
      let clsValue = 0;
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      });
      console.log('CLS:', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Auto-cleanup every 5 minutes
setInterval(() => {
  performanceMonitor.cleanup();
}, 5 * 60 * 1000);

// Report web vitals on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    performanceMonitor.reportWebVitals();
  });
}