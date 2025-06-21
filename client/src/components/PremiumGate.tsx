import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Star, Zap } from "lucide-react";
import { usePremium } from "@/hooks/usePremium";

interface PremiumGateProps {
  children: ReactNode;
  feature: string;
  description?: string;
  onUpgrade?: () => void;
}

export function PremiumGate({ 
  children, 
  feature, 
  description = "This feature is available for premium members only.",
  onUpgrade 
}: PremiumGateProps) {
  const { isPremium, isLoading } = usePremium();

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">
            <div className="w-12 h-12 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
      <CardContent className="p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Lock className="w-12 h-12 text-amber-600" />
            <Star className="w-6 h-6 text-amber-500 absolute -top-2 -right-2" />
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-amber-900 mb-2">
          {feature} - Premium Feature
        </h3>
        
        <p className="text-amber-700 mb-6 leading-relaxed">
          {description}
        </p>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-center text-sm text-amber-600">
            <Zap className="w-4 h-4 mr-2" />
            Enhanced AI insights and reflections
          </div>
          <div className="flex items-center justify-center text-sm text-amber-600">
            <Zap className="w-4 h-4 mr-2" />
            Voice journaling with transcription
          </div>
          <div className="flex items-center justify-center text-sm text-amber-600">
            <Zap className="w-4 h-4 mr-2" />
            Dream interpretation and spiritual tools
          </div>
        </div>
        
        <Button 
          onClick={onUpgrade}
          className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
        >
          Upgrade to Premium
        </Button>
      </CardContent>
    </Card>
  );
}