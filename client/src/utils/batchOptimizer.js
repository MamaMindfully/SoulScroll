// Batch API call optimizer to prevent multiple response.json() calls and improve performance

export class BatchAPIOptimizer {
  constructor() {
    this.pendingRequests = new Map();
    this.responseCache = new Map();
    this.batchQueue = [];
    this.processingBatch = false;
  }

  // Safe fetch that stores response only once
  async safeFetch(url, options = {}) {
    const requestKey = `${options.method || 'GET'}:${url}`;
    
    // Return cached response if available
    if (this.responseCache.has(requestKey)) {
      return this.responseCache.get(requestKey);
    }

    // Return pending request if already in progress
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey);
    }

    // Create new request
    const requestPromise = this.executeRequest(url, options);
    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      
      // Cache successful responses for 30 seconds
      if (result.success) {
        this.responseCache.set(requestKey, result);
        setTimeout(() => this.responseCache.delete(requestKey), 30000);
      }
      
      return result;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  async executeRequest(url, options) {
    try {
      const response = await fetch(url, options);
      
      // Store response data immediately to prevent multiple calls
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          data: null
        };
      }

      return {
        success: true,
        data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  // Batch multiple API calls together
  async batchRequests(requests) {
    try {
      const promises = requests.map(({ url, options }) => 
        this.safeFetch(url, options)
      );
      
      const results = await Promise.all(promises);
      
      return {
        success: true,
        results,
        errors: results.filter(r => !r.success)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  // Debounced API calls for frequently called endpoints
  debounce(func, delay = 300) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Clear cache
  clearCache() {
    this.responseCache.clear();
    this.pendingRequests.clear();
  }
}

// Export singleton instance
export const batchOptimizer = new BatchAPIOptimizer();

// Helper functions for common patterns
export const safeFetch = (url, options) => batchOptimizer.safeFetch(url, options);
export const batchFetch = (requests) => batchOptimizer.batchRequests(requests);
export const debounceAPI = (func, delay) => batchOptimizer.debounce(func, delay);