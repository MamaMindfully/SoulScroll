import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, Unlock } from 'lucide-react';
import { usePremium } from '@/context/PremiumContext';
import { useAuth } from '@/hooks/useAuth';

interface PremiumGuardProps {
  children: React.ReactNode;
  feature?: string;
  fallbackComponent?: React.ReactNode;
  showUpgrade?: boolean;
  className?: string;
}

const PremiumGuard: React.FC<PremiumGuardProps> = ({
  children,
  feature = "this feature",
  fallbackComponent,
  showUpgrade = true,
  className = ''
}) => {
  const { isPremium, isLoading } = usePremium();
  const { isAuthenticated } = useAuth();

  // Show children if user is premium
  if (isPremium) {
    return <>{children}</>;
  }

  // Show loading state
  if (isLoading) {
    return (
      <Card className={`bg-slate-50 border-slate-200 ${className}`}>
        <CardContent className="p-6 text-center">
          <div className="animate-pulse">
            <Crown className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-slate-600">Checking premium status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show custom fallback if provided
  if (fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  // Show upgrade prompt if user is not premium
  if (!isAuthenticated) {
    return (
      <Card className={`bg-amber-50 border-amber-200 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-amber-800">
            <Unlock className="w-5 h-5" />
            <span>Sign In Required</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-amber-700 mb-4">
            Please sign in to access {feature}.
          </p>
          <Button 
            onClick={() => window.location.href = '/api/auth/login'}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!showUpgrade) {
    return null;
  }

  return (
    <Card className={`bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-purple-800">
          <Crown className="w-5 h-5" />
          <span>Premium Feature</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-purple-700">
          Unlock {feature} and all premium features with SoulScroll Premium.
        </p>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-purple-600">
            <Sparkles className="w-4 h-4" />
            <span>Unlimited AI insights and deeper reflections</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-purple-600">
            <Sparkles className="w-4 h-4" />
            <span>Voice journaling and transcription</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-purple-600">
            <Sparkles className="w-4 h-4" />
            <span>Advanced analytics and mood tracking</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-purple-600">
            <Sparkles className="w-4 h-4" />
            <span>Export and backup capabilities</span>
          </div>
        </div>
        
        <Button 
          onClick={() => window.location.href = '/premium'}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Crown className="w-4 h-4 mr-2" />
          Upgrade to Premium
        </Button>
        
        <p className="text-xs text-purple-600 text-center">
          7-day free trial • Cancel anytime
        </p>
      </CardContent>
    </Card>
  );
};

export default PremiumGuard;