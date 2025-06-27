import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useAppStore } from '@/store/appStore';
import { addBreadcrumb } from '@/utils/sentry';

interface UserStatus {
  subscription: {
    tier: 'free' | 'premium' | 'premium_plus';
    status: 'active' | 'inactive' | 'trialing';
    expiresAt?: string;
  };
  scrolls: {
    unlocked: number;
    total: number;
    latest?: {
      id: string;
      title: string;
      unread: boolean;
    };
  };
  journal: {
    lastEntryTimestamp?: string;
    totalEntries: number;
    currentStreak: number;
  };
  insights: {
    unread: number;
    pending: number;
    latest?: {
      id: string;
      type: string;
      createdAt: string;
    };
  };
  memory: {
    totalPatterns: number;
    emergentThemes: string[];
    lastUpdate?: string;
  };
}

export const useUserStatus = (pollingInterval: number = 60000) => {
  const setSubscriptionStatus = useAppStore(state => state.setSubscriptionStatus);
  const { isLoggedIn } = useAppStore();

  // Fetch detailed user status with polling
  const { data: userStatus, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/user/status/detailed'],
    queryFn: async (): Promise<UserStatus> => {
      const response = await apiRequest('GET', '/api/user/status/detailed');
      
      if (!response.ok) {
        throw new Error('Failed to fetch detailed user status');
      }

      const data = await response.json();
      
      addBreadcrumb('Detailed user status fetched', 'status', {
        subscriptionTier: data.subscription?.tier,
        unreadInsights: data.insights?.unread,
        currentStreak: data.journal?.currentStreak
      });

      return data;
    },
    enabled: isLoggedIn,
    staleTime: 30000, // Consider fresh for 30 seconds
    refetchInterval: pollingInterval,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  // Update global store when subscription status changes
  useEffect(() => {
    if (userStatus?.subscription) {
      const { status, tier } = userStatus.subscription;
      
      // Map subscription tier to store status
      let storeStatus: 'free' | 'active' | 'paused' | 'canceled' = 'free';
      
      if (tier !== 'free' && status === 'active') {
        storeStatus = 'active';
      } else if (tier !== 'free' && status === 'inactive') {
        storeStatus = 'canceled';
      }
      
      setSubscriptionStatus(storeStatus);
    }
  }, [userStatus?.subscription, setSubscriptionStatus]);

  // Enhanced status indicators
  const hasUnreadContent = () => {
    if (!userStatus) return false;
    
    return (
      (userStatus.insights?.unread || 0) > 0 ||
      (userStatus.scrolls?.latest?.unread) ||
      false
    );
  };

  const getNotificationBadgeCount = () => {
    if (!userStatus) return 0;
    
    let count = 0;
    count += userStatus.insights?.unread || 0;
    count += userStatus.scrolls?.latest?.unread ? 1 : 0;
    
    return count;
  };

  const getSubscriptionStatusMessage = () => {
    if (!userStatus?.subscription) return 'Loading subscription status...';
    
    const { tier, status, expiresAt } = userStatus.subscription;
    
    if (tier === 'free') {
      return 'Free tier - Upgrade for premium features';
    }
    
    if (status === 'trialing') {
      return `Free trial active - ${expiresAt ? `Expires ${new Date(expiresAt).toLocaleDateString()}` : ''}`;
    }
    
    if (status === 'active') {
      return `${tier} subscription active`;
    }
    
    return 'Subscription inactive';
  };

  const getStreakMessage = () => {
    const streak = userStatus?.journal?.currentStreak || 0;
    
    if (streak === 0) {
      return 'Start your journaling streak today!';
    } else if (streak === 1) {
      return 'Great start! Keep your streak going.';
    } else if (streak < 7) {
      return `${streak} day streak - You're building momentum!`;
    } else if (streak < 30) {
      return `${streak} day streak - Fantastic consistency!`;
    } else {
      return `${streak} day streak - You're a journaling master!`;
    }
  };

  const shouldShowRewardNotification = () => {
    if (!userStatus) return false;
    
    // Show notification for significant milestones
    const streak = userStatus.journal?.currentStreak || 0;
    const scrolls = userStatus.scrolls?.unlocked || 0;
    
    return (
      streak % 7 === 0 && streak > 0 || // Weekly streak milestones
      scrolls > 0 && userStatus.scrolls?.latest?.unread || // New scrolls
      (userStatus.insights?.unread || 0) > 0 // New insights
    );
  };

  return {
    userStatus,
    isLoading,
    error,
    refetch,
    
    // Computed status helpers
    hasUnreadContent: hasUnreadContent(),
    notificationBadgeCount: getNotificationBadgeCount(),
    subscriptionStatusMessage: getSubscriptionStatusMessage(),
    streakMessage: getStreakMessage(),
    shouldShowRewardNotification: shouldShowRewardNotification(),
    
    // Quick access to key metrics
    currentStreak: userStatus?.journal?.currentStreak || 0,
    unreadInsights: userStatus?.insights?.unread || 0,
    subscriptionTier: userStatus?.subscription?.tier || 'free',
    emergentThemes: userStatus?.memory?.emergentThemes || [],
  };
};