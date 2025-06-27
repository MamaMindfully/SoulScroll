export interface PremiumFeatures {
  voiceJournaling: boolean;
  dreamInterpretation: boolean;
  advancedAI: boolean;
  unlimitedEntries: boolean;
  exportFeatures: boolean;
  rituals: boolean;
  mantras: boolean;
  community: boolean;
  analytics: boolean;
}

export const getPremiumFeatures = async (userId?: string): Promise<PremiumFeatures> => {
  try {
    if (!userId) {
      return getDefaultFeatures(false);
    }

    const response = await fetch(`/api/premium/${userId}`);
    if (!response.ok) {
      throw new Error("Could not fetch premium features.");
    }
    
    const data = await response.json();
    return data.features;
  } catch (error) {
    console.error("getPremiumFeatures error:", error);
    // Fallback: return free tier features
    return getDefaultFeatures(false);
  }
};

const getDefaultFeatures = (isPremium: boolean): PremiumFeatures => {
  if (isPremium) {
    return {
      voiceJournaling: true,
      dreamInterpretation: true,
      advancedAI: true,
      unlimitedEntries: true,
      exportFeatures: true,
      rituals: true,
      mantras: true,
      community: true,
      analytics: true
    };
  }

  return {
    voiceJournaling: false,
    dreamInterpretation: false,
    advancedAI: false,
    unlimitedEntries: false,
    exportFeatures: false,
    rituals: true, // Basic rituals are free
    mantras: false,
    community: true, // Basic community is free
    analytics: false
  };
};

// Simple feature check utility
export const hasFeature = (features: PremiumFeatures, featureName: keyof PremiumFeatures): boolean => {
  return features[featureName] === true;
};