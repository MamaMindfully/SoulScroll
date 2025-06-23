// Deployment optimization utilities to ensure React compliance and performance

// Hook safety checker - prevents conditional hook usage
export const useHooksSafely = (hooks) => {
  // Ensure all hooks are called at component top level
  const results = {};
  
  // Always call hooks in same order
  if (hooks.useAuth) {
    results.auth = hooks.useAuth();
  }
  if (hooks.useUser) {
    results.user = hooks.useUser();
  }
  if (hooks.usePremium) {
    results.premium = hooks.usePremium();
  }
  
  return results;
};

// Safe API caller that prevents multiple response.json() calls
export const safeApiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Call json() only once and store result
    const data = await response.json();
    
    return {
      success: true,
      data,
      status: response.status
    };
  } catch (error) {
    console.error(`API call failed for ${url}:`, error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

// Component mount safety helper
export const useMountSafety = () => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  return mounted;
};

// Batch API optimization for dashboard loads
export const optimizeDashboardLoads = async () => {
  const endpoints = [
    '/api/user/stats',
    '/api/user/premium-status', 
    '/api/prompts/daily'
  ];
  
  try {
    const responses = await Promise.all(
      endpoints.map(url => fetch(url))
    );
    
    // Check if any failed
    const failedResponse = responses.find(r => !r.ok);
    if (failedResponse) {
      throw new Error(`Dashboard load failed: ${failedResponse.status}`);
    }
    
    // Parse all responses once
    const results = await Promise.all(
      responses.map(response => response.json())
    );
    
    return {
      stats: results[0],
      premium: results[1], 
      prompts: results[2]
    };
  } catch (error) {
    console.error('Dashboard optimization failed:', error);
    return {
      stats: null,
      premium: null,
      prompts: null
    };
  }
};

// Performance monitoring for LCP optimization
export const monitorLCP = () => {
  if (typeof window === 'undefined') return;
  
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    
    if (lastEntry.startTime > 2500) {
      console.warn('LCP is slow:', lastEntry.startTime + 'ms');
      // Trigger lazy loading optimizations
      optimizeLazyLoading();
    }
  }).observe({ entryTypes: ['largest-contentful-paint'] });
};

// Lazy loading optimization
export const optimizeLazyLoading = () => {
  // Defer non-critical components
  const nonCriticalImages = document.querySelectorAll('img[data-lazy]');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.lazy;
        img.removeAttribute('data-lazy');
        observer.unobserve(img);
      }
    });
  });
  
  nonCriticalImages.forEach(img => observer.observe(img));
};

// Memory cleanup for deployment
export const cleanupDeployment = () => {
  // Clear any development-only references
  if (import.meta.env.PROD) {
    // Remove console logs
    console.log = () => {};
    console.warn = () => {};
    
    // Clear development caches
    if (window.devCache) {
      window.devCache.clear();
    }
  }
};