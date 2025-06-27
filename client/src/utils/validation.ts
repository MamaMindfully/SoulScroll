// Frontend validation utilities for Luma app
// Validates user input, tokens, and state before routing or API calls

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// User authentication validation
export const validateAuth = (user: any, token?: string): ValidationResult => {
  console.log('Validating authentication state...');
  
  if (!user) {
    console.warn('Validation failed: No user object');
    return { isValid: false, error: 'User not authenticated' };
  }
  
  if (!user.id) {
    console.warn('Validation failed: No user ID');
    return { isValid: false, error: 'Invalid user data' };
  }
  
  if (token && typeof token !== 'string') {
    console.warn('Validation failed: Invalid token format');
    return { isValid: false, error: 'Invalid token format' };
  }
  
  console.log('Authentication validation passed');
  return { isValid: true };
};

// Journal entry validation
export const validateJournalEntry = (content: string): ValidationResult => {
  console.log('Validating journal entry...');
  
  if (!content || typeof content !== 'string') {
    return { isValid: false, error: 'Journal content is required' };
  }
  
  if (content.trim().length === 0) {
    return { isValid: false, error: 'Journal content cannot be empty' };
  }
  
  if (content.length > 10000) {
    return { isValid: false, error: 'Journal entry too long (max 10,000 characters)' };
  }
  
  console.log('Journal entry validation passed');
  return { isValid: true };
};

// API request validation
export const validateApiRequest = (url: string, data?: any): ValidationResult => {
  console.log(`Validating API request to: ${url}`);
  
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'Invalid API URL' };
  }
  
  if (!url.startsWith('/api/')) {
    return { isValid: false, error: 'API URL must start with /api/' };
  }
  
  if (data && typeof data === 'object') {
    try {
      JSON.stringify(data);
    } catch (error) {
      return { isValid: false, error: 'Invalid request data format' };
    }
  }
  
  console.log('API request validation passed');
  return { isValid: true };
};

// Route navigation validation
export const validateRoute = (path: string): ValidationResult => {
  console.log(`Validating route: ${path}`);
  
  if (!path || typeof path !== 'string') {
    return { isValid: false, error: 'Invalid route path' };
  }
  
  if (!path.startsWith('/')) {
    return { isValid: false, error: 'Route must start with /' };
  }
  
  // Check for valid route patterns
  const validRoutes = [
    '/', '/community', '/dreams', '/progress', '/settings', 
    '/premium', '/premium-success', '/timeline', '/insights',
    '/feed', '/mantras', '/mama-mindfully', '/morning', '/evening'
  ];
  
  const isValidRoute = validRoutes.includes(path) || 
    path.startsWith('/api/') || 
    path.startsWith('/settings/');
  
  if (!isValidRoute) {
    console.warn(`Invalid route attempted: ${path}`);
    return { isValid: false, error: 'Invalid route' };
  }
  
  console.log('Route validation passed');
  return { isValid: true };
};

// localStorage validation
export const validateLocalStorage = (key: string, data: any): ValidationResult => {
  console.log(`Validating localStorage operation for key: ${key}`);
  
  if (!key || typeof key !== 'string') {
    return { isValid: false, error: 'Invalid localStorage key' };
  }
  
  try {
    JSON.stringify(data);
    console.log('localStorage validation passed');
    return { isValid: true };
  } catch (error) {
    console.error('localStorage validation failed:', error);
    return { isValid: false, error: 'Data not serializable to localStorage' };
  }
};

// Safe navigation wrapper
export const safeNavigate = (path: string, navigate: (path: string) => void): boolean => {
  const validation = validateRoute(path);
  
  if (!validation.isValid) {
    console.error(`Navigation blocked: ${validation.error}`);
    return false;
  }
  
  try {
    navigate(path);
    console.log(`Successfully navigated to: ${path}`);
    return true;
  } catch (error) {
    console.error(`Navigation failed: ${error}`);
    return false;
  }
};