import { useEffect, useCallback } from 'react';
import { useUser } from '@/store/userStore';

// Global auth handler for managing authentication state
export function useAuthHandler() {
  const { setUserId, setIsLoggedIn, clearUser } = useUser();

  const handleAuthExpired = useCallback(() => {
    console.warn('Authentication expired, clearing user session');
    clearUser();
    
    // Optional: Show notification to user
    const event = new CustomEvent('showNotification', {
      detail: {
        type: 'warning',
        message: 'Your session has expired. Please refresh the page.',
        duration: 5000
      }
    });
    window.dispatchEvent(event);
  }, [clearUser]);

  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/user', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUserId(userData.id);
        setIsLoggedIn(true);
        return true;
      } else if (response.status === 401) {
        handleAuthExpired();
        return false;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      return false;
    }
  }, [setUserId, setIsLoggedIn, handleAuthExpired]);

  const refreshAuth = useCallback(async () => {
    return await checkAuthStatus();
  }, [checkAuthStatus]);

  useEffect(() => {
    // Listen for auth expired events
    window.addEventListener('authExpired', handleAuthExpired);
    
    // Check auth status on mount
    checkAuthStatus();
    
    // Periodic auth check every 5 minutes
    const authCheckInterval = setInterval(checkAuthStatus, 5 * 60 * 1000);

    return () => {
      window.removeEventListener('authExpired', handleAuthExpired);
      clearInterval(authCheckInterval);
    };
  }, [handleAuthExpired, checkAuthStatus]);

  return {
    checkAuthStatus,
    refreshAuth,
    handleAuthExpired
  };
}

// Global fetch wrapper to handle 401s automatically
const originalFetch = window.fetch;
window.fetch = (...args) => {
  return originalFetch(...args).then(response => {
    if (response.status === 401) {
      console.warn('Global 401 detected. Session may have expired.');
      window.dispatchEvent(new CustomEvent('authExpired', {
        detail: { reason: 'Unauthorized response' }
      }));
    }
    return response;
  });
};