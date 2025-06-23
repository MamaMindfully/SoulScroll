// Safe fetch utility to prevent multiple response.json() calls
export const safeFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Store response in variable immediately to prevent multiple calls
    const data = await response.json();
    return { success: true, data, response };
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    return { success: false, error, data: null };
  }
};

// Batch fetch utility for multiple API calls
export const batchFetch = async (urls) => {
  try {
    const responses = await Promise.all(
      urls.map(url => fetch(url))
    );
    
    // Check all responses are OK
    const failedResponse = responses.find(r => !r.ok);
    if (failedResponse) {
      throw new Error(`HTTP ${failedResponse.status}: ${failedResponse.statusText}`);
    }
    
    // Call json() once per response
    const results = await Promise.all(
      responses.map(response => response.json())
    );
    
    return { success: true, results };
  } catch (error) {
    console.error('Batch fetch error:', error);
    return { success: false, error, results: [] };
  }
};

// Retry fetch utility for failed requests
export const retryFetch = async (url, options = {}, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await safeFetch(url, options);
    
    if (result.success) {
      return result;
    }
    
    if (attempt < maxRetries) {
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  return { success: false, error: new Error(`Failed after ${maxRetries} attempts`), data: null };
};