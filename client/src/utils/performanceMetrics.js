// Performance metrics collection for SoulScroll
// Tracks user experience metrics and application performance

class PerformanceMetrics {
  constructor() {
    this.metrics = new Map();
    this.isEnabled = true;
    this.startTime = performance.now();
    this.initialize();
  }

  initialize() {
    // Web Vitals tracking
    this.observePageLoad();
    this.observeInteractions();
    this.observeNetworkRequests();
    
    // App-specific metrics
    this.trackJournalMetrics();
    this.trackAuthenticationMetrics();
  }

  observePageLoad() {
    if (window.PerformanceObserver) {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('lcp', entry.startTime, 'ms');
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('fid', entry.processingStart - entry.startTime, 'ms');
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.recordMetric('cls', clsValue, 'score');
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  observeInteractions() {
    // Track button clicks and interactions
    document.addEventListener('click', (event) => {
      const target = event.target.closest('[data-testid]');
      if (target) {
        const testId = target.getAttribute('data-testid');
        this.recordInteraction(testId, 'click');
      }
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (form.tagName === 'FORM') {
        this.recordInteraction('form-submission', 'submit');
      }
    });
  }

  observeNetworkRequests() {
    if (window.PerformanceObserver) {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.includes('/api/')) {
            this.recordMetric('api-request', entry.responseEnd - entry.requestStart, 'ms', {
              endpoint: entry.name,
              status: entry.responseStatus || 'unknown'
            });
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
    }
  }

  trackJournalMetrics() {
    // Track journal writing sessions
    let journalStartTime = null;
    let wordCount = 0;

    document.addEventListener('focus', (event) => {
      if (event.target.matches('[data-testid="journal-textarea"]')) {
        journalStartTime = performance.now();
      }
    }, true);

    document.addEventListener('blur', (event) => {
      if (event.target.matches('[data-testid="journal-textarea"]') && journalStartTime) {
        const duration = performance.now() - journalStartTime;
        const words = event.target.value.trim().split(/\s+/).length;
        
        this.recordMetric('journal-session', duration, 'ms', {
          wordCount: words,
          wordsPerMinute: Math.round((words / duration) * 60000)
        });
        
        journalStartTime = null;
      }
    }, true);
  }

  trackAuthenticationMetrics() {
    // Track authentication flows
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const response = await originalFetch(...args);
      const duration = performance.now() - startTime;
      
      if (args[0].includes('/api/auth/')) {
        this.recordMetric('auth-request', duration, 'ms', {
          endpoint: args[0],
          status: response.status,
          success: response.ok
        });
      }
      
      return response;
    };
  }

  recordMetric(name, value, unit = '', metadata = {}) {
    if (!this.isEnabled) return;

    const timestamp = Date.now();
    const metricEntry = {
      name,
      value,
      unit,
      timestamp,
      metadata,
      sessionId: this.getSessionId()
    };

    // Store in memory
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name).push(metricEntry);

    // Send to analytics if configured
    this.sendToAnalytics(metricEntry);

    // Log performance warnings
    this.checkPerformanceThresholds(name, value);
  }

  recordInteraction(element, action) {
    this.recordMetric('user-interaction', 1, 'count', {
      element,
      action,
      timestamp: Date.now()
    });
  }

  checkPerformanceThresholds(name, value) {
    const thresholds = {
      'lcp': 2500, // 2.5s
      'fid': 100,  // 100ms
      'cls': 0.1,  // 0.1 score
      'api-request': 1000, // 1s
      'journal-session': 300000 // 5 minutes
    };

    if (thresholds[name] && value > thresholds[name]) {
      console.warn(`Performance threshold exceeded for ${name}: ${value} > ${thresholds[name]}`);
    }
  }

  sendToAnalytics(metric) {
    // Send to your analytics service
    if (window.gtag) {
      window.gtag('event', 'performance_metric', {
        custom_parameter_1: metric.name,
        custom_parameter_2: metric.value,
        custom_parameter_3: metric.unit
      });
    }
  }

  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = Math.random().toString(36).substring(2, 15);
    }
    return this.sessionId;
  }

  getMetrics(name) {
    return this.metrics.get(name) || [];
  }

  getAllMetrics() {
    const allMetrics = {};
    for (const [name, values] of this.metrics) {
      allMetrics[name] = values;
    }
    return allMetrics;
  }

  getSummary() {
    const summary = {};
    for (const [name, values] of this.metrics) {
      if (values.length > 0) {
        const numericValues = values.map(v => v.value).filter(v => typeof v === 'number');
        if (numericValues.length > 0) {
          summary[name] = {
            count: values.length,
            avg: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
            min: Math.min(...numericValues),
            max: Math.max(...numericValues),
            unit: values[0].unit
          };
        }
      }
    }
    return summary;
  }

  reset() {
    this.metrics.clear();
    this.startTime = performance.now();
  }

  disable() {
    this.isEnabled = false;
  }

  enable() {
    this.isEnabled = true;
  }
}

// Export singleton instance
export const performanceMetrics = new PerformanceMetrics();

// Initialize performance tracking
if (typeof window !== 'undefined') {
  window.soulScrollMetrics = performanceMetrics;
  
  // Report summary on page unload
  window.addEventListener('beforeunload', () => {
    const summary = performanceMetrics.getSummary();
    console.log('SoulScroll Performance Summary:', summary);
  });
}