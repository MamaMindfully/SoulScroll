import { useState, useEffect } from 'react';

/**
 * Hook to prevent hydration mismatches by ensuring components
 * only render client-side content after mounting
 */
export function useHasMounted(): boolean {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}