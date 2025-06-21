import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { getPremiumFeatures, type PremiumFeatures } from '@/utils/getPremiumFeatures';
import { fetchPremiumStatus } from '@/utils/getPremiumStatus';

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

  const fetchPremiumStatusFromAPI = async () => {
    if (!isAuthenticated || !user) {
      setIsPremium(false);
      setPremiumFeatures(await getPremiumFeatures());
      setIsLoading(false);
      return;
    }

    try {
      // Use the new premium API route
      const premiumStatus = await fetchPremiumStatus(user.id);
      setIsPremium(premiumStatus);
      
      // Fetch detailed premium features
      const features = await getPremiumFeatures(user.id);
      setPremiumFeatures(features);
    } catch (error) {
      console.error('Failed to fetch premium status:', error);
      setIsPremium(false);
      setPremiumFeatures(await getPremiumFeatures());
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPremiumStatus = async () => {
    setIsLoading(true);
    await fetchPremiumStatusFromAPI();
  };

  useEffect(() => {
    fetchPremiumStatusFromAPI();
  }, [isAuthenticated, user]);

  const contextValue = {
    isPremium,
    isLoading,
    premiumFeatures,
    refreshPremiumStatus
  };

  return (
    <PremiumContext.Provider value={contextValue}>
      {children}
    </PremiumContext.Provider>
  );
};