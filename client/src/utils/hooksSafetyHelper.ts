// Utility to help prevent React hooks ordering violations


// Higher-order component to ensure hooks safety
export function withHooksSafety<T extends {}>(Component: React.ComponentType<T>) {
  return function SafeComponent(props: T) {
    
    
    // Component safety check {
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
  
  
  // Component safety check {
    return fallback;
  }
  
  try {
    return browserAPIFn();
  } catch {
    return fallback;
  }
}