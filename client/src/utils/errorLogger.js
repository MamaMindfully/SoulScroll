import { useUser } from '@/hooks/useUser';

export async function errorLogger({ 
  type = 'frontend', 
  message, 
  stack, 
  userId = null,
  context = {}
}) {
  try {
    const errorData = {
      type,
      message: message || 'Unknown error',
      stack: stack || '',
      userId: userId || null,
      path: typeof window !== 'undefined' ? window.location?.pathname : null,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : null,
      timestamp: new Date().toISOString(),
      context: JSON.stringify(context)
    };

    // Try to send to backend
    const response = await fetch('/api/error-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData)
    });

    if (!response.ok) {
      // Fallback to console logging if backend fails
      console.error('Failed to log error to backend:', errorData);
    }

  } catch (logError) {
    // Final fallback - just console log
    console.error('Error logger failed:', logError);
    console.error('Original error:', { type, message, stack, userId, context });
  }
}

// React Error Boundary compatible logger
export function logReactError(error, errorInfo, userId = null) {
  errorLogger({
    type: 'react_error',
    message: error.message,
    stack: error.stack,
    userId,
    context: {
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    }
  });
}

// Promise rejection logger
export function setupGlobalErrorHandlers() {
  if (typeof window !== 'undefined') {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      errorLogger({
        type: 'unhandled_promise',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack || '',
        context: { reason: event.reason }
      });
    });

    // Catch global JavaScript errors
    window.addEventListener('error', (event) => {
      errorLogger({
        type: 'javascript_error',
        message: event.message,
        stack: event.error?.stack || '',
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });
  }
}

// API error logger helper
export function logAPIError(endpoint, error, context = {}) {
  errorLogger({
    type: 'api_error',
    message: `API Error at ${endpoint}: ${error.message}`,
    stack: error.stack,
    context: {
      endpoint,
      ...context
    }
  });
}

// Component error logger for try-catch blocks
export function useErrorLogger() {
  const { user } = useUser();
  
  return (error, context = {}) => {
    errorLogger({
      type: 'component_error',
      message: error.message,
      stack: error.stack,
      userId: user?.id,
      context
    });
  };
}