// Enhanced API utility with comprehensive auth handling and session management
export async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem('authToken');

  if (!token) {
    console.warn('No auth token found. User may not be logged in.');
    // Don't completely fail - let the request proceed for public endpoints
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
      credentials: 'include', // Include session cookies
      headers
    });

    if (response.status === 401) {
      console.warn('Unauthorized: Session may have expired.');
      handleAuthExpiration();
      throw new Error('Authentication required');
    }

    // Return the full response for flexibility
    return response;
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
}

// Helper for JSON responses
export async function fetchWithAuthJSON(endpoint, options = {}) {
  const response = await fetchWithAuth(endpoint, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return await response.json();
}

// Helper for POST requests
export async function postWithAuth(endpoint, data, options = {}) {
  return fetchWithAuth(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// Helper for PUT requests
export async function putWithAuth(endpoint, data, options = {}) {
  return fetchWithAuth(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

// Helper for DELETE requests
export async function deleteWithAuth(endpoint, options = {}) {
  return fetchWithAuth(endpoint, {
    ...options,
    method: 'DELETE'
  });
}

// Handle authentication expiration
function handleAuthExpiration() {
  // Clear local auth state
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('isAuthenticated');
  
  // Emit custom event for components to handle
  window.dispatchEvent(new CustomEvent('authExpired', {
    detail: { reason: 'Session expired or invalid' }
  }));
  
  // Optional: Redirect to login (uncomment if needed)
  // window.location.href = '/login';
}