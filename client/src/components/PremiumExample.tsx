import React from 'react';
import { usePremium } from '@/context/PremiumContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Heart, Sparkles } from 'lucide-react';

interface PremiumExampleProps {
  featureName: string;
  children: React.ReactNode;
}

export const PremiumExample: React.FC<PremiumExampleProps> = ({ featureName, children }) => {
  const { isPremium } = usePremium();
  
  if (isPremium) {
    return <>{children}</>;
  }
  
  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-amber-800">
          <Crown className="w-5 h-5" />
          <span>{featureName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-6">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-amber-400" />
          <h3 className="text-lg font-semibold text-amber-800 mb-2">Premium Feature</h3>
          <p className="text-amber-600 mb-4">
            Unlock {featureName.toLowerCase()} and more with premium access
          </p>
          <Button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Premium
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PremiumExample;