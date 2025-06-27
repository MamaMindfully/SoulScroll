import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Lock, Sparkles, Heart, Zap, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface PaywallTrigger {
  trigger: 'entry_limit' | 'ai_responses' | 'voice_feature' | 'export_feature' | 'analytics';
  message: string;
  urgency: 'low' | 'medium' | 'high';
}

const paywallTriggers: PaywallTrigger[] = [
  {
    trigger: 'entry_limit',
    message: "You've written 5 beautiful entries this month. Unlock unlimited journaling to continue your growth journey.",
    urgency: 'high'
  },
  {
    trigger: 'ai_responses',
    message: "Your next AI reflection awaits. Premium unlocks unlimited deep conversations with Luma.",
    urgency: 'medium'
  },
  {
    trigger: 'voice_feature',
    message: "Voice journaling helps capture emotions in the moment. Try speaking your thoughts with premium.",
    urgency: 'low'
  }
];

export function SmartPaywall({ trigger, onUpgrade }: { trigger: PaywallTrigger['trigger'], onUpgrade: () => void }) {
  const triggerData = paywallTriggers.find(t => t.trigger === trigger) || paywallTriggers[0];
  
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-50 border-red-200';
      case 'medium': return 'bg-amber-50 border-amber-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <Card className={`p-6 text-center space-y-4 ${getUrgencyColor(triggerData.urgency)}`}>
      <div className="flex justify-center">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Crown className="w-6 h-6 text-primary" />
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="font-semibold text-lg text-wisdom">Continue Your Journey</h3>
        <p className="text-wisdom/70">{triggerData.message}</p>
      </div>

      <div className="space-y-3">
        <Button onClick={onUpgrade} className="w-full bg-primary hover:bg-primary/90">
          <Crown className="w-4 h-4 mr-2" />
          Start 7-Day Free Trial
        </Button>
        
        <div className="text-xs text-wisdom/60">
          Cancel anytime • No commitment • Full access during trial
        </div>
      </div>
    </Card>
  );
}

export function ValuePropDisplay({ planType }: { planType: 'basic' | 'premium' | 'plus' }) {
  const plans = {
    basic: {
      name: "Free Forever",
      price: "$0",
      features: ["5 entries per month", "Basic AI responses", "Simple mood tracking"],
      limitations: true
    },
    premium: {
      name: "Premium",
      price: "$8.99/month",
      features: [
        "Unlimited entries",
        "Advanced AI conversations", 
        "Voice journaling",
        "Monthly reflection letters",
        "Mood analytics",
        "Export as PDF"
      ],
      popular: true
    },
    plus: {
      name: "Premium Plus",
      price: "$19.99/month", 
      features: [
        "Everything in Premium",
        "Priority AI responses",
        "Custom prompts",
        "Hardcover book printing",
        "Advanced analytics",
        "1-on-1 guidance calls"
      ],
      premium: true
    }
  };

  const plan = plans[planType];

  return (
    <Card className={`p-6 relative ${plan.popular ? 'border-primary border-2' : ''}`}>
      {plan.popular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
          Most Popular
        </Badge>
      )}
      
      <div className="text-center space-y-4">
        <div>
          <h3 className="font-semibold text-lg">{plan.name}</h3>
          <div className="text-2xl font-bold text-primary">{plan.price}</div>
        </div>
        
        <ul className="space-y-2 text-sm text-wisdom/70">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button 
          className={`w-full ${plan.premium ? 'bg-gradient-to-r from-primary to-accent' : 'bg-primary'}`}
          variant={plan.limitations ? 'outline' : 'default'}
        >
          {plan.limitations ? 'Current Plan' : plan.popular ? 'Start Free Trial' : 'Upgrade Now'}
        </Button>
      </div>
    </Card>
  );
}

export function UsageProgressBar({ used, limit, feature }: { used: number, limit: number, feature: string }) {
  const percentage = Math.min((used / limit) * 100, 100);
  const isNearLimit = percentage > 80;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-wisdom/70">{feature}</span>
        <span className={`${isNearLimit ? 'text-red-500' : 'text-wisdom/70'}`}>
          {used}/{limit}
        </span>
      </div>
      
      <div className="w-full bg-gentle rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all ${
            isNearLimit ? 'bg-red-400' : 'bg-primary'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {isNearLimit && (
        <div className="text-xs text-red-600">
          You're almost at your limit. Upgrade to continue.
        </div>
      )}
    </div>
  );
}