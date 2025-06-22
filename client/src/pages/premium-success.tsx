import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Check, Sparkles, ArrowRight, Home } from 'lucide-react';
import { Link } from 'wouter';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';

export default function PremiumSuccessPage() {
  useEffect(() => {
    // Confetti or celebration animation could go here
    console.log('Premium upgrade successful!');
  }, []);

  const premiumFeatures = [
    'Unlimited AI insights and reflections',
    'Voice journaling with transcription',
    'Advanced mood analytics and patterns',
    'Weekly emotional intelligence reports',
    'Dream interpretation and analysis',
    'Unlimited journal entries',
    'Priority customer support',
    'Export your data anytime'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <AppHeader />
      
      <div className="container max-w-4xl mx-auto px-4 py-8 pb-24">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <Crown className="h-16 w-16 text-yellow-500" />
              <div className="absolute -top-2 -right-2">
                <Sparkles className="h-6 w-6 text-purple-500 animate-pulse" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Welcome to Luma Premium!
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
            Your payment was successful and you now have access to all premium features. 
            Start exploring your enhanced journaling experience.
          </p>
          
          <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400 mb-8">
            <Check className="h-5 w-5" />
            <span className="font-medium">Payment Confirmed</span>
          </div>
        </div>

        <Card className="mb-8 border-purple-200 dark:border-purple-800 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Crown className="h-5 w-5 mr-2 text-yellow-500" />
              Your Premium Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Sparkles className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Start Journaling</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Begin your premium journaling experience with AI-powered insights
              </p>
              <Link href="/">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Start Writing
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Explore Features</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Discover all the premium tools available to enhance your wellbeing
              </p>
              <Link href="/settings">
                <Button variant="outline" className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  View Settings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Need Help Getting Started?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Check out our getting started guide or contact our support team
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" size="sm">
                  View Guide
                </Button>
                <Button variant="outline" size="sm">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>
            Questions about your subscription? Visit your account settings to manage your plan.
          </p>
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
}