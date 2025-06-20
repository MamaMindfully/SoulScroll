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
import { isPremiumUser, getPremiumFeatures } from '../utils/SubscriptionEngine';
import { exportJournalToPDF } from '../utils/PDFExportEngine';

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const isPremium = isPremiumUser();
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
    <div className="app-container bg-white">
      {/* Status Bar */}
      <div className="status-bar px-4 py-2 text-white text-sm flex justify-between items-center">
        <span className="font-medium">9:41 AM</span>
        <div className="flex items-center space-x-1 text-xs">
          <span>••••</span>
          <span>📶</span>
          <span>📶</span>
          <span>🔋</span>
        </div>
      </div>

      {/* App Header */}
      <AppHeader isOnline={isOnline} />

      {/* Main Content */}
      <main className="main-content">
        {/* Daily Prompt */}
        <DailyPrompt />

        {/* Journal Editor */}
        <JournalEditor />

        {/* AI Reflection */}
        <AIReflection />

        {/* Emotional Dashboard */}
        <EmotionalDashboard />

        {/* Premium Preview */}
        {!isPremium && (
          <div className="mx-4 mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <h3 className="text-lg font-bold text-purple-800 mb-3">🌟 Unlock SoulScroll Premium</h3>
            <ul className="space-y-2 mb-4">
              {getPremiumFeatures().map((feature, index) => (
                <li key={index} className="text-sm text-purple-700 flex items-center">
                  <span className="mr-2">•</span>
                  {feature}
                </li>
              ))}
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
  );
}
