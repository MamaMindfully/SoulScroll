import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, Gift, Calendar, Star, Check, Zap } from "lucide-react";

interface PricingPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  popular?: boolean;
  premium?: boolean;
  badge?: string;
}

const optimizedPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Free Forever",
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      "5 journal entries per month",
      "Basic AI responses",
      "Simple mood tracking",
      "Mobile app access"
    ]
  },
  {
    id: "premium",
    name: "Premium",
    monthlyPrice: 8.99,
    annualPrice: 89.99, // 2 months free
    popular: true,
    badge: "Most Popular",
    features: [
      "Unlimited journal entries",
      "Advanced AI conversations",
      "Voice journaling & transcription",
      "Monthly reflection letters",
      "Emotional analytics & insights",
      "PDF export & backup",
      "Custom journal themes",
      "Priority support"
    ]
  },
  {
    id: "premium-plus",
    name: "Premium Plus",
    monthlyPrice: 19.99,
    annualPrice: 199.99, // 2 months free
    premium: true,
    badge: "Best Value",
    features: [
      "Everything in Premium",
      "Priority AI processing",
      "Custom writing prompts",
      "Hardcover book printing",
      "Advanced mood prediction",
      "1-on-1 guidance sessions",
      "Team/family sharing (5 accounts)",
      "White-glove onboarding"
    ]
  }
];

