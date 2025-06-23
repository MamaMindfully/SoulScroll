import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Check, Sparkles, Zap, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-buy-button': {
        'buy-button-id': string;
        'publishable-key': string;
      };
    }
  }
}

export default function BuyButtonCheckout() {
  const { user } = useAuth();

  useEffect(() => {
    // Load Stripe Buy Button script
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/buy-button.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src="https://js.stripe.com/v3/buy-button.js"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  });

  const features = [
    'AI-powered emotional insights',
    'Voice journaling with transcription',
    'Advanced mood analytics',
    'Personalized meditation guides',
    'Dream interpretation',
    'Unlimited journal entries',
    'Export your data anytime',
    'Priority customer support'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Crown className="h-8 w-8 text-yellow-500 mr-2" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Upgrade to Luma Premium
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Unlock the full power of AI-driven emotional intelligence and transform your journaling experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-gray-500" />
                Free Plan
              </CardTitle>
              <div className="text-3xl font-bold">$0<span className="text-lg font-normal text-gray-500">/month</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Basic journaling
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Simple mood tracking
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  5 AI insights per month
                </li>
                <li className="flex items-center text-gray-400">
                  <Check className="h-4 w-4 text-gray-300 mr-2" />
                  Limited features
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="relative border-purple-200 dark:border-purple-800 shadow-lg">
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600">
              Most Popular
            </Badge>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Crown className="h-5 w-5 mr-2 text-yellow-500" />
                Premium Plan
              </CardTitle>
              <div className="text-3xl font-bold">$8.99<span className="text-lg font-normal text-gray-500">/month</span></div>
              <p className="text-sm text-gray-500">7-day free trial included</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {/* Stripe Buy Button */}
              <div className="text-center">
                <stripe-buy-button
                  buy-button-id="buy_btn_1RceyJPvg0llFnxzxT9QNg29"
                  publishable-key="pk_test_51RWOnMPvg0llFnxz2jXDLcguvR8TpzeImPZVWLX49mKxbITr3nIsV3sA7zWkOoNFUh0Q4it8wEaB8zy8QwOeY3ZH00sslUugWA"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Zap className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">AI-Powered Insights</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Advanced emotional analysis and personalized recommendations
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Star className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Voice Journaling</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Speak your thoughts and let AI transcribe and analyze them
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Sparkles className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Dream Analysis</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Unlock the mysteries of your dreams with AI interpretation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Testimonials or FAQ section could go here */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Secure payment processed by Stripe • Cancel anytime • 30-day money-back guarantee
          </p>
        </div>
      </div>
    </div>
  );
}