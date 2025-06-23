// Comprehensive chunk load error handling for production deployments

export const handleChunkLoadError = (error: any) => {
  console.warn('Chunk load error detected:', error);
  
  // Clear application cache to force fresh asset reload
  const clearAppCache = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName.includes('assets') || 
                cacheName.includes('js') || 
                cacheName.includes('workbox')) {
              return caches.delete(cacheName);
            }
          })
        );
      } catch (err) {
        console.warn('Failed to clear caches:', err);
      }
    }
  };

  // Show user-friendly reload prompt
  const showReloadPrompt = () => {
    const message = `The app has been updated with new features. Please reload to get the latest version.`;
    
    if (confirm(message)) {
      clearAppCache().then(() => {
        window.location.reload();
      });
    }
  };

  // Auto-reload for critical chunk errors
  const autoReload = () => {
    clearAppCache().then(() => {
      window.location.reload();
    });
  };

  // Determine if this is a critical error requiring immediate reload
  const isCriticalError = error?.message?.includes('Loading chunk') ||
                         error?.name === 'ChunkLoadError' ||
                         error?.code === 'CHUNK_LOAD_FAILED';

  if (isCriticalError) {
    // Show loading state briefly then auto-reload
    setTimeout(autoReload, 1500);
  } else {
    // For non-critical errors, show user prompt
    showReloadPrompt();
  }
};

// Enhanced error detection for various chunk load scenarios
export const isChunkLoadError = (error: any): boolean => {
  if (!error) return false;
  
  const indicators = [
    'Loading chunk',
    'ChunkLoadError',
    'CHUNK_LOAD_FAILED',
    'Failed to fetch dynamically imported module',
    'Loading CSS chunk',
    'net::ERR_ABORTED'
  ];
  
  return indicators.some(indicator => 
    error.name?.includes(indicator) ||
    error.message?.includes(indicator) ||
    error.code?.includes(indicator)
  );
};