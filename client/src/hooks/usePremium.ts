import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAppStore } from "@/store/appStore";
import { useAuth } from "./useAuth";

export function usePremium() {
  const { isAuthenticated } = useAuth();
  const setSubscription = useAppStore(state => state.setSubscription);
  const setSubscriptionLoading = useAppStore(state => state.setSubscriptionLoading);
  
  const { data: premiumData, isLoading } = useQuery({
    queryKey: ["/api/user/premium-status"],
    enabled: isAuthenticated,
    retry: false,
    onSuccess: (data) => {
      if (data) {
        const status = data.isPremium ? 'premium' : 'free';
        setSubscription(status, data.isPremium);
      }
    },
    onError: () => {
      setSubscription('free', false);
    }
  });

  // Sync loading state with store
  useEffect(() => {
    setSubscriptionLoading(isLoading);
  }, [isLoading, setSubscriptionLoading]);

  return {
    isPremium: premiumData?.isPremium || false,
    isLoading,
    premiumData,
  };
}