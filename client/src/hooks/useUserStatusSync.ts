import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { addBreadcrumb } from '@/utils/sentry';

interface UserStatusResponse {
  subscription_status: string;
  subscription_tier: string;
  last_journal_entry: string | null;
  journal_count: number;
  current_streak: number;
  average_mood: number;
  premium_status: boolean;
}

export const useUserStatusSync = () => {
  const { 
    setSubscriptionStatus, 
    setUserId, 
    setIsLoggedIn,
    userId,
    isLoggedIn 
  } = useAppStore();

  useEffect(() => {
    if (!isLoggedIn || !userId) return;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/user/status?userId=${userId}`);
        
        if (!response.ok) {
          if (response.status === 401) {
            // User is not authenticated, clear state
            setIsLoggedIn(false);
            setUserId(null);
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const data: UserStatusResponse = await response.json();
        
        // Update subscription status based on response
        if (data.subscription_status && data.premium_status) {
          setSubscriptionStatus('active');
        } else if (data.subscription_status === 'trialing') {
          setSubscriptionStatus('active'); // Treat trial as active
        } else {
          setSubscriptionStatus('free');
        }

        addBreadcrumb('User status synced', 'status', {
          subscriptionTier: data.subscription_tier,
          journalCount: data.journal_count,
          currentStreak: data.current_streak
        });

      } catch (error) {
        console.error('Failed to fetch user status:', error);
        // Don't clear state on network errors, just log them
      }
    };

    // Initial fetch
    fetchStatus();

    // Set up polling interval (every 60 seconds)
    const interval = setInterval(fetchStatus, 60000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [isLoggedIn, userId, setSubscriptionStatus, setIsLoggedIn, setUserId]);

  // Also fetch on window focus for immediate updates
  useEffect(() => {
    if (!isLoggedIn || !userId) return;

    const handleFocus = async () => {
      try {
        const response = await fetch(`/api/user/status?userId=${userId}`);
        if (response.ok) {
          const data: UserStatusResponse = await response.json();
          
          if (data.premium_status) {
            setSubscriptionStatus('active');
          } else {
            setSubscriptionStatus('free');
          }
        }
      } catch (error) {
        console.error('Failed to fetch user status on focus:', error);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isLoggedIn, userId, setSubscriptionStatus]);
};