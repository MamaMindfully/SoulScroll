export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('authToken');

  if (!token) {
    console.error('No token found. Redirecting to login.');
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
      console.error('Unauthorized: Token expired.');
      localStorage.removeItem('authToken');
      window.location.href = '/login';
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API error:', error);
    return null;
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