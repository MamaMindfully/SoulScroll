// Enhanced safe fetch utility with comprehensive error handling and optimizations

class SafeFetchManager {
  constructor() {
    this.cache = new Map();
    this.pending = new Map();
    this.retryDelays = [1000, 2000, 4000]; // Exponential backoff
  }

  async safeFetch(url, options = {}) {
    const requestKey = this.getRequestKey(url, options);
    
    // Return cached response if available and valid
    if (this.shouldUseCache(requestKey, options)) {
      return this.cache.get(requestKey).data;
    }
    
    // Return pending request if already in progress
    if (this.pending.has(requestKey)) {
      return this.pending.get(requestKey);
    }
    
    // Create new request with retry logic
    const requestPromise = this.executeWithRetry(url, options);
    this.pending.set(requestKey, requestPromise);
    
    try {
      const result = await requestPromise;
      
      // Cache successful responses
      if (result.success && options.cache !== false) {
        this.setCacheEntry(requestKey, result, options.cacheDuration);
      }
      
      return result;
    } finally {
      this.pending.delete(requestKey);
    }
  }

  async executeWithRetry(url, options, retryCount = 0) {
    try {
      return await this.executeRequest(url, options);
    } catch (error) {
      // Don't retry on client errors (4xx) except 408, 429
      const shouldRetry = this.shouldRetry(error, retryCount);
      
      if (shouldRetry) {
        const delay = this.retryDelays[retryCount] || 4000;
        await this.delay(delay);
        return this.executeWithRetry(url, options, retryCount + 1);
      }
      
      throw error;
    }
  }

  async executeRequest(url, options) {
    const controller = new AbortController();
    const timeout = options.timeout || 30000;
    
    // Set timeout
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);
      
      // Parse response based on content type
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType && contentType.includes('text/')) {
        data = await response.text();
      } else {
        data = await response.blob();
      }
      
      if (!response.ok) {
        throw new FetchError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          data
        );
      }
      
      return {
        success: true,
        data,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      };
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new FetchError('Request timeout', 408);
      }
      
      throw error;
    }
  }

  shouldRetry(error, retryCount) {
    if (retryCount >= this.retryDelays.length) return false;
    
    // Retry on network errors
    if (!error.status) return true;
    
    // Retry on specific HTTP status codes
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    return retryableStatuses.includes(error.status);
  }

  shouldUseCache(requestKey, options) {
    if (options.cache === false) return false;
    
    const entry = this.cache.get(requestKey);
    if (!entry) return false;
    
    const age = Date.now() - entry.timestamp;
    const maxAge = entry.cacheDuration || 300000; // 5 minutes default
    
    return age < maxAge;
  }

  setCacheEntry(requestKey, data, cacheDuration = 300000) {
    this.cache.set(requestKey, {
      data,
      timestamp: Date.now(),
      cacheDuration
    });
    
    // Clean up old entries
    if (this.cache.size > 100) {
      this.cleanupCache();
    }
  }

  cleanupCache() {
    const now = Date.now();
    const entriesToDelete = [];
    
    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.cacheDuration) {
        entriesToDelete.push(key);
      }
    }
    
    entriesToDelete.forEach(key => this.cache.delete(key));
  }

  getRequestKey(url, options) {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  clearCache() {
    this.cache.clear();
    this.pending.clear();
  }
}

// Custom error class for better error handling
class FetchError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'FetchError';
    this.status = status;
    this.data = data;
  }
}

// Singleton instance
const safeFetchManager = new SafeFetchManager();

// Main export function
export async function safeFetch(url, options = {}) {
  return safeFetchManager.safeFetch(url, options);
}

// Convenience methods for common HTTP verbs
export async function safeGet(url, options = {}) {
  return safeFetch(url, { ...options, method: 'GET' });
}

export async function safePost(url, data, options = {}) {
  return safeFetch(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function safePut(url, data, options = {}) {
  return safeFetch(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function safeDelete(url, options = {}) {
  return safeFetch(url, { ...options, method: 'DELETE' });
}

// Batch requests utility
export async function batchRequests(requests) {
  try {
    const promises = requests.map(({ url, options }) => 
      safeFetch(url, options).catch(error => ({ error, url }))
    );
    
    const results = await Promise.all(promises);
    
    return {
      success: true,
      results,
      errors: results.filter(r => r.error)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      results: []
    };
  }
}

// React hook for safe fetch
export function useSafeFetch() {
  return {
    safeFetch,
    safeGet,
    safePost,
    safePut,
    safeDelete,
    batchRequests,
    clearCache: () => safeFetchManager.clearCache()
  };
}

// Export error class and manager for advanced usage
export { FetchError, safeFetchManager };