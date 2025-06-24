import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface PremiumStatus {
  isPremium: boolean;
  premiumExpiresAt: string | null;
  subscriptionId: string | null;
  planType: 'free' | 'premium' | 'premium_plus';
  lastChecked: number;
}

interface PremiumContextType {
  premiumStatus: PremiumStatus | null;
  isLoading: boolean;
  refreshPremiumStatus: () => Promise<void>;
  checkFeatureAccess: (feature: string) => boolean;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

const PREMIUM_FEATURES = {
  ai_analysis: true,
  voice_journaling: true,
  export_data: true,
  unlimited_entries: true,
  advanced_insights: true,
  batch_analysis: true,
  custom_prompts: true,
  dream_interpretation: true,
  community_features: true
};

const FREE_FEATURES = {
  basic_journaling: true,
  daily_prompts: true,
  basic_insights: true,
  emotion_tracking: true
};

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshPremiumStatus = useCallback(async () => {
    try {
      const response = await apiRequest('GET', '/api/user/premium-status');
      
      if (response.ok) {
        const data = await response.json();
        const status: PremiumStatus = {
          isPremium: data.isPremium || false,
          premiumExpiresAt: data.premiumExpiresAt || null,
          subscriptionId: data.subscriptionId || null,
          planType: data.planType || 'free',
          lastChecked: Date.now()
        };
        
        setPremiumStatus(status);
        
        // Cache status in localStorage for quick access
        localStorage.setItem('premiumStatus', JSON.stringify(status));
      } else {
        console.warn('Failed to fetch premium status');
        // Use cached status if available
        const cached = localStorage.getItem('premiumStatus');
        if (cached) {
          const cachedStatus = JSON.parse(cached);
          // Only use cached if less than 5 minutes old
          if (Date.now() - cachedStatus.lastChecked < 5 * 60 * 1000) {
            setPremiumStatus(cachedStatus);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching premium status:', error);
      // Fallback to cached status
      const cached = localStorage.getItem('premiumStatus');
      if (cached) {
        setPremiumStatus(JSON.parse(cached));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkFeatureAccess = useCallback((feature: string): boolean => {
    if (!premiumStatus) return FREE_FEATURES[feature] || false;
    
    // Check if premium is active
    const isPremiumActive = premiumStatus.isPremium && 
      (!premiumStatus.premiumExpiresAt || new Date(premiumStatus.premiumExpiresAt) > new Date());
    
    if (isPremiumActive) {
      return PREMIUM_FEATURES[feature] !== undefined;
    }
    
    return FREE_FEATURES[feature] || false;
  }, [premiumStatus]);

  useEffect(() => {
    // Initial load
    refreshPremiumStatus();
    
    // Set up periodic refresh every minute for real-time sync
    const interval = setInterval(refreshPremiumStatus, 60 * 1000);
    
    // Listen for focus events to refresh when user returns to tab
    const handleFocus = () => {
      if (premiumStatus && Date.now() - premiumStatus.lastChecked > 2 * 60 * 1000) {
        refreshPremiumStatus();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Listen for storage events from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'premiumStatus' && e.newValue) {
        setPremiumStatus(JSON.parse(e.newValue));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom premium update events (from Stripe webhooks)
    const handlePremiumUpdate = () => {
      refreshPremiumStatus();
    };
    
    window.addEventListener('premium:updated', handlePremiumUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('premium:updated', handlePremiumUpdate);
    };
  }, [refreshPremiumStatus, premiumStatus?.lastChecked]);

  const value: PremiumContextType = {
    premiumStatus,
    isLoading,
    refreshPremiumStatus,
    checkFeatureAccess
  };

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = (): PremiumContextType => {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
};

// Hook for checking specific feature access
export const useFeatureAccess = (feature: string) => {
  const { checkFeatureAccess, premiumStatus, isLoading } = usePremium();
  
  return {
    hasAccess: checkFeatureAccess(feature),
    isPremium: premiumStatus?.isPremium || false,
    isLoading,
    planType: premiumStatus?.planType || 'free'
  };
};

export default PremiumProvider;