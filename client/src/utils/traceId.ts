import { v4 as uuidv4 } from 'uuid';

class TraceManager {
  private currentTraceId: string | null = null;
  private sessionTraceId: string;

  constructor() {
    // Generate a session-level trace ID
    this.sessionTraceId = uuidv4();
    this.logSessionStart();
  }

  // Generate a new trace ID for a request
  generateTraceId(): string {
    this.currentTraceId = uuidv4();
    return this.currentTraceId;
  }

  // Get current trace ID or generate one
  getTraceId(): string {
    if (!this.currentTraceId) {
      this.currentTraceId = uuidv4();
    }
    return this.currentTraceId;
  }

  // Get session trace ID
  getSessionTraceId(): string {
    return this.sessionTraceId;
  }

  // Clear current trace ID (for new operation)
  clearTraceId(): void {
    this.currentTraceId = null;
  }

  // Enhanced fetch with automatic trace ID injection
  async tracedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const traceId = this.generateTraceId();
    
    // Merge headers with trace ID
    const headers = {
      'X-Trace-ID': traceId,
      'X-Session-ID': this.sessionTraceId,
      ...options.headers
    };

    // Enhanced options with performance timing
    const enhancedOptions: RequestInit = {
      ...options,
      headers
    };

    const startTime = performance.now();
    
    try {
      const response = await fetch(url, enhancedOptions);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Log request details
      this.logRequest({
        traceId,
        method: options.method || 'GET',
        url,
        status: response.status,
        duration: Math.round(duration),
        success: response.ok
      });

      return response;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Log error details
      this.logError({
        traceId,
        method: options.method || 'GET',
        url,
        duration: Math.round(duration),
        error: error.message
      });

      throw error;
    }
  }

  // Log request details
  private logRequest(details: {
    traceId: string;
    method: string;
    url: string;
    status: number;
    duration: number;
    success: boolean;
  }): void {
    const logLevel = details.success ? 'info' : 'warn';
    const emoji = details.success ? '✅' : '⚠️';
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${emoji} API Request [${details.traceId}]`, {
        method: details.method,
        url: details.url,
        status: details.status,
        duration: `${details.duration}ms`,
        timestamp: new Date().toISOString()
      });
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendAnalytics('api_request', details);
    }
  }

  // Log error details
  private logError(details: {
    traceId: string;
    method: string;
    url: string;
    duration: number;
    error: string;
  }): void {
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ API Error [${details.traceId}]`, details);
    }

    // Send to error tracking in production
    if (process.env.NODE_ENV === 'production') {
      this.sendAnalytics('api_error', details);
    }
  }

  // Log session start
  private logSessionStart(): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 Session Started [${this.sessionTraceId}]`, {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Send analytics data
  private async sendAnalytics(eventType: string, data: any): Promise<void> {
    try {
      // Don't use tracedFetch here to avoid infinite loop
      await fetch('/api/analytics/trace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Trace-ID': this.getTraceId(),
          'X-Session-ID': this.sessionTraceId
        },
        body: JSON.stringify({
          eventType,
          data,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch (error) {
      // Silently fail analytics to not impact user experience
      console.warn('Failed to send trace analytics:', error);
    }
  }

  // Get trace context for manual logging
  getTraceContext(): { traceId: string; sessionId: string } {
    return {
      traceId: this.getTraceId(),
      sessionId: this.sessionTraceId
    };
  }

  // Performance mark with trace context
  mark(name: string, metadata?: any): void {
    try {
      performance.mark(name);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Performance Mark [${this.getTraceId()}]: ${name}`, metadata);
      }
    } catch (error) {
      console.warn('Failed to create performance mark:', error);
    }
  }

  // Performance measure with trace context
  measure(name: string, startMark: string, endMark?: string): number | null {
    try {
      const actualEndMark = endMark || `${startMark}-end`;
      
      if (!performance.getEntriesByName(actualEndMark).length) {
        this.mark(actualEndMark);
      }

      performance.measure(name, startMark, actualEndMark);
      
      const entries = performance.getEntriesByName(name, 'measure');
      const lastEntry = entries[entries.length - 1];
      const duration = lastEntry ? lastEntry.duration : null;

      if (process.env.NODE_ENV === 'development' && duration) {
        console.log(`⏱️ Performance Measure [${this.getTraceId()}]: ${name} = ${duration.toFixed(2)}ms`);
      }

      return duration;
    } catch (error) {
      console.warn('Failed to create performance measure:', error);
      return null;
    }
  }
}

// Create singleton instance
export const traceManager = new TraceManager();

// Enhanced API client with automatic tracing
export const apiRequest = async (method: string, url: string, data?: any): Promise<Response> => {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  return traceManager.tracedFetch(url, options);
};

export default traceManager;