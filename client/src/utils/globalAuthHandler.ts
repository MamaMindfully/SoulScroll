// Global 401 authentication handler
let isRedirecting = false;

export function initializeGlobalAuthHandler() {
  // Intercept all fetch requests globally
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    
    // Handle 401 responses globally
    if (response.status === 401 && !isRedirecting) {
      console.warn('Global 401 detected. Session expired.');
      handleAuthExpiration();
    }
    
    return response;
  };

  // Listen for authentication errors from service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'AUTH_EXPIRED') {
        handleAuthExpiration();
      }
    });
  }
}

function handleAuthExpiration() {
  if (isRedirecting) return;
  
  isRedirecting = true;
  
  // Clear auth data
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  sessionStorage.clear();
  
  // Show user-friendly message
  console.log('Session expired:', 'Session expired');
  
  // Redirect to login after a brief delay
  setTimeout(() => {
    window.location.href = '/login';
  }, 1000);
}

// Export for manual triggering if needed
export { handleAuthExpiration };