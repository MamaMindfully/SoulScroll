import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export function usePremium() {
  const { isAuthenticated } = useAuth();
  
  const { data: premiumData, isLoading } = useQuery({
    queryKey: ["/api/user/premium-status"],
    enabled: isAuthenticated,
    retry: false,
  });

  return {
    isPremium: premiumData?.isPremium || false,
    isLoading,
    premiumData,
  };
}