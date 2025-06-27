// Global authentication handler for SoulScroll
// Provides centralized 401 error handling and session management

export function initializeGlobalAuthHandler() {
  console.log('Token from localStorage:', localStorage.getItem('authToken'));
  
  // Track authentication state
  let isHandlingAuth = false;
  
  // Override global fetch to handle 401 errors and add auth headers
  window.fetch = (originalFetch => {
    return (url, options = {}) => {
      // Add authentication header if token exists
      const token = localStorage.getItem('authToken');
      if (token && !options.headers?.Authorization) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
      }
      
      return originalFetch(url, options).then(response => {
        if (response.status === 401) {
          console.error('Global 401 detected. Session expired.');
          localStorage.removeItem('authToken'); // Clear invalid token
          window.dispatchEvent(new CustomEvent('authExpired', { 
            detail: { reason: 'API returned 401' } 
          }));
          
          // For production, redirect to login
          if (process.env.NODE_ENV === 'production') {
            window.location.href = '/login';
          }
        }
        return response;
      });
    };
  })(window.fetch);
  
  // Listen for auth expired events from global fetch wrapper
  window.addEventListener('authExpired', handleAuthExpiration);
  
  // Listen for manual logout events
  window.addEventListener('logout', handleLogout);
  
  function handleAuthExpiration(event) {
    if (isHandlingAuth) return; // Prevent duplicate handling
    isHandlingAuth = true;
    
    console.warn('Session expired:', event.detail?.reason || 'Unknown reason');
    
    // Clear all authentication data
    clearAuthState();
    
    // Show user-friendly notification
    showAuthExpiredNotification();
    
    // Reset handling flag after delay
    setTimeout(() => {
      isHandlingAuth = false;
    }, 1000);
  }
  
  function handleLogout() {
    clearAuthState();
    console.log('User logged out successfully');
  }
  
  function clearAuthState() {
    // Clear localStorage auth data
    const authKeys = [
      'authToken',
      'userId', 
      'isAuthenticated',
      'premiumStatus',
      'userProfile',
      'sessionData'
    ];
    
    authKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Emit state cleared event for components to react
    window.dispatchEvent(new CustomEvent('authStateCleared'));
  }
  
  function showAuthExpiredNotification() {
    // Create and show a user-friendly notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 300px;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="font-weight: 600;">Session Expired</div>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: none; border: none; color: white; cursor: pointer; margin-left: auto;">
          ×
        </button>
      </div>
      <div style="margin-top: 4px; opacity: 0.9;">
        Please refresh the page to continue
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }
  
  // Utility function to trigger logout
  function triggerLogout() {
    window.dispatchEvent(new CustomEvent('logout'));
  }
  
  // Utility function to check if user is authenticated
  function isAuthenticated() {
    return !!localStorage.getItem('userId') || !!localStorage.getItem('authToken');
  }
  
  // Export utilities for global use
  window.authHandler = {
    isAuthenticated,
    triggerLogout,
    clearAuthState
  };
  
  console.log('Global auth handler initialized');
}