import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Lock } from 'lucide-react';
import { redirectToCheckout } from '@/utils/stripeCheckout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface PremiumGateProps {
  children: React.ReactNode;
  isPremium: boolean;
  feature: string;
  description?: string;
}

export default function PremiumGate({ children, isPremium, feature, description }: PremiumGateProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleUpgrade = async () => {
    if (!user?.email) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to upgrade to premium.",
        variant: "destructive",
      });
      return;
    }

    try {
      await redirectToCheckout(user.email);
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: "Failed to redirect to checkout. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Lock className="h-12 w-12 text-gray-400" />
            <Crown className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1" />
          </div>
        </div>
        <CardTitle className="text-lg">
          Unlock {feature}
        </CardTitle>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            {description}
          </p>
        )}
      </CardHeader>
      <CardContent className="text-center">
        <Button 
          onClick={handleUpgrade}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white"
        >
          <Crown className="h-4 w-4 mr-2" />
          Upgrade to Premium
        </Button>
        <p className="text-xs text-gray-500 mt-3">
          7-day free trial • Cancel anytime
        </p>
      </CardContent>
    </Card>
  );
}