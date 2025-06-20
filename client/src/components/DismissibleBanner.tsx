import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Heart } from "lucide-react";

interface DismissibleBannerProps {
  type?: 'welcome' | 'achievement' | 'tip' | 'update';
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  dismissKey?: string;
  showCondition?: () => boolean;
}

const DismissibleBanner: React.FC<DismissibleBannerProps> = ({
  type = 'welcome',
  title,
  message,
  actionLabel,
  onAction,
  dismissKey,
  showCondition
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    checkShouldShow();
  }, []);

  const checkShouldShow = () => {
    // Check user preferences and history
    const hasLoggedIn = localStorage.getItem('soulscroll-has-logged-in') === 'true';
    const hasCompletedFirstEntry = localStorage.getItem('soulscroll-journal-history') 
      && JSON.parse(localStorage.getItem('soulscroll-journal-history') || '[]').length > 0;
    
    // Check if banner was previously dismissed
    const dismissedBanners = JSON.parse(localStorage.getItem('soulscroll-dismissed-banners') || '[]');
    const wasDismissed = dismissKey && dismissedBanners.includes(dismissKey);
    
    // Custom show condition
    const customCondition = showCondition ? showCondition() : true;
    
    // Default behavior: hide if user has experience or custom logic
    let shouldShow = true;
    
    if (type === 'welcome') {
      shouldShow = !hasLoggedIn && !hasCompletedFirstEntry;
    }
    
    if (wasDismissed || !customCondition) {
      shouldShow = false;
    }
    
    setIsVisible(shouldShow);
  };

  const handleDismiss = () => {
    setIsAnimating(true);
    
    // Save dismissal state
    if (dismissKey) {
      const dismissedBanners = JSON.parse(localStorage.getItem('soulscroll-dismissed-banners') || '[]');
      dismissedBanners.push(dismissKey);
      localStorage.setItem('soulscroll-dismissed-banners', JSON.stringify(dismissedBanners));
    }
    
    setTimeout(() => {
      setIsVisible(false);
      setIsAnimating(false);
    }, 300);
  };

  const getBannerContent = () => {
    switch (type) {
      case 'welcome':
        return {
          title: title || 'Welcome to SoulScroll',
          message: message || 'Your journey of self-discovery begins here. Start by writing your first reflection.',
          actionLabel: actionLabel || 'Start Writing',
          icon: Heart,
          gradient: 'from-purple-500 to-pink-500'
        };
      case 'achievement':
        return {
          title: title || 'Achievement Unlocked!',
          message: message || 'You\'ve reached a new milestone in your journaling journey.',
          actionLabel: actionLabel || 'View Achievements',
          icon: Sparkles,
          gradient: 'from-yellow-500 to-orange-500'
        };
      case 'tip':
        return {
          title: title || 'Pro Tip',
          message: message || 'Try using voice journaling for a more natural reflection experience.',
          actionLabel: actionLabel || 'Learn More',
          icon: Sparkles,
          gradient: 'from-blue-500 to-indigo-500'
        };
      case 'update':
        return {
          title: title || 'New Features Available',
          message: message || 'Discover new ways to explore your inner wisdom.',
          actionLabel: actionLabel || 'Explore',
          icon: Sparkles,
          gradient: 'from-green-500 to-emerald-500'
        };
      default:
        return {
          title: title || 'SoulScroll',
          message: message || 'Continue your journey of self-discovery.',
          actionLabel: actionLabel || 'Continue',
          icon: Heart,
          gradient: 'from-purple-500 to-pink-500'
        };
    }
  };

  if (!isVisible) return null;

  const content = getBannerContent();
  const IconComponent = content.icon;

  return (
    <div className={`dismissible-banner ${isAnimating ? 'hidden' : ''} mb-6`}>
      <Card className={`border-0 bg-gradient-to-r ${content.gradient} text-white shadow-lg`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="bg-white/20 p-2 rounded-full">
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white mb-1">
                  {content.title}
                </h3>
                <p className="text-white/90 text-sm leading-relaxed">
                  {content.message}
                </p>
                {onAction && (
                  <Button
                    onClick={onAction}
                    variant="outline"
                    size="sm"
                    className="mt-3 bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    {content.actionLabel}
                  </Button>
                )}
              </div>
            </div>
            
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10 p-1 h-auto min-h-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DismissibleBanner;