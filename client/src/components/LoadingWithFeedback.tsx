import { AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface LoadingWithFeedbackProps {
  loading: boolean;
  slowLoading: boolean;
  error?: string | null;
  retrying?: boolean;
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LoadingWithFeedback({ 
  loading, 
  slowLoading, 
  error, 
  retrying = false,
  children,
  fallback
}: LoadingWithFeedbackProps) {
  // Show error state
  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
        <AlertCircle className="w-4 h-4 text-red-500" />
        <div className="text-sm text-red-700 dark:text-red-300">
          {error.includes('network') || error.includes('fetch') ? (
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4" />
              <span>Connection issue. Check your internet.</span>
            </div>
          ) : (
            error
          )}
          {retrying && <div className="text-xs opacity-75">Retrying...</div>}
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center gap-3 p-4">
        <div className="relative">
          <div className="w-5 h-5 border-2 border-blue-200 dark:border-blue-800 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin"></div>
          {slowLoading && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
          )}
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {slowLoading ? (
            <div className="space-y-1">
              <div>Taking longer than usual...</div>
              <div className="text-xs opacity-75 flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                Checking connection
              </div>
            </div>
          ) : (
            'Loading...'
          )}
        </div>
      </div>
    );
  }

  // Show content or fallback
  return <>{children || fallback}</>;
}

// Compact version for inline use
export function InlineLoadingFeedback({ 
  loading, 
  slowLoading, 
  error 
}: Pick<LoadingWithFeedbackProps, 'loading' | 'slowLoading' | 'error'>) {
  if (error) {
    return (
      <span className="inline-flex items-center gap-1 text-red-500 text-xs">
        <AlertCircle className="w-3 h-3" />
        Error
      </span>
    );
  }

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 text-gray-500 text-xs">
        <div className="w-3 h-3 border border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        {slowLoading ? 'Slow' : 'Loading'}
      </span>
    );
  }

  return null;
}