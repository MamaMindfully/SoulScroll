import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/store/appStore";
import { useAuth } from "./useAuth";

export function usePremium() {
  const { isAuthenticated } = useAuth();
  const setSubscriptionStatus = useAppStore(state => state.setSubscriptionStatus);
  
  const { data: premiumData, isLoading } = useQuery({
    queryKey: ["/api/user/premium-status"],
    enabled: isAuthenticated,
    retry: false,
    onSuccess: (data) => {
      if (data) {
        const status = data.isPremium ? 'active' : 'free';
        setSubscriptionStatus(status);
      }
    },
    onError: () => {
      setSubscriptionStatus('free');
    }
  });

  return {
    isPremium: premiumData?.isPremium || false,
    isLoading,
    premiumData,
  };
}