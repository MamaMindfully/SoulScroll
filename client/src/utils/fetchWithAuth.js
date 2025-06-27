// Enhanced API utility with authentication handling
export async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem('authToken');

  if (!token && endpoint.startsWith('/api/') && !endpoint.includes('/auth/')) {
    console.error('No auth token found for protected endpoint:', endpoint);
    window.dispatchEvent(new CustomEvent('authExpired'));
    return null;
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers
    });

    if (response.status === 401) {
      console.error('Unauthorized request. Clearing auth state.');
      localStorage.removeItem('authToken');
      window.dispatchEvent(new CustomEvent('authExpired'));
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return response;
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
}

// Utility for authenticated API calls with retry logic
export async function apiCall(endpoint, options = {}, retries = 1) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetchWithAuth(endpoint, options);
    } catch (error) {
      if (i === retries) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}

// Helper for common HTTP methods
export const api = {
  get: (url, options = {}) => fetchWithAuth(url, { ...options, method: 'GET' }),
  post: (url, data, options = {}) => fetchWithAuth(url, { 
    ...options, 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  put: (url, data, options = {}) => fetchWithAuth(url, { 
    ...options, 
    method: 'PUT', 
    body: JSON.stringify(data) 
  }),
  delete: (url, options = {}) => fetchWithAuth(url, { ...options, method: 'DELETE' }),
  patch: (url, data, options = {}) => fetchWithAuth(url, { 
    ...options, 
    method: 'PATCH', 
    body: JSON.stringify(data) 
  })
};