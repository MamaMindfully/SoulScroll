import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAppStore } from "@/store/appStore";
import { setUserContext, addBreadcrumb } from "@/utils/sentry";
import { performanceMonitor } from "@/utils/performance";

export function useAuth() {
  const setAuth = useAppStore(state => state.setAuth);
  const setAuthLoading = useAppStore(state => state.setAuthLoading);
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    onSuccess: (userData) => {
      if (userData) {
        setUserContext({ id: userData.id, email: userData.email });
        addBreadcrumb('User authenticated', 'auth', { userId: userData.id });
        performanceMonitor.endMark('auth-check');
        
        // Update global store
        setAuth(true, userData.id, userData);
      } else {
        setAuth(false);
      }
    },
    onError: (error) => {
      addBreadcrumb('Authentication failed', 'auth', { error: error.message });
      performanceMonitor.endMark('auth-check');
      setAuth(false);
    }
  });

  // Sync loading state with store
  useEffect(() => {
    setAuthLoading(isLoading);
  }, [isLoading, setAuthLoading]);

  // Start performance tracking for auth check
  if (isLoading) {
    performanceMonitor.startMark('auth-check');
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error
  };
}
