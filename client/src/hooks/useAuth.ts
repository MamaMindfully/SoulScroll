import { useQuery } from "@tanstack/react-query";
import { setUserContext, addBreadcrumb } from "@/utils/sentry";
import { performanceMonitor } from "@/utils/performance";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    onSuccess: (userData) => {
      if (userData) {
        setUserContext({ id: userData.id, email: userData.email });
        addBreadcrumb('User authenticated', 'auth', { userId: userData.id });
        performanceMonitor.endMark('auth-check');
      }
    },
    onError: (error) => {
      addBreadcrumb('Authentication failed', 'auth', { error: error.message });
      performanceMonitor.endMark('auth-check');
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
