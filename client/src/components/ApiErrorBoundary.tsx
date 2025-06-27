import React from 'react';
import { captureError } from '@/utils/errorCapture';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ApiErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ApiErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  component?: string;
}

export class ApiErrorBoundary extends React.Component<ApiErrorBoundaryProps, ApiErrorBoundaryState> {
  constructor(props: ApiErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ApiErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Capture error with context
    captureError(error, {
      component: this.props.component || 'ApiErrorBoundary',
      action: 'component_crash',
      metadata: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    }, 'high');

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertTriangle className="w-8 h-8 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-red-600 dark:text-red-400 text-center mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.resetError}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          
          {import.meta.env.DEV && this.state.errorInfo && (
            <details className="mt-4 w-full">
              <summary className="cursor-pointer text-xs text-red-500">
                Developer Details
              </summary>
              <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900 rounded text-xs overflow-auto">
                {this.state.error?.stack}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useErrorHandler(component?: string) {
  return React.useCallback((error: Error, action?: string, metadata?: Record<string, any>) => {
    captureError(error, {
      component,
      action,
      metadata
    }, 'medium');
  }, [component]);
}