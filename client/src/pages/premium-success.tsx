import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, CheckCircle, Sparkles } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';

export default function PremiumSuccess() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Invalidate premium status queries to refresh user's premium state
    queryClient.invalidateQueries({ queryKey: ['/api/user/premium-status'] });
    queryClient.invalidateQueries({ queryKey: ['/api/premium'] });
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <AppHeader />
      <div className="container mx-auto px-4 py-8 pb-20">
        <div className="max-w-md mx-auto text-center">
          <Card className="shadow-lg border-purple-200">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-purple-800">
                Welcome to Premium!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <CheckCircle className="w-6 h-6" />
                <span className="text-lg font-medium">Payment Successful</span>
              </div>
              
              <div className="space-y-3 text-left">
                <h3 className="font-semibold text-slate-800 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span>You now have access to:</span>
                </h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Unlimited AI conversations with Arc</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>5-level "Go Deeper" exploration</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Voice journaling with AI transcription</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Advanced mood tracking & analytics</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>PDF export and backup options</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Community wisdom feed access</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Start Your Premium Journey
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/settings'}
                  className="w-full"
                >
                  Manage Subscription
                </Button>
              </div>
              
              <div className="text-center text-sm text-slate-600">
                <p>Your 7-day free trial has started.</p>
                <p>You can cancel anytime from your settings.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}