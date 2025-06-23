// Authentication utilities following the attached pattern

// Enhanced fetch with auth headers
export async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    console.warn('No auth token found. User may not be logged in.');
    // Don't fail completely, let the request proceed without auth
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Add auth token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      credentials: 'include', // Include cookies for session auth
      headers
    });

    if (response.status === 401) {
      console.warn('Unauthorized: Token may be expired or invalid.');
      handleAuthExpiration();
    }

    return response;
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
}

// Handle auth expiration
function handleAuthExpiration() {
  // Clear local auth state
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('isAuthenticated');
  
  // Emit custom event for components to handle
  window.dispatchEvent(new CustomEvent('authExpired', {
    detail: { reason: 'Session expired or invalid' }
  }));
  
  // Optional: Show user notification
  console.warn('Session expired. Please refresh the page.');
}

// Global fetch wrapper to handle 401s
const originalFetch = window.fetch;
window.fetch = (...args) => {
  return originalFetch(...args).then(response => {
    if (response.status === 401) {
      console.warn('Global 401 detected. Session may have expired.');
      handleAuthExpiration();
    }
    return response;
  });
};

// Auth status checker
export async function checkAuthStatus() {
  try {
    const response = await fetch('/api/auth/user', {
      credentials: 'include'
    });
    
    if (response.ok) {
      const userData = await response.json();
      return { authenticated: true, user: userData };
    } else {
      return { authenticated: false, user: null };
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    return { authenticated: false, user: null };
  }
}

// Initialize auth utilities
export function initAuthUtils() {
  // Listen for auth expired events
  window.addEventListener('authExpired', () => {
    console.log('Authentication expired - clearing user state');
  });
  
  // Periodic auth check (every 5 minutes)
  setInterval(async () => {
    const { authenticated } = await checkAuthStatus();
    if (!authenticated) {
      handleAuthExpiration();
    }
  }, 5 * 60 * 1000);
}