import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Mail, Mic, Palette, Download, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PremiumStatus {
  isPremium: boolean;
}

export default function PremiumPreview() {
  const { toast } = useToast();

  const { data: premiumStatus } = useQuery<PremiumStatus>({
    queryKey: ["/api/user/premium-status"],
  });

  const handlePremiumUpgrade = () => {
    toast({
      title: "Premium Features",
      description: "Start your 7-day free trial to unlock unlimited journaling and exclusive features!",
    });
  };

  // Don't show premium preview if user is already premium
  if (premiumStatus?.isPremium) {
    return null;
  }

  const premiumFeatures = [
    {
      icon: Mail,
      title: "Monthly reflection letters",
      description: "Personalized AI letters summarizing your growth",
    },
    {
      icon: Mic,
      title: "Unlimited voice journaling",
      description: "Speak your thoughts and let Luma transcribe",
    },
    {
      icon: Palette,
      title: "Themed journal prompts",
      description: "Specialized prompts for grief, creativity, relationships",
    },
    {
      icon: Download,
      title: "Export your journal as a book",
      description: "Create a beautiful hardcover of your journey",
    },
  ];

  return (
    <section className="p-6">
      <Card className="bg-gradient-to-br from-accent/5 to-primary/5 border border-accent/20 animate-fade-in">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-wisdom flex items-center">
              <Sparkles className="w-4 h-4 text-accent mr-2" />
              Unlock Your Full Journey
            </h3>
            <span className="px-2 py-1 bg-accent text-white text-xs rounded-full font-medium flex items-center">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </span>
          </div>
          
          <div className="space-y-3 mb-6">
            {premiumFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-3 h-3 text-accent" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-wisdom">{feature.title}</div>
                    <div className="text-xs text-wisdom/70 leading-relaxed">{feature.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="text-center mb-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-lg font-bold text-wisdom">$4.99</span>
              <span className="text-sm text-wisdom/70">/month</span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                7-day free trial
              </span>
            </div>
            <p className="text-xs text-wisdom/60">
              Or get lifetime access for $49.99
            </p>
          </div>
          
          <Button 
            onClick={handlePremiumUpgrade}
            className="w-full bg-accent hover:bg-accent/90 text-white py-3 rounded-lg font-medium shadow-lg"
          >
            Start Free Trial
          </Button>
          
          <p className="text-xs text-wisdom/50 text-center mt-3">
            Cancel anytime • No commitment required
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