export function OptimizedPricingCards({ onSubscribe }: { onSubscribe: (planId: string, billing: 'monthly' | 'annual') => void }) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  
  const calculateSavings = (monthly: number, annual: number) => {
    const monthlyCost = monthly * 12;
    const savings = monthlyCost - annual;
    const percentage = Math.round((savings / monthlyCost) * 100);
    return { savings, percentage };
  };

  return (
    <div className="space-y-6">
      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="bg-gentle rounded-lg p-1 flex">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-md transition-all ${
              billingCycle === 'monthly' 
                ? 'bg-white shadow-sm text-wisdom' 
                : 'text-wisdom/60 hover:text-wisdom'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-6 py-2 rounded-md transition-all relative ${
              billingCycle === 'annual' 
                ? 'bg-white shadow-sm text-wisdom' 
                : 'text-wisdom/60 hover:text-wisdom'
            }`}
          >
            Annual
            <Badge className="absolute -top-2 -right-2 bg-primary text-white text-xs px-1">
              Save 17%
            </Badge>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {optimizedPlans.map((plan) => {
          const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
          const displayPrice = billingCycle === 'monthly' ? price : price / 12;
          const savings = plan.monthlyPrice > 0 ? calculateSavings(plan.monthlyPrice, plan.annualPrice) : null;

          return (
            <Card 
              key={plan.id}
              className={`relative p-6 space-y-6 ${
                plan.popular ? 'border-primary border-2 shadow-lg transform scale-105' : ''
              } ${plan.premium ? 'bg-gradient-to-br from-primary/5 to-accent/5' : ''}`}
            >
              {/* Badge */}
              {plan.badge && (
                <Badge className={`absolute -top-3 left-1/2 transform -translate-x-1/2 ${
                  plan.popular ? 'bg-primary' : 'bg-accent'
                } text-white`}>
                  {plan.badge}
                </Badge>
              )}

              {/* Header */}
              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  {plan.premium ? (
                    <Crown className="w-8 h-8 text-primary" />
                  ) : plan.popular ? (
                    <Star className="w-8 h-8 text-primary" />
                  ) : (
                    <Zap className="w-8 h-8 text-wisdom/60" />
                  )}
                </div>
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-primary">
                    ${displayPrice.toFixed(2)}
                    <span className="text-sm font-normal text-wisdom/60">
                      {plan.monthlyPrice > 0 ? '/month' : ''}
                    </span>
                  </div>
                  
                  {billingCycle === 'annual' && savings && (
                    <div className="text-sm text-green-600">
                      Save ${savings.savings}/year ({savings.percentage}% off)
                    </div>
                  )}
                  
                  {billingCycle === 'annual' && plan.monthlyPrice > 0 && (
                    <div className="text-xs text-wisdom/50">
                      Billed annually (${plan.annualPrice})
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-wisdom/80">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                onClick={() => onSubscribe(plan.id, billingCycle)}
                className={`w-full ${
                  plan.premium 
                    ? 'bg-gradient-to-r from-primary to-accent hover:opacity-90' 
                    : plan.popular 
                    ? 'bg-primary hover:bg-primary/90'
                    : 'bg-wisdom/10 text-wisdom hover:bg-wisdom/20'
                }`}
                variant={plan.monthlyPrice === 0 ? 'outline' : 'default'}
                disabled={plan.monthlyPrice === 0}
              >
                {plan.monthlyPrice === 0 
                  ? 'Current Plan' 
                  : `Start ${billingCycle === 'annual' ? 'Annual' : 'Monthly'} Plan`
                }
              </Button>

              {plan.monthlyPrice > 0 && (
                <div className="text-center text-xs text-wisdom/60">
                  7-day free trial • Cancel anytime
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Annual Savings Highlight */}
      {billingCycle === 'annual' && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-center space-x-2 text-green-700">
            <Calendar className="w-5 h-5" />
            <span className="font-medium">
              Annual billing saves you up to $39.88 per year
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}

export function GiftSubscriptionCard({ onGiftPurchase }: { onGiftPurchase: (planId: string, duration: number) => void }) {
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [duration, setDuration] = useState(3); // months

  const giftOptions = [
    { months: 1, label: "1 Month", popular: false },
    { months: 3, label: "3 Months", popular: true },
    { months: 6, label: "6 Months", popular: false },
    { months: 12, label: "1 Year", popular: false }
  ];

  const calculateGiftPrice = (planId: string, months: number) => {
    const plan = optimizedPlans.find(p => p.id === planId);
    if (!plan || plan.monthlyPrice === 0) return 0;
    
    // Apply bulk discount for longer gifts
    const basePrice = plan.monthlyPrice * months;
    const discount = months >= 12 ? 0.17 : months >= 6 ? 0.10 : months >= 3 ? 0.05 : 0;
    return basePrice * (1 - discount);
  };

  return (
    <Card className="p-6 space-y-6 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/30">
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
            <Gift className="w-6 h-6 text-accent" />
          </div>
        </div>
        <h3 className="text-xl font-semibold">Gift a Mindful Journey</h3>
        <p className="text-wisdom/70">
          Give someone you care about the gift of emotional wellness and self-discovery
        </p>
      </div>

      {/* Plan Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-wisdom">Choose Plan</label>
        <div className="grid grid-cols-2 gap-3">
          {optimizedPlans.filter(p => p.monthlyPrice > 0).map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedPlan === plan.id 
                  ? 'border-primary bg-primary/10' 
                  : 'border-gentle hover:border-primary/50'
              }`}
            >
              <div className="font-medium">{plan.name}</div>
              <div className="text-sm text-wisdom/60">${plan.monthlyPrice}/month</div>
            </button>
          ))}
        </div>
      </div>

      {/* Duration Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-wisdom">Gift Duration</label>
        <div className="grid grid-cols-2 gap-3">
          {giftOptions.map((option) => (
            <button
              key={option.months}
              onClick={() => setDuration(option.months)}
              className={`p-3 rounded-lg border text-center transition-all relative ${
                duration === option.months 
                  ? 'border-accent bg-accent/10' 
                  : 'border-gentle hover:border-accent/50'
              }`}
            >
              {option.popular && (
                <Badge className="absolute -top-2 -right-2 bg-accent text-white text-xs">
                  Popular
                </Badge>
              )}
              <div className="font-medium">{option.label}</div>
              {option.months >= 3 && (
                <div className="text-xs text-green-600">Save {option.months >= 12 ? '17%' : option.months >= 6 ? '10%' : '5%'}</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Price Summary */}
      <div className="bg-white/80 rounded-lg p-4 space-y-2">
        <div className="flex justify-between">
          <span>Plan:</span>
          <span className="font-medium">
            {optimizedPlans.find(p => p.id === selectedPlan)?.name}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Duration:</span>
          <span className="font-medium">{duration} {duration === 1 ? 'month' : 'months'}</span>
        </div>
        <div className="border-t pt-2 flex justify-between text-lg font-semibold">
          <span>Total:</span>
          <span className="text-primary">${calculateGiftPrice(selectedPlan, duration).toFixed(2)}</span>
        </div>
      </div>

      {/* Gift Purchase Button */}
      <Button
        onClick={() => onGiftPurchase(selectedPlan, duration)}
        className="w-full bg-accent hover:bg-accent/90"
      >
        <Gift className="w-4 h-4 mr-2" />
        Purchase Gift Subscription
      </Button>

      <div className="text-center text-xs text-wisdom/60">
        Gift recipient will receive an email with instructions to redeem
      </div>
    </Card>
  );
}