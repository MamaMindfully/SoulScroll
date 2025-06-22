import React from 'react';
import { useFeatureAccess } from '@/store/appStore';
import LockedFeatureMessage from './LockedFeatureMessage';

interface FeatureGatedComponentProps {
  feature: 'community' | 'dream' | 'progress';
  children: React.ReactNode;
  fallbackMessage?: string;
  fallbackDescription?: string;
}

const FeatureGatedComponent: React.FC<FeatureGatedComponentProps> = ({
  feature,
  children,
  fallbackMessage,
  fallbackDescription
}) => {
  const featureAccess = useFeatureAccess();

  if (!featureAccess[feature]) {
    const defaultMessages = {
      community: 'Subscribe to unlock Community features and connect with other mindful journalers.',
      dream: 'Upgrade to Premium to unlock AI-powered dream interpretation and mystical insights.',
      progress: 'This feature requires authentication.'
    };

    const defaultDescriptions = {
      community: 'Share reflections, send hearts, and find support in our mindful community.',
      dream: 'Set intentions, log dreams, and receive personalized spiritual interpretations powered by AI.',
      progress: 'Track your journaling journey and emotional growth over time.'
    };

    return (
      <LockedFeatureMessage
        message={fallbackMessage || defaultMessages[feature]}
        feature={feature.charAt(0).toUpperCase() + feature.slice(1)}
        description={fallbackDescription || defaultDescriptions[feature]}
      />
    );
  }

  return <>{children}</>;
};

export default FeatureGatedComponent;