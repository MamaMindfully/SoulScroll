import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Crown, 
  Check, 
  Sparkles, 
  Mic, 
  FileText, 
  Brain,
  Heart,
  Zap,
  Star,
  ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  popular?: boolean;
}

interface UserSubscription {
  planType: string;
  status: string;
  currentPeriodEnd: string;
}

export default function PremiumSubscriptionComponent() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: subscription } = useQuery<UserSubscription>({
    queryKey: ["/api/subscription"],
  });

  const { data: plans } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription/plans"],
  });

  const subscribeMutation = useMutation({
    mutationFn: async (planId: string) => {
      return await apiRequest("POST", "/api/subscription/create", { planId });
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast({
        title: "Subscription failed",
        description: "Unable to process subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const defaultPlans: SubscriptionPlan[] = [
    {
      id: "free",
      name: "Free",
      price: 0,
      interval: "forever",
      features: [
        "5 journal entries per month",
        "Basic emotional analysis",
        "Daily prompts",
        "Mobile app access"
      ]
    },
    {
      id: "premium",
      name: "Premium",
      price: 9.99,
      interval: "month",
      popular: true,
      features: [
        "Unlimited journal entries",
        "Advanced AI emotional analysis",
        "Voice journaling with transcription",
        "Personalized daily prompts",
        "Weekly insights & patterns",
        "Mood prediction insights",
        "Premium themes & customization",
        "Priority support"
      ]
    },
    {
      id: "premium_plus",
      name: "Premium Plus",
      price: 19.99,
      interval: "month",
      features: [
        "Everything in Premium",
        "Monthly reflection letters",
        "Health data integration",
        "Community mood sharing",
        "Advanced coping strategies",
        "Data export (PDF, JSON)",
        "Early access to new features",
        "1-on-1 coaching session"
      ]
    }
  ];

  const activePlans = plans || defaultPlans;
  const isPremium = subscription?.planType !== "free" && subscription?.status === "active";

  const handleSubscribe = (planId: string) => {
    if (planId === "free") {
      toast({
        title: "Already on Free plan",
        description: "You're currently using the free tier of Luma.",
      });
      return;
    }
    
    setSelectedPlan(planId);
    subscribeMutation.mutate(planId);
  };

  const formatPrice = (price: number, interval: string) => {
    if (price === 0) return "Free";
    return `$${price}/${interval}`;
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case "free": return <Heart className="w-5 h-5" />;
      case "premium": return <Crown className="w-5 h-5" />;
      case "premium plus": return <Sparkles className="w-5 h-5" />;
      default: return <Star className="w-5 h-5" />;
    }
  };

  if (isPremium) {
    return (
      <Card className="mb-6 border-warmth bg-gradient-to-br from-serenity/20 to-warmth/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crown className="w-6 h-6 text-warmth" />
              <CardTitle className="text-wisdom">Premium Member</CardTitle>
              <Badge className="bg-warmth text-white">
                {subscription?.planType?.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <Sparkles className="w-5 h-5 text-warmth" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-wisdom/80">
              You're enjoying all premium features! Your subscription renews on{" "}
              {subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "..."}
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2 text-sm text-wisdom">
                <Check className="w-4 h-4 text-green-600" />
                <span>Unlimited entries</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-wisdom">
                <Check className="w-4 h-4 text-green-600" />
                <span>Voice journaling</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-wisdom">
                <Check className="w-4 h-4 text-green-600" />
                <span>AI insights</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-wisdom">
                <Check className="w-4 h-4 text-green-600" />
                <span>Premium support</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full border-warmth text-warmth hover:bg-warmth hover:text-white"
              onClick={() => window.open('/api/subscription/portal', '_blank')}
            >
              Manage Subscription
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-warmth bg-gradient-to-br from-serenity/20 to-warmth/10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-warmth flex items-center justify-center">
              <Crown className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-wisdom">Unlock Your Full Potential</CardTitle>
          <p className="text-wisdom/80 max-w-2xl mx-auto">
            Upgrade to Premium for unlimited journaling, AI-powered insights, and personalized growth tools.
          </p>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {activePlans.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative transition-all duration-300 ${
              plan.popular 
                ? 'border-warmth border-2 shadow-lg scale-105' 
                : 'border-gray-200 hover:border-warmth hover:shadow-md'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-warmth text-white px-4 py-1">
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <div className="flex justify-center mb-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  plan.popular ? 'bg-warmth text-white' : 'bg-gray-100 text-wisdom'
                }`}>
                  {getPlanIcon(plan.name)}
                </div>
              </div>
              <CardTitle className="text-xl text-wisdom">{plan.name}</CardTitle>
              <div className="text-3xl font-bold text-wisdom">
                {formatPrice(plan.price, plan.interval)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-wisdom/90">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Separator />
              
              <Button
                onClick={() => handleSubscribe(plan.id)}
                disabled={subscribeMutation.isPending && selectedPlan === plan.id}
                className={`w-full ${
                  plan.popular
                    ? 'bg-warmth hover:bg-warmth/90 text-white'
                    : 'bg-white border border-warmth text-warmth hover:bg-warmth hover:text-white'
                }`}
              >
                {subscribeMutation.isPending && selectedPlan === plan.id ? (
                  "Processing..."
                ) : plan.id === "free" ? (
                  "Current Plan"
                ) : (
                  <>
                    Upgrade Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-serenity/30 bg-gradient-to-r from-serenity/10 to-warmth/10">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-serenity/20 flex items-center justify-center mx-auto">
                <Mic className="w-6 h-6 text-serenity" />
              </div>
              <h3 className="font-medium text-wisdom">Voice Journaling</h3>
              <p className="text-sm text-wisdom/70">Record your thoughts naturally with AI transcription</p>
            </div>
            
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-warmth/20 flex items-center justify-center mx-auto">
                <Brain className="w-6 h-6 text-warmth" />
              </div>
              <h3 className="font-medium text-wisdom">AI Insights</h3>
              <p className="text-sm text-wisdom/70">Get personalized emotional patterns and predictions</p>
            </div>
            
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-serenity/20 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6 text-serenity" />
              </div>
              <h3 className="font-medium text-wisdom">Reflection Letters</h3>
              <p className="text-sm text-wisdom/70">Monthly AI-generated summaries of your journey</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}