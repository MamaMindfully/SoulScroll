import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, Gift, Clock, Target, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// Revenue optimization strategies for maximum monetization

export function FreeTrialCountdown({ daysLeft }: { daysLeft: number }) {
  const urgencyLevel = daysLeft <= 2 ? 'high' : daysLeft <= 4 ? 'medium' : 'low';
  
  return (
    <Card className={`p-4 border-2 ${
      urgencyLevel === 'high' ? 'border-red-400 bg-red-50' : 
      urgencyLevel === 'medium' ? 'border-amber-400 bg-amber-50' : 
      'border-blue-400 bg-blue-50'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Clock className={`w-5 h-5 ${
            urgencyLevel === 'high' ? 'text-red-500' : 
            urgencyLevel === 'medium' ? 'text-amber-500' : 
            'text-blue-500'
          }`} />
          <div>
            <div className="font-semibold">
              {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left in your free trial
            </div>
            <div className="text-sm text-wisdom/70">
              Don't lose access to unlimited journaling and AI insights
            </div>
          </div>
        </div>
        <Button size="sm" className="bg-primary hover:bg-primary/90">
          Continue Premium
        </Button>
      </div>
    </Card>
  );
}

export function FeatureTeaser({ feature, onUpgrade }: { 
  feature: 'voice' | 'analytics' | 'export' | 'letters', 
  onUpgrade: () => void 
}) {
  const teasers = {
    voice: {
      icon: <Zap className="w-5 h-5" />,
      title: "Voice Journaling",
      description: "Capture emotions in real-time by speaking your thoughts",
      preview: "Try saying: 'I'm feeling overwhelmed today because...'",
      value: "Save 5-10 minutes per entry"
    },
    analytics: {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Emotional Analytics", 
      description: "See patterns in your emotional journey over time",
      preview: "Your happiness increased 23% this month",
      value: "Understand your emotional patterns"
    },
    export: {
      icon: <Gift className="w-5 h-5" />,
      title: "Beautiful PDF Export",
      description: "Transform your journal into a keepsake book",
      preview: "Create a 50-page personalized journal book",
      value: "Preserve your growth journey forever"
    },
    letters: {
      icon: <Crown className="w-5 h-5" />,
      title: "Monthly Reflection Letters",
      description: "AI writes you personal letters about your growth",
      preview: "Dear Sarah, this month you've shown incredible resilience...",
      value: "Get perspective on your journey"
    }
  };

  const teaser = teasers[feature];

  return (
    <Card className="p-6 space-y-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
          {teaser.icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{teaser.title}</h3>
          <p className="text-wisdom/70 mb-2">{teaser.description}</p>
          <div className="bg-white/50 p-3 rounded-lg border border-primary/10 italic text-sm">
            "{teaser.preview}"
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          {teaser.value}
        </Badge>
        <Button onClick={onUpgrade} size="sm">
          <Crown className="w-4 h-4 mr-1" />
          Unlock Now
        </Button>
      </div>
    </Card>
  );
}

export function LimitedTimeOffer({ onAccept }: { onAccept: () => void }) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 45,
    seconds: 30
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="p-6 bg-gradient-to-r from-primary to-accent text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
      
      <div className="relative space-y-4">
        <div className="text-center">
          <Badge className="bg-white/20 text-white border-white/30 mb-3">
            Limited Time Offer
          </Badge>
          <h3 className="text-xl font-bold">50% Off Premium</h3>
          <p className="text-white/90">Just $4.99/month for your first 3 months</p>
        </div>

        <div className="flex justify-center space-x-4 text-center">
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-2xl font-bold">{timeLeft.hours}</div>
            <div className="text-xs">Hours</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-2xl font-bold">{timeLeft.minutes}</div>
            <div className="text-xs">Minutes</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-2xl font-bold">{timeLeft.seconds}</div>
            <div className="text-xs">Seconds</div>
          </div>
        </div>

        <Button 
          onClick={onAccept}
          className="w-full bg-white text-primary hover:bg-white/90 font-semibold"
        >
          Claim 50% Discount Now
        </Button>
        
        <div className="text-center text-xs text-white/80">
          This offer expires soon and won't be repeated
        </div>
      </div>
    </Card>
  );
}

export function SocialProof() {
  const testimonials = [
    {
      text: "Luma helped me process my anxiety in ways I never thought possible. The AI responses feel like talking to a wise friend.",
      author: "Sarah M.",
      role: "Premium User"
    },
    {
      text: "The monthly reflection letters make me cry every time. It's like getting a letter from my future self.",
      author: "Michael K.", 
      role: "Premium Plus User"
    },
    {
      text: "Voice journaling changed everything. I can capture thoughts while driving or walking. Game changer.",
      author: "Jessica L.",
      role: "Premium User"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="font-semibold text-lg mb-2">Loved by 10,000+ journalers</h3>
        <div className="flex justify-center space-x-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-5 h-5 text-yellow-400 fill-current">★</div>
          ))}
          <span className="ml-2 text-wisdom/70">4.9/5 rating</span>
        </div>
      </div>

      <div className="grid gap-4">
        {testimonials.map((testimonial, index) => (
          <Card key={index} className="p-4">
            <p className="italic text-wisdom/80 mb-2">"{testimonial.text}"</p>
            <div className="text-sm">
              <span className="font-medium">{testimonial.author}</span>
              <span className="text-wisdom/60"> • {testimonial.role}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ProgressTowards({ goal, current, feature }: { 
  goal: number, 
  current: number, 
  feature: string 
}) {
  const percentage = Math.min((current / goal) * 100, 100);
  const remaining = Math.max(goal - current, 0);

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-medium">{feature} Progress</span>
          <Badge variant="outline">{current}/{goal}</Badge>
        </div>
        
        <div className="w-full bg-gentle rounded-full h-3">
          <div 
            className="h-3 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <div className="text-sm text-wisdom/70">
          {remaining > 0 ? (
            `${remaining} more to unlock next milestone`
          ) : (
            "Milestone achieved! 🎉"
          )}
        </div>
      </div>
    </Card>
  );
}