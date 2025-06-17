import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { OptimizedPricingCards, GiftSubscriptionCard } from "@/components/PricingOptimization";
import { SocialProof, LimitedTimeOffer } from "@/components/RevenueOptimization";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Shield, Users, Clock } from "lucide-react";

export default function Pricing() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [showLimitedOffer, setShowLimitedOffer] = useState(true);

  const subscriptionMutation = useMutation({
    mutationFn: async ({ planId, billing }: { planId: string; billing: 'monthly' | 'annual' }) => {
      if (billing === 'annual') {
        return await apiRequest("POST", "/api/subscriptions/annual", { planId });
      } else {
        return await apiRequest("POST", "/api/subscriptions/monthly", { planId });
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Subscription Created",
        description: `Welcome to ${data.planId}! Your journey to deeper self-discovery begins now.`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Please sign in",
          description: "Sign in to start your premium journey",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1000);
        return;
      }
      toast({
        title: "Subscription Error",
        description: "Unable to process subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const giftMutation = useMutation({
    mutationFn: async ({ planId, duration }: { planId: string; duration: number }) => {
      return await apiRequest("POST", "/api/subscriptions/gift", { 
        planId, 
        duration,
        recipientEmail: "recipient@example.com", // Would be from form
        giftMessage: "Thought you'd love this mindful journey"
      });
    },
    onSuccess: () => {
      toast({
        title: "Gift Purchased",
        description: "Your thoughtful gift has been sent! They'll receive an email shortly.",
      });
    },
    onError: (error) => {
      toast({
        title: "Gift Purchase Failed",
        description: "Unable to process gift purchase. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = (planId: string, billing: 'monthly' | 'annual') => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to start your premium journey",
      });
      window.location.href = "/api/login";
      return;
    }

    subscriptionMutation.mutate({ planId, billing });
  };

  const handleGiftPurchase = (planId: string, duration: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required", 
        description: "Please sign in to purchase a gift subscription",
      });
      window.location.href = "/api/login";
      return;
    }

    giftMutation.mutate({ planId, duration });
  };

  const handleLimitedOfferAccept = () => {
    handleSubscribe('premium', 'monthly');
    setShowLimitedOffer(false);
  };

  return (
    <div className="min-h-screen bg-calm">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-wisdom">
            Choose Your Path to
            <span className="text-primary"> Emotional Wellness</span>
          </h1>
          <p className="text-lg text-wisdom/70 leading-relaxed">
            Join thousands of people who've discovered deeper self-awareness through AI-powered journaling. 
            Start your journey today with our risk-free trial.
          </p>
          
          {/* Trust indicators */}
          <div className="flex justify-center items-center space-x-8 text-sm text-wisdom/60">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Privacy protected</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>10,000+ active users</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>7-day free trial</span>
            </div>
          </div>
        </div>

        {/* Limited Time Offer */}
        {showLimitedOffer && (
          <div className="max-w-lg mx-auto">
            <LimitedTimeOffer onAccept={handleLimitedOfferAccept} />
          </div>
        )}

        {/* Pricing Plans */}
        <Tabs defaultValue="subscribe" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="subscribe">For Yourself</TabsTrigger>
            <TabsTrigger value="gift">Gift Someone</TabsTrigger>
          </TabsList>
          
          <TabsContent value="subscribe" className="space-y-8">
            <OptimizedPricingCards onSubscribe={handleSubscribe} />
          </TabsContent>
          
          <TabsContent value="gift" className="space-y-8">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-2xl font-semibold text-wisdom">
                Give the Gift of Self-Discovery
              </h2>
              <p className="text-wisdom/70 max-w-2xl mx-auto">
                Perfect for birthdays, holidays, or any time you want to support someone's emotional wellness journey.
              </p>
            </div>
            
            <div className="max-w-lg mx-auto">
              <GiftSubscriptionCard onGiftPurchase={handleGiftPurchase} />
            </div>
          </TabsContent>
        </Tabs>

        {/* Value Propositions */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold">Emotional Intelligence</h3>
            <p className="text-sm text-wisdom/70">
              AI that understands your emotions and responds with genuine empathy and insight
            </p>
          </Card>
          
          <Card className="p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-semibold">Complete Privacy</h3>
            <p className="text-sm text-wisdom/70">
              Your thoughts are encrypted and secure. Delete your data anytime with one click
            </p>
          </Card>
          
          <Card className="p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold">Growing Community</h3>
            <p className="text-sm text-wisdom/70">
              Join a supportive community of people committed to emotional growth and wellness
            </p>
          </Card>
        </div>

        {/* Social Proof */}
        <div className="max-w-4xl mx-auto">
          <SocialProof />
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl font-semibold text-center text-wisdom">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            {[
              {
                q: "How does the 7-day free trial work?",
                a: "Start using all premium features immediately. Cancel anytime during your trial and you won't be charged."
              },
              {
                q: "Can I switch between monthly and annual billing?",
                a: "Yes, you can change your billing cycle anytime from your account settings."
              },
              {
                q: "How do gift subscriptions work?",
                a: "Purchase a gift subscription and we'll send the recipient an email with instructions to activate their account."
              },
              {
                q: "Is my journal data private and secure?",
                a: "Absolutely. All your data is encrypted and you can delete everything with one click anytime."
              }
            ].map((faq, index) => (
              <Card key={index} className="p-4">
                <h4 className="font-medium mb-2">{faq.q}</h4>
                <p className="text-sm text-wisdom/70">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold text-wisdom">
            Ready to begin your journey?
          </h3>
          <p className="text-wisdom/70">
            Start your 7-day free trial today. No commitment, cancel anytime.
          </p>
          <Button
            onClick={() => handleSubscribe('premium', 'annual')}
            size="lg"
            className="bg-primary hover:bg-primary/90"
          >
            Start Free Trial
          </Button>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
}