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

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
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

  // Auto-launch morning flow during morning hours
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const now = new Date();
      const hour = now.getHours();
      
      // Check if it's morning time (4 AM to 10 AM) and user hasn't done morning ritual today
      if (hour >= 4 && hour <= 10) {
        const today = new Date().toDateString();
        const lastMorningRitual = localStorage.getItem('last-morning-ritual');
        
        if (lastMorningRitual !== today) {
          // Navigate to morning flow if not completed today
          setTimeout(() => {
            setLocation('/morning');
          }, 1000); // Small delay to ensure smooth transition
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

      {/* Bottom Navigation */}
      <BottomNavigation currentPage="write" />
    </div>
  );
}
