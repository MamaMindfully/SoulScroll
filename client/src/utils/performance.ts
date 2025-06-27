/**
 * Performance monitoring utilities for SoulScroll AI
 * Tracks user timing marks and measures for optimization
 */

interface PerformanceMark {
  name: string;
  timestamp: number;
  metadata?: any;
}

interface PerformanceMeasure {
  name: string;
  startMark: string;
  endMark: string;
  duration: number;
  metadata?: any;
}

class PerformanceMonitor {
  private marks: Map<string, PerformanceMark> = new Map();
  private measures: PerformanceMeasure[] = [];
  private enabled: boolean;

  constructor() {
    this.enabled = 'performance' in window && typeof performance.mark === 'function';
  }

  // Mark a performance point
  mark(name: string, metadata?: any): void {
    if (!this.enabled) return;

    try {
      performance.mark(name);
      
      this.marks.set(name, {
        name,
        timestamp: performance.now(),
        metadata
      });

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Performance Mark: ${name}`, metadata);
      }
    } catch (error) {
      console.warn('Failed to create performance mark:', error);
    }
  }

  // Measure time between two marks
  measure(name: string, startMark: string, endMark?: string): number | null {
    if (!this.enabled) return null;

    try {
      const actualEndMark = endMark || `${startMark}-end`;
      
      // Create end mark if it doesn't exist
      if (!this.marks.has(actualEndMark)) {
        this.mark(actualEndMark);
      }

      performance.measure(name, startMark, actualEndMark);
      
      const startTime = this.marks.get(startMark)?.timestamp || 0;
      const endTime = this.marks.get(actualEndMark)?.timestamp || 0;
      const duration = endTime - startTime;

      const measure: PerformanceMeasure = {
        name,
        startMark,
        endMark: actualEndMark,
        duration,
        metadata: {
          startMetadata: this.marks.get(startMark)?.metadata,
          endMetadata: this.marks.get(actualEndMark)?.metadata
        }
      };

      this.measures.push(measure);

      // Log slow operations
      if (duration > 1000) { // > 1 second
        console.warn(`⚠️ Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
      } else if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️ Performance Measure: ${name} = ${duration.toFixed(2)}ms`);
      }

      return duration;
    } catch (error) {
      console.warn('Failed to create performance measure:', error);
      return null;
    }
  }

  // Get all performance data
  getPerformanceData(): {
    marks: PerformanceMark[];
    measures: PerformanceMeasure[];
    navigation?: PerformanceNavigationTiming;
  } {
    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      marks: Array.from(this.marks.values()),
      measures: this.measures,
      navigation: navigationTiming
    };
  }

  // Clear all performance data
  clear(): void {
    if (!this.enabled) return;

    try {
      performance.clearMarks();
      performance.clearMeasures();
      this.marks.clear();
      this.measures = [];
    } catch (error) {
      console.warn('Failed to clear performance data:', error);
    }
  }

  // Get performance insights
  getInsights(): any {
    const data = this.getPerformanceData();
    
    return {
      totalMarks: data.marks.length,
      totalMeasures: data.measures.length,
      slowestOperation: data.measures.reduce((slowest, current) => 
        current.duration > (slowest?.duration || 0) ? current : slowest, null),
      averageDuration: data.measures.length > 0 
        ? data.measures.reduce((sum, m) => sum + m.duration, 0) / data.measures.length 
        : 0,
      navigationTiming: data.navigation ? {
        domContentLoaded: data.navigation.domContentLoadedEventEnd - data.navigation.domContentLoadedEventStart,
        loadComplete: data.navigation.loadEventEnd - data.navigation.loadEventStart,
        totalPageLoad: data.navigation.loadEventEnd - data.navigation.fetchStart
      } : null
    };
  }

  // Send performance data to analytics
  async sendAnalytics(): Promise<void> {
    if (process.env.NODE_ENV !== 'production') return;

    try {
      const insights = this.getInsights();
      
      // Only send if we have meaningful data
      if (insights.totalMeasures === 0) return;

      // Send to your analytics endpoint
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          insights,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
          url: window.location.pathname
        })
      });
    } catch (error) {
      console.warn('Failed to send performance analytics:', error);
    }
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Journal-specific performance tracking
export const journalPerformance = {
  // Track journal entry creation flow
  startJournalEntry: () => {
    performanceMonitor.mark('journal-entry-start', {
      action: 'start_writing',
      timestamp: Date.now()
    });
  },

  entrySubmitted: () => {
    performanceMonitor.mark('journal-entry-submit', {
      action: 'submit_entry',
      timestamp: Date.now()
    });
    
    return performanceMonitor.measure(
      'journal-entry-time',
      'journal-entry-start',
      'journal-entry-submit'
    );
  },

  aiAnalysisStart: () => {
    performanceMonitor.mark('ai-analysis-start', {
      action: 'ai_analysis_start',
      timestamp: Date.now()
    });
  },

  aiAnalysisComplete: () => {
    performanceMonitor.mark('ai-analysis-complete', {
      action: 'ai_analysis_complete',
      timestamp: Date.now()
    });
    
    return performanceMonitor.measure(
      'ai-analysis-time',
      'ai-analysis-start',
      'ai-analysis-complete'
    );
  },

  // Track page navigation
  startPageLoad: (pageName: string) => {
    performanceMonitor.mark(`page-load-start-${pageName}`, {
      page: pageName,
      action: 'page_load_start'
    });
  },

  pageLoadComplete: (pageName: string) => {
    performanceMonitor.mark(`page-load-complete-${pageName}`, {
      page: pageName,
      action: 'page_load_complete'
    });
    
    return performanceMonitor.measure(
      `page-load-time-${pageName}`,
      `page-load-start-${pageName}`,
      `page-load-complete-${pageName}`
    );
  },

  // Track user interactions
  trackInteraction: (interaction: string, metadata?: any) => {
    performanceMonitor.mark(`interaction-${interaction}`, {
      interaction,
      ...metadata,
      timestamp: Date.now()
    });
  }
};

// Web Vitals tracking
export const trackWebVitals = () => {
  if (!('PerformanceObserver' in window)) return;

  // Track Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      performanceMonitor.mark('lcp', {
        value: lastEntry.startTime,
        element: lastEntry.element?.tagName || 'unknown'
      });
    });
    
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (error) {
    console.warn('LCP observer failed:', error);
  }

  // Track First Input Delay (FID)
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        performanceMonitor.mark('fid', {
          value: entry.processingStart - entry.startTime,
          eventType: entry.name
        });
      });
    });
    
    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch (error) {
    console.warn('FID observer failed:', error);
  }

  // Track Cumulative Layout Shift (CLS)
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      
      performanceMonitor.mark('cls', {
        value: clsValue
      });
    });
    
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (error) {
    console.warn('CLS observer failed:', error);
  }
};

// Initialize performance tracking
export const initPerformanceTracking = () => {
  // Track initial page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      performanceMonitor.mark('dom-content-loaded');
    });
  } else {
    performanceMonitor.mark('dom-content-loaded');
  }

  // Track when page is fully loaded
  if (document.readyState === 'complete') {
    performanceMonitor.mark('page-load-complete');
  } else {
    window.addEventListener('load', () => {
      performanceMonitor.mark('page-load-complete');
      performanceMonitor.measure('total-page-load', 'navigationStart', 'page-load-complete');
    });
  }

  // Start Web Vitals tracking
  trackWebVitals();

  // Send analytics on page unload
  window.addEventListener('beforeunload', () => {
    performanceMonitor.sendAnalytics();
  });

  // Send analytics every 30 seconds for long sessions
  setInterval(() => {
    performanceMonitor.sendAnalytics();
  }, 30000);
};

export default performanceMonitor;