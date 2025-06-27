import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAppStore } from "@/store/appStore";
import { setUserContext, addBreadcrumb } from "@/utils/sentry";
import { performanceMonitor } from "@/utils/performance";

export function useAuth() {
  const setUser = useAppStore(state => state.setUser);
  const logout = useAppStore(state => state.logout);
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    onSuccess: (userData) => {
      if (userData) {
        setUserContext({ id: userData.id, email: userData.email });
        addBreadcrumb('User authenticated', 'auth', { userId: userData.id });
        performanceMonitor.endMark('auth-check');
        
        // Update global store
        setUser(userData.id);
      } else {
        logout();
      }
    },
    onError: (error) => {
      addBreadcrumb('Authentication failed', 'auth', { error: error.message });
      performanceMonitor.endMark('auth-check');
      logout();
    }
  });

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
