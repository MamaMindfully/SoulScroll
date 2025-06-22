import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Crown, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { useAppContext } from "@/context/AppContext";

interface LockedFeatureMessageProps {
  message: string;
  feature?: string;
  description?: string;
  premium?: boolean;
}

const LockedFeatureMessage: React.FC<LockedFeatureMessageProps> = ({
  message,
  feature,
  description,
  premium = true
}) => {
  const [, setLocation] = useLocation();
  const { state } = useAppContext();

  const handleUpgrade = () => {
    setLocation('/premium');
  };

  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  if (!state.isLoggedIn) {
    return (
      <Card className="mx-auto max-w-2xl mt-8">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Lock className="w-6 h-6 text-amber-500" />
            <span>Sign In Required</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Please sign in to access this feature and start your mindful journey.
          </p>
          <Button onClick={handleLogin} className="w-full">
            Sign In to Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-2xl mt-8">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          {premium && <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <Crown className="w-3 h-3 mr-1" />
            Premium
          </Badge>}
        </div>
        <CardTitle className="flex items-center justify-center space-x-2">
          <Lock className="w-6 h-6 text-purple-500" />
          <span>{feature || 'Premium Feature'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-gray-600">
          {message}
        </p>
        {description && (
          <p className="text-sm text-gray-500">
            {description}
          </p>
        )}
        
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800 mb-2">Premium Features Include:</h3>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• AI-powered dream interpretation</li>
            <li>• Voice journaling with transcription</li>
            <li>• Advanced emotional insights</li>
            <li>• Community features and sharing</li>
            <li>• Mantra designer and spiritual tools</li>
            <li>• Data export and backup</li>
          </ul>
        </div>

        <div className="space-y-2">
          <Button onClick={handleUpgrade} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Premium
          </Button>
          <p className="text-xs text-gray-500">
            7-day free trial • Cancel anytime
          </p>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-gray-400">
            Current plan: {state.subscriptionStatus === 'free' ? 'Free' : state.subscriptionStatus}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LockedFeatureMessage;