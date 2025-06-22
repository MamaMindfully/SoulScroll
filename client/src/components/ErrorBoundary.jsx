import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logReactError } from '@/utils/errorLogger';
import { useUser } from '@/hooks/useUser';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log the error
    logReactError(error, errorInfo, this.props.userId);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error}
          resetError={() => this.setState({ hasError: false, error: null, errorInfo: null })}
          {...this.props}
        />
      );
    }

    return this.props.children;
  }
}

function ErrorFallback({ error, resetError, fallbackComponent }) {
  const { user } = useUser();

  if (fallbackComponent) {
    return fallbackComponent;
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center bg-gradient-to-br from-red-900/20 to-red-800/20 rounded-xl border border-red-500/30 p-8">
      <div className="text-center max-w-md">
        <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        
        <h2 className="text-2xl font-bold text-white mb-2">
          Something went wrong
        </h2>
        
        <p className="text-red-200 mb-6">
          {error?.message || 'An unexpected error occurred. The issue has been logged and we\'re working on it.'}
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={resetError}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-6 text-left">
            <summary className="text-red-300 cursor-pointer text-sm">
              Error Details (Development)
            </summary>
            <pre className="mt-2 text-xs text-red-200 bg-red-900/30 p-3 rounded overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

// Wrapper component with user context
export default function ErrorBoundaryWrapper({ children, fallbackComponent }) {
  const { user } = useUser();
  
  return (
    <ErrorBoundary userId={user?.id} fallbackComponent={fallbackComponent}>
      {children}
    </ErrorBoundary>
  );
}

// Higher-order component for wrapping components
export function withErrorBoundary(Component, fallbackComponent = null) {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundaryWrapper fallbackComponent={fallbackComponent}>
        <Component {...props} />
      </ErrorBoundaryWrapper>
    );
  };
}