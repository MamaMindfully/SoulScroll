// Utility to help prevent React hooks ordering violations

import { useHasMounted } from './useHasMounted';

// Higher-order component to ensure hooks safety
export function withHooksSafety<T extends {}>(Component: React.ComponentType<T>) {
  return function SafeComponent(props: T) {
    const hasMounted = useHasMounted();
    
    if (!hasMounted) {
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
  const hasMounted = useHasMounted();
  
  if (!hasMounted) {
    return fallback;
  }
  
  try {
    return browserAPIFn();
  } catch {
    return fallback;
  }
}