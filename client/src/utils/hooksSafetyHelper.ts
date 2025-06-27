import React, { useState, useEffect } from 'react';

// Utility to help prevent React hooks ordering violations

// Higher-order component to ensure hooks safety
export function withHooksSafety<T extends {}>(Component: React.ComponentType<T>) {
  return function SafeComponent(props: T) {
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
      setMounted(true);
    }, []);
    
    if (!mounted) {
      return null;
    }
    
    return <Component {...props} />;
  };
}

// Hook to safely use browser APIs
export function useSafeBrowserAPI<T>(
  browserAPIFn: () => T,
  fallback: T
): T {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return fallback;
  }
  
  try {
    return browserAPIFn();
  } catch {
    return fallback;
  }
}