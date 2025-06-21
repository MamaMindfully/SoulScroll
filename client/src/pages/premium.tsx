import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Check, Sparkles, Zap, Star } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';

// Load Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

const CheckoutForm: React.FC<{ planType: 'monthly' | 'yearly' }> = ({ planType }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/premium/success`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Welcome to SoulScroll Premium!",
      });
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      >
        {isProcessing ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            <span>Processing...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Crown className="w-4 h-4" />
            <span>Start Premium Journey</span>
          </div>
        )}
      </Button>
    </form>
  );
};

const PremiumPlan: React.FC<{
  title: string;
  price: string;
  period: string;
  savings?: string;
  features: string[];
  popular?: boolean;
  planType: 'monthly' | 'yearly';
  onSelect: (planType: 'monthly' | 'yearly') => void;
}> = ({ title, price, period, savings, features, popular, planType, onSelect }) => {
  return (
    <Card className={`relative ${popular ? 'border-purple-300 shadow-lg ring-2 ring-purple-200' : 'border-slate-200'}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <Star className="w-3 h-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold text-slate-800">{title}</CardTitle>
        <div className="space-y-1">
          <div className="flex items-baseline justify-center space-x-1">
            <span className="text-3xl font-bold text-purple-600">{price}</span>
            <span className="text-slate-600">/{period}</span>
          </div>
          {savings && (
            <p className="text-sm text-green-600 font-medium">{savings}</p>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start space-x-2">
              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-700">{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button
          onClick={() => onSelect(planType)}
          className={`w-full ${
            popular 
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
              : 'bg-slate-600 hover:bg-slate-700'
          }`}
        >
          <Crown className="w-4 h-4 mr-2" />
          Choose {title}
        </Button>
      </CardContent>
    </Card>
  );
};

export default function Premium() {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | null>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const createCheckoutMutation = useMutation({
    mutationFn: async (planType: 'monthly' | 'yearly') => {
      const response = await apiRequest('POST', '/api/stripe/create-checkout-session', {
        planType,
        successUrl: `${window.location.origin}/premium/success`,
        cancelUrl: `${window.location.origin}/premium`,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handlePlanSelect = (planType: 'monthly' | 'yearly') => {
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to subscribe to premium.",
        variant: "destructive",
      });
      window.location.href = '/api/auth/login';
      return;
    }

    setSelectedPlan(planType);
    createCheckoutMutation.mutate(planType);
  };

  const plans = [
    {
      title: "Monthly",
      price: "$8.99",
      period: "month",
      planType: 'monthly' as const,
      features: [
        "Unlimited AI insights and reflections",
        "Voice journaling with transcription",
        "Advanced mood tracking and analytics",
        "Export and backup capabilities",
        "Premium support",
        "All future features included"
      ]
    },
    {
      title: "Yearly",
      price: "$89.99",
      period: "year",
      savings: "Save $18 per year",
      popular: true,
      planType: 'yearly' as const,
      features: [
        "Everything in Monthly plan",
        "2 months free (17% savings)",
        "Priority customer support",
        "Early access to new features",
        "Advanced export options",
        "Unlimited reflection archive"
      ]
    }
  ];

  if (clientSecret && selectedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <AppHeader />
        <div className="container mx-auto px-4 py-8 pb-20">
          <div className="max-w-md mx-auto">
            <Card className="shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center space-x-2 text-purple-800">
                  <Crown className="w-6 h-6" />
                  <span>Complete Your Upgrade</span>
                </CardTitle>
                <p className="text-slate-600">
                  You're one step away from unlocking premium features
                </p>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm planType={selectedPlan} />
                </Elements>
              </CardContent>
            </Card>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <AppHeader />
      <div className="container mx-auto px-4 py-8 pb-20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Unlock Your Full Potential
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Experience deeper insights, unlimited reflections, and advanced features 
            designed to accelerate your personal growth journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
          {plans.map((plan) => (
            <PremiumPlan
              key={plan.planType}
              {...plan}
              onSelect={handlePlanSelect}
            />
          ))}
        </div>

        <div className="text-center">
          <div className="inline-flex items-center space-x-2 text-slate-600 mb-4">
            <Zap className="w-4 h-4" />
            <span>7-day free trial • Cancel anytime • Secure payment</span>
          </div>
          
          <Card className="max-w-2xl mx-auto bg-white/80 backdrop-blur border-slate-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center justify-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span>What You'll Get</span>
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-700">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Unlimited AI conversations with Arc</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>5-level "Go Deeper" exploration</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Voice journaling with AI transcription</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Advanced mood tracking & analytics</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>PDF export and backup options</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Community wisdom feed access</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}