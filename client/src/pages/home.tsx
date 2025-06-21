import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import AppHeader from "@/components/AppHeader";
import DailyPrompt from "@/components/DailyPrompt";
import JournalEditor from "@/components/JournalEditor";
import AIReflection from "@/components/AIReflection";
import EmotionalDashboard from "@/components/EmotionalDashboard";
import PremiumPreview from "@/components/PremiumPreview";
import BottomNavigation from "@/components/BottomNavigation";
import FloatingActionButton from "@/components/FloatingActionButton";
import DismissibleBanner from "@/components/DismissibleBanner";
import DailyRitualCard from "@/components/DailyRitualCard";
import ReflectionResponse from "@/components/ReflectionResponse";
import LoadingState from "@/components/LoadingState";
import OfflineIndicator from "@/components/OfflineIndicator";
import PerformanceOptimizer from "@/components/PerformanceOptimizer";
import { usePremium } from "@/context/PremiumContext";
import { PremiumGate } from "@/components/PremiumGate";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { isPremium, refreshPremiumStatus, premiumFeatures } = usePremium();

  const togglePremiumMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/user/toggle-premium");
      return response.json();
    },
    onSuccess: () => {
      refreshPremiumStatus();
      toast({
        title: "Premium Status Updated",
        description: "Your premium status has been toggled for testing.",
      });
    },
  });
  const [, setLocation] = useLocation();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Auto-launch ritual flows during appropriate hours
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const now = new Date();
      const hour = now.getHours();
      const today = new Date().toDateString();
      
      // Check if it's morning time (4 AM to 10 AM) and user hasn't done morning ritual today
      if (hour >= 4 && hour <= 10) {
        const lastMorningRitual = localStorage.getItem('last-morning-ritual');
        
        if (lastMorningRitual !== today) {
          // Navigate to morning flow if not completed today
          setTimeout(() => {
            setLocation('/morning');
          }, 1000);
        }
      }
      // Check if it's evening time (6 PM to 11 PM) and user hasn't done evening ritual today
      else if (hour >= 18 && hour <= 23) {
        const lastEveningRitual = localStorage.getItem('last-evening-ritual');
        
        if (lastEveningRitual !== today) {
          // Navigate to evening flow if not completed today
          setTimeout(() => {
            setLocation('/evening');
          }, 1000);
        }
      }
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="app-container bg-white flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full emotion-gradient"></div>
          <p className="text-wisdom">Loading your journal...</p>
        </div>
      </div>
    );
  }

  return (
    <PerformanceOptimizer>
      <div className="viewport-height bg-white">
        {/* Offline Indicator */}
        <OfflineIndicator />

        {/* App Header */}
        <AppHeader isOnline={isOnline} />

        {/* Main Content */}
        <main className="main-content">
        {/* Premium Testing Toggle */}
        <div className="premium-toggle mx-4">
          <div className="flex items-center justify-between">
            <div className={`premium-status-indicator ${isPremium ? 'premium' : 'free'}`}>
              <span>Testing Mode: {isPremium ? "Premium 💎" : "Free"}</span>
              {isPremium && <span className="premium-badge">Premium</span>}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => togglePremiumMutation.mutate()}
              disabled={togglePremiumMutation.isPending}
              className="premium-button"
            >
              {togglePremiumMutation.isPending ? "Updating..." : "Toggle Premium"}
            </Button>
          </div>
        </div>

        {/* Daily Prompt */}
        <DailyPrompt />

        {/* Journal Editor */}
        <JournalEditor />

        {/* AI Reflection */}
        <AIReflection />
        
        {/* AI Reflection will be integrated into JournalEditor */}

        {/* Emotional Dashboard */}
        <EmotionalDashboard />

        {/* Premium Preview */}
        {!isPremium && premiumFeatures && (
          <div className="mx-4 mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <h3 className="text-lg font-bold text-purple-800 mb-3">🌟 Unlock SoulScroll Premium</h3>
            <ul className="space-y-2 mb-4">
              <li className="text-sm text-purple-700 flex items-center">
                <span className="mr-2">•</span>
                Voice Journaling & Transcription
              </li>
              <li className="text-sm text-purple-700 flex items-center">
                <span className="mr-2">•</span>
                Dream Interpretation & Analysis
              </li>
              <li className="text-sm text-purple-700 flex items-center">
                <span className="mr-2">•</span>
                Advanced AI Insights & Reflections
              </li>
              <li className="text-sm text-purple-700 flex items-center">
                <span className="mr-2">•</span>
                Unlimited Journal Entries
              </li>
              <li className="text-sm text-purple-700 flex items-center">
                <span className="mr-2">•</span>
                PDF Export & Data Export
              </li>
            </ul>
            <button 
              onClick={() => setLocation('/pricing')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium py-2 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
            >
              Upgrade to Premium
            </button>
          </div>
        )}
        <PremiumPreview />

        {/* Offline Banner */}
        {!isOnline && (
          <div className="fixed bottom-20 left-4 right-4 bg-wisdom text-white rounded-lg px-4 py-2 shadow-lg animate-slide-up z-20">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
              <span className="text-xs font-medium">Offline Mode - Your entries are being saved locally</span>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton />

        {/* Bottom Navigation */}
        <BottomNavigation currentPage="write" />
      </div>
    </PerformanceOptimizer>
  );
}
