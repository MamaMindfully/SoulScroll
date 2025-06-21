import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { getPremiumFeatures, type PremiumFeatures } from '@/utils/getPremiumFeatures';

interface PremiumContextType {
  isPremium: boolean;
  isLoading: boolean;
  premiumFeatures: PremiumFeatures;
  refreshPremiumStatus: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
};

interface PremiumProviderProps {
  children: ReactNode;
}

export const PremiumProvider: React.FC<PremiumProviderProps> = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [premiumFeatures, setPremiumFeatures] = useState<PremiumFeatures>({
    voiceJournaling: false,
    dreamInterpretation: false,
    advancedAI: false,
    unlimitedEntries: false,
    exportFeatures: false,
    rituals: true,
    mantras: false,
    community: true,
    analytics: false
  });
  const { isAuthenticated, user } = useAuth();

  const fetchPremiumStatus = async () => {
    if (!isAuthenticated || !user) {
      setIsPremium(false);
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiRequest('GET', '/api/user/premium-status');
      const data = await response.json();
      setIsPremium(data?.isPremium || false);
    } catch (error) {
      console.error('Failed to fetch premium status:', error);
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPremiumStatus = async () => {
    setIsLoading(true);
    await fetchPremiumStatus();
  };

  useEffect(() => {
    fetchPremiumStatus();
  }, [isAuthenticated, user]);

  return (
    <PremiumContext.Provider value={{ isPremium, isLoading, refreshPremiumStatus }}>
      {children}
    </PremiumContext.Provider>
  );
};