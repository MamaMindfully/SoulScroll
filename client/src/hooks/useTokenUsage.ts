import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuthState } from '@/store/appStore';

interface TokenUsage {
  subscription: 'free' | 'premium';
  dailyUsage: number;
  monthlyUsage: number;
  monthlyLimit: number;
  usagePercentage: number;
  estimatedMonthlyCost: number;
  canMakeRequests: boolean;
  recommendUpgrade: boolean;
}

export const useTokenUsage = () => {
  const { isLoggedIn } = useAuthState();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/user/token-usage'],
    queryFn: async (): Promise<TokenUsage> => {
      const response = await apiRequest('GET', '/api/user/token-usage');
      
      if (!response.ok) {
        throw new Error('Failed to fetch token usage');
      }

      return response.json();
    },
    enabled: isLoggedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });

  const getUsageColor = () => {
    if (!data) return 'gray';
    if (data.usagePercentage >= 90) return 'red';
    if (data.usagePercentage >= 70) return 'yellow';
    return 'green';
  };

  const getUsageMessage = () => {
    if (!data) return 'Loading usage data...';
    
    if (data.usagePercentage >= 100) {
      return 'Monthly limit reached. Upgrade for more usage.';
    }
    
    if (data.usagePercentage >= 90) {
      return 'Approaching monthly limit. Consider upgrading.';
    }
    
    if (data.usagePercentage >= 70) {
      return 'You\'re using most of your monthly allowance.';
    }
    
    return 'Usage is within normal limits.';
  };

  return {
    tokenUsage: data,
    isLoading,
    error,
    refetch,
    usageColor: getUsageColor(),
    usageMessage: getUsageMessage(),
    isNearLimit: data?.usagePercentage >= 80,
    hasExceededLimit: data?.usagePercentage >= 100,
  };
};