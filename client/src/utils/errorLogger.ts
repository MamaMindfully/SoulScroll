// Global error handling and logging
export const setupGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Import chunk error handler dynamically to avoid circular dependencies
    import('./chunkLoadErrorHandler').then(({ isChunkLoadError, handleChunkLoadError }) => {
      if (isChunkLoadError(event.reason)) {
        handleChunkLoadError(event.reason);
        event.preventDefault();
        return;
      }
    });

    logError({
      type: 'unhandledrejection',
      message: event.reason?.message || 'Unhandled promise rejection',
      stack: event.reason?.stack,
      path: window.location.pathname
    });
  });

  // Handle JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // Import chunk error handler dynamically
    import('./chunkLoadErrorHandler').then(({ isChunkLoadError, handleChunkLoadError }) => {
      if (isChunkLoadError(event.error) || isChunkLoadError({ message: event.message })) {
        handleChunkLoadError(event.error || { message: event.message });
        return;
      }
    });

    logError({
      type: 'javascript',
      message: event.message,
      stack: event.error?.stack,
      path: window.location.pathname,
      source: event.filename,
      line: event.lineno,
      column: event.colno
    });
  });
};

// Handle chunk loading errors by reloading the page
const handleChunkLoadError = (error: any) => {
  console.warn('Chunk load error detected, attempting recovery...', error);
  
  // Show user-friendly message before reload
  const userConfirmed = confirm(
    'The app needs to reload to get the latest version. Click OK to continue.'
  );
  
  if (userConfirmed) {
    // Clear any cached chunks and reload
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('assets') || cacheName.includes('js')) {
            caches.delete(cacheName);
          }
        });
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  }
};

// Log errors to backend
const logError = async (errorData: any) => {
  try {
    await fetch('/api/error-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...errorData,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        context: 'frontend'
      }),
    });
  } catch (err) {
    console.error('Failed to log error to backend:', err);
  }
};