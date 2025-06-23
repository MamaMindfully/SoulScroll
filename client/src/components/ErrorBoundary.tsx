import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Check if it's a ChunkLoadError
    import('../utils/chunkLoadErrorHandler').then(({ isChunkLoadError, handleChunkLoadError }) => {
      if (isChunkLoadError(error)) {
        handleChunkLoadError(error);
        return;
      }
    });

    // Log error to backend
    this.logError(error, errorInfo);
  }

  handleChunkLoadError = () => {
    // Auto-reload for chunk errors after a brief delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  logError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      await fetch('/api/error-logs', {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'react-error-boundary',
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          path: window.location.pathname,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        }),
      });
    } catch (err) {
      console.error('Failed to log error:', err);
    }
  };

  render() {
    if (this.state.hasError) {
      // Check if it's a ChunkLoadError - show loading state
      const isChunkError = this.state.error?.name === 'ChunkLoadError' || 
                          this.state.error?.message?.includes('Loading chunk') ||
                          this.state.error?.message?.includes('Failed to fetch');
      
      if (isChunkError) {
        return (
          <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-6">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white">Updating app, please wait...</p>
              <p className="text-gray-400 text-sm mt-2">Loading latest version...</p>
            </div>
          </div>
        );
      }

      // Custom fallback or default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-6">
          <div className="text-center max-w-lg">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-6" />
            
            <h1 className="text-3xl font-bold text-white mb-4">
              Something went wrong
            </h1>
            
            <p className="text-gray-400 text-lg mb-8">
              An unexpected error occurred. Don't worry, your data is safe.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                <Home className="w-5 h-5" />
                Go Home
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="mt-8 text-left bg-gray-900/50 rounded-lg p-4">
                <summary className="text-orange-400 cursor-pointer mb-2">
                  Error Details (Dev Mode)
                </summary>
                <pre className="text-red-300 text-xs overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;