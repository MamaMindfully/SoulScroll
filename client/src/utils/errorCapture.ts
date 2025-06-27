// Granular error capture and reporting system
interface ErrorContext {
  userId?: string;
  path?: string;
  component?: string;
  apiEndpoint?: string;
  action?: string;
  metadata?: Record<string, any>;
}

interface CapturedError {
  message: string;
  stack?: string;
  type: 'javascript' | 'api' | 'network' | 'validation' | 'auth';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: ErrorContext;
  timestamp: number;
  userAgent: string;
}

class ErrorCapture {
  private errors: CapturedError[] = [];
  private maxErrors = 50;
  private apiEndpoint = '/api/error-logs';

  // Capture different types of errors with context
  captureError(error: Error | string, context: ErrorContext = {}, severity: CapturedError['severity'] = 'medium') {
    const capturedError: CapturedError = {
      message: typeof error === 'string' ? error : error.message,
      stack: error instanceof Error ? error.stack : undefined,
      type: this.determineErrorType(error, context),
      severity,
      context: {
        path: window.location.pathname,
        ...context
      },
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    };

    this.addError(capturedError);
    this.reportError(capturedError);

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Captured Error:', capturedError);
    }
  }

  // Specific capture methods for different error types
  captureApiError(error: Error, endpoint: string, context: Partial<ErrorContext> = {}) {
    this.captureError(error, {
      ...context,
      apiEndpoint: endpoint,
      type: 'api'
    }, 'high');
  }

  captureNetworkError(error: Error, context: Partial<ErrorContext> = {}) {
    this.captureError(error, {
      ...context,
      type: 'network'
    }, 'high');
  }

  captureValidationError(error: Error | string, component: string, context: Partial<ErrorContext> = {}) {
    this.captureError(error, {
      ...context,
      component,
      type: 'validation'
    }, 'low');
  }

  captureAuthError(error: Error, context: Partial<ErrorContext> = {}) {
    this.captureError(error, {
      ...context,
      type: 'auth'
    }, 'critical');
  }

  private determineErrorType(error: Error | string, context: ErrorContext): CapturedError['type'] {
    if (context.type) return context.type as CapturedError['type'];
    
    const message = typeof error === 'string' ? error : error.message;
    
    if (message.includes('401') || message.includes('unauthorized') || message.includes('authentication')) {
      return 'auth';
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network';
    }
    if (context.apiEndpoint || message.includes('api')) {
      return 'api';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }
    
    return 'javascript';
  }

  private addError(error: CapturedError) {
    this.errors.unshift(error);
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Store in localStorage for persistence
    try {
      localStorage.setItem('soulscroll_errors', JSON.stringify(this.errors.slice(0, 10)));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  private async reportError(error: CapturedError) {
    // Only report high and critical errors to backend
    if (error.severity === 'low' || error.severity === 'medium') {
      return;
    }

    try {
      await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: `${error.type}_error`,
          message: error.message,
          stack: error.stack,
          userId: error.context.userId,
          path: error.context.path,
          userAgent: error.userAgent,
          metadata: {
            severity: error.severity,
            component: error.context.component,
            apiEndpoint: error.context.apiEndpoint,
            action: error.context.action,
            ...error.context.metadata
          }
        })
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  // Get recent errors for debugging
  getRecentErrors(limit = 10): CapturedError[] {
    return this.errors.slice(0, limit);
  }

  // Clear stored errors
  clearErrors() {
    this.errors = [];
    localStorage.removeItem('soulscroll_errors');
  }

  // Get error summary for analytics
  getErrorSummary() {
    const summary = {
      total: this.errors.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      recent: this.errors.slice(0, 5)
    };

    this.errors.forEach(error => {
      summary.byType[error.type] = (summary.byType[error.type] || 0) + 1;
      summary.bySeverity[error.severity] = (summary.bySeverity[error.severity] || 0) + 1;
    });

    return summary;
  }
}

// Create singleton instance
export const errorCapture = new ErrorCapture();

// Convenience export functions
export const captureError = errorCapture.captureError.bind(errorCapture);
export const captureApiError = errorCapture.captureApiError.bind(errorCapture);
export const captureNetworkError = errorCapture.captureNetworkError.bind(errorCapture);
export const captureValidationError = errorCapture.captureValidationError.bind(errorCapture);
export const captureAuthError = errorCapture.captureAuthError.bind(errorCapture);

// Initialize global error handlers
if (typeof window !== 'undefined') {
  // Capture unhandled errors
  window.addEventListener('error', (event) => {
    errorCapture.captureError(
      new Error(event.message),
      {
        component: 'global',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      },
      'high'
    );
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorCapture.captureError(
      new Error(event.reason),
      {
        component: 'promise',
        metadata: {
          reason: event.reason
        }
      },
      'high'
    );
  });
}