import { captureApiError, captureNetworkError, captureAuthError } from './errorCapture';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('authToken');

  if (!token) {
    const authError = new Error('No authentication token found');
    captureAuthError(authError, { apiEndpoint: endpoint, action: 'token_missing' });
    window.location.href = '/login';
    return null;
  }

  const authOptions = {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  try {
    const response = await fetch(endpoint, authOptions);

    if (response.status === 401) {
      const authError = new Error('Authentication token expired');
      captureAuthError(authError, { 
        apiEndpoint: endpoint, 
        action: 'token_expired',
        metadata: { statusCode: response.status }
      });
      localStorage.removeItem('authToken');
      window.location.href = '/login';
      return null;
    }

    if (!response.ok) {
      const apiError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      captureApiError(apiError, endpoint, { 
        action: 'http_error',
        metadata: { 
          statusCode: response.status,
          statusText: response.statusText 
        }
      });
      throw apiError;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      captureNetworkError(error as Error, { 
        apiEndpoint: endpoint,
        action: 'network_failure'
      });
    } else if (!(error as Error).message.includes('HTTP')) {
      // Don't double-capture HTTP errors
      captureApiError(error as Error, endpoint, { action: 'unexpected_error' });
    }
    
    throw error;
  }
}

// Enhanced fetch with retry and caching
export async function fetchWithRetry(endpoint: string, options: RequestInit = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(endpoint, options);
      if (response.ok) {
        return response;
      }
      
      if (response.status === 401) {
        console.error('Authentication failed');
        return response;
      }
      
      if (i === retries - 1) {
        throw new Error(`Failed after ${retries} attempts: ${response.statusText}`);
      }
    } catch (error) {
      if (i === retries - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}