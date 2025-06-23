import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { PremiumProvider } from "@/context/PremiumContext";
import { AppProvider } from "@/context/AppContext";
import { ThemeProvider } from "@/context/ThemeContext";
import NavigationBar from "@/components/NavigationBar";
import ErrorBoundaryWrapper from "@/components/ErrorBoundary";
import FloatingStartButton from "@/components/FloatingStartButton";
import PerformanceMonitor from "@/components/PerformanceMonitor";
// Removed useUserStatusSync to prevent hook violations
import MobileTouchOptimizations from "@/components/MobileTouchOptimizations";
import { AppStoreMetadata } from "@/components/AppStoreOptimization";
import DailyNotification from "@/components/DailyNotification";
import SecurityEnhancements from "@/components/SecurityEnhancements";
import UpdateNotification from "@/components/UpdateNotification";
import { fetchSoulScrollReply } from './utils/gptAPI';
import { prompts } from './utils/promptTemplates';
import { saveReflection, incrementReflectionCount } from './utils/storage';
import OnboardingFlow from './components/OnboardingFlow';
import MorningFlow from './components/MorningFlow';
import EveningFlow from './components/EveningFlow';
import ProgressDashboard from './components/ProgressDashboard';
import CommunityFeed from './components/CommunityFeed';
import { useUserProfile } from './hooks/useUserProfile';
import NotFound from "@/pages/NotFound";
import ServerError from "@/pages/ServerError";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import { setupGlobalErrorHandlers } from "@/utils/errorLogger";
import { useEffect, useState } from "react";
import OnboardingIntro from "@/components/OnboardingIntro";
import OnboardingModal from "@/components/OnboardingModal";
import FeedbackButton from "@/components/FeedbackButton";
import { restoreSession } from "@/utils/restoreSession";
// Removed // useHasMounted removed import - using local state instead
// Remove imports that cause deployment errors
import ErrorBoundary from "@/components/ErrorBoundary";
import Community from "@/pages/community";
import MamaMindfully from "@/pages/mama-mindfully";
import SettingsPrivacy from "@/pages/SettingsPrivacy";

import { 
  LazyProgress,
  LazyCommunity,
  LazySettings,
  LazyPricing,
  withLazyLoading 
} from "@/components/LazyComponents";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const { profile, savePreferences } = useUserProfile();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    
    // Listen for global auth expiration events
    const handleAuthExpired = () => {
      console.warn('Authentication expired globally');
      // Handle auth expiration in app context if needed
    };
    
    window.addEventListener('authExpired', handleAuthExpired);
    
    return () => {
      window.removeEventListener('authExpired', handleAuthExpired);
    };
  }, []);

  // Check if user has completed onboarding
  const hasCompletedOnboarding = profile.intent && profile.ritualTime;

  if (!hasMounted) {
    return <div>Loading...</div>;
  }

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : !hasCompletedOnboarding ? (
        <Route path="/" component={() => <OnboardingFlow saveUserPreferences={savePreferences} />} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/morning" component={MorningFlow} />
          <Route path="/evening" component={EveningFlow} />
          <Route path="/progress" component={withLazyLoading(LazyProgress, "Progress")} />
          <Route path="/community" component={withLazyLoading(LazyCommunity, "Community")} />
          <Route path="/dreams" component={withLazyLoading(() => import('@/pages/DreamJournal'), "Dreams")} />
          <Route path="/mantras" component={withLazyLoading(() => import('@/pages/MantraDesigner'), "Mantras")} />
          <Route path="/mama-mindfully" component={MamaMindfully} />
          <Route path="/settings/privacy" component={SettingsPrivacy} />
          <Route path="/settings" component={withLazyLoading(LazySettings, "Settings")} />
          <Route path="/pricing" component={withLazyLoading(LazyPricing, "Pricing")} />
          <Route path="/ask-arc" component={withLazyLoading(() => import('@/components/AskArc'), "Ask Arc")} />
          <Route path="/arc-archive" component={withLazyLoading(() => import('@/components/ArcArchive'), "Arc Archive")} />
          <Route path="/arc-settings" component={withLazyLoading(() => import('@/components/ArcPersonaSettings'), "Arc Settings")} />
          <Route path="/constellation" component={withLazyLoading(() => import('@/pages/Constellation'), "Constellation")} />
          <Route path="/constellations" component={withLazyLoading(() => import('@/pages/Constellations'), "Constellations")} />
          <Route path="/premium" component={withLazyLoading(() => import('@/pages/premium'), "Premium")} />
          <Route path="/premium-success" component={withLazyLoading(() => import('@/pages/premium-success'), "Premium Success")} />
          <Route path="/demo-optimistic" component={withLazyLoading(() => import('@/pages/demo-optimistic'), "Optimistic UI Demo")} />
          <Route path="/emotional-intelligence" component={withLazyLoading(() => import('@/pages/EmotionalIntelligence'), "Emotional Intelligence")} />
          <Route path="/admin/errors" component={withLazyLoading(() => import('@/pages/AdminErrors'), "Admin Errors")} />
          <Route path="/admin/beta-dashboard" component={withLazyLoading(() => import('@/pages/AdminBetaDashboard'), "Beta Dashboard")} />
          <Route path="/terms" component={withLazyLoading(() => import('@/pages/terms'), "Terms & Privacy")} />
        </>
      )}
      {/* Error and 404 Routes - Must be last */}
      <Route path="/500" component={ServerError} />
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

function AppRoutes() {
  return (
    <div className="app-container">
      <NavigationBar />
      <Router />
      <Toaster />
      <FloatingStartButton />
      <PerformanceMonitor />
      <DailyNotification />
    </div>
  );
}

function App() {
  const [mounted, setMounted] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  
  // User status synchronization removed to prevent hook violations
  
  // Set up global error handlers and performance optimizations
  useEffect(() => {
    setMounted(true);
    setupGlobalErrorHandlers();
  }, []);

  // Check if user needs intro
  useEffect(() => {
    if (mounted) {
      const hasSeenIntro = localStorage.getItem('hasSeenIntro');
      if (!hasSeenIntro) {
        setShowIntro(true);
      }
    }
  }, [mounted]);

  // Delayed performance optimizations using safe import
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const { optimizeImageLoading, optimizeMemoryUsage, optimizeBundleLoading } = await import('@/utils/performanceOptimizer');
        optimizeImageLoading();
        optimizeMemoryUsage();
        optimizeBundleLoading();
      } catch (error) {
        console.log('Performance optimizations skipped:', error.message);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle intro completion
  const handleIntroComplete = () => {
    localStorage.setItem('hasSeenIntro', 'true');
    setShowIntro(false);
  };

  // Handle onboarding modal
  const handleOnboardingComplete = () => {
    setShowOnboardingModal(false);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <div>Loading...</div>;
  }

  const handleContinue = () => {
    localStorage.setItem('hasSeenIntro', 'true');
    setShowIntro(false);
  };
  
  return (
    <ErrorBoundaryWrapper>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider>
            <PremiumProvider>
              <AppStoreMetadata />
              <MobileTouchOptimizations />
              <>
                {showIntro && (
                  <OnboardingIntro onComplete={handleContinue} />
                )}
                {showOnboardingModal && (
                  <OnboardingModal onComplete={handleOnboardingComplete} />
                )}
                <AppRoutes />
                <FeedbackButton />
                <UpdateNotification />
              </>
            </PremiumProvider>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundaryWrapper>
  );
}

export default App;
