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
import { useUserStatusSync } from "@/hooks/useUserStatusSync";
import MobileTouchOptimizations from "@/components/MobileTouchOptimizations";
import { AppStoreMetadata } from "@/components/AppStoreOptimization";
import DailyNotification from "@/components/DailyNotification";
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
import Community from "@/pages/community";
import MamaMindfully from "@/pages/mama-mindfully";
import SettingsPrivacy from "@/pages/SettingsPrivacy";

import { 
  LazyFeed, 
  LazyDreams, 
  LazyMantras, 
  LazyInsights, 
  LazyTimeline, 
  LazySettings, 
  LazyPricing,
  LazyAskArc,
  LazyExportManager,
  LazyArcArchive,
  LazyProgress,
  LazyCommunity,
  withLazyLoading 
} from "@/components/LazyComponents";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const { profile, savePreferences } = useUserProfile();

  // Check if user has completed onboarding
  const hasCompletedOnboarding = profile.intent && profile.ritualTime;

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : !hasCompletedOnboarding ? (
        <Route path="/" component={() => <OnboardingFlow saveUserPreferences={savePreferences} />} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/morning" component={() => <MorningFlow />} />
          <Route path="/evening" component={() => <EveningFlow />} />
          <Route path="/progress" component={withLazyLoading(LazyProgress, "Progress")} />
          <Route path="/community" component={withLazyLoading(LazyCommunity, "Community")} />
          <Route path="/dreams" component={withLazyLoading(LazyDreams, "Dreams")} />
          <Route path="/mantras" component={withLazyLoading(LazyMantras, "Mantras")} />
          <Route path="/mama-mindfully" component={MamaMindfully} />
          <Route path="/settings/privacy" component={SettingsPrivacy} />
          <Route path="/timeline" component={withLazyLoading(LazyTimeline, "Timeline")} />
          <Route path="/insights" component={withLazyLoading(LazyInsights, "Insights")} />
          <Route path="/settings" component={withLazyLoading(LazySettings, "Settings")} />
          <Route path="/pricing" component={withLazyLoading(LazyPricing, "Pricing")} />
          <Route path="/feed" component={withLazyLoading(LazyFeed, "Feed")} />
          <Route path="/export" component={withLazyLoading(LazyExportManager, "Export Manager")} />
          <Route path="/ask-arc" component={withLazyLoading(() => import('@/components/AskArc'), "Ask Arc")} />
          <Route path="/arc-archive" component={withLazyLoading(LazyArcArchive, "Arc Archive")} />
          <Route path="/arc-settings" component={withLazyLoading(() => import('@/components/ArcPersonaSettings'), "Arc Settings")} />
          <Route path="/constellation" component={withLazyLoading(() => import('@/pages/Constellation'), "Constellation")} />
          <Route path="/constellations" component={withLazyLoading(() => import('@/pages/Constellations'), "Constellations")} />
          <Route path="/premium" component={withLazyLoading(() => import('@/pages/premium'), "Premium")} />
          <Route path="/premium-success" component={withLazyLoading(() => import('@/pages/premium-success'), "Premium Success")} />
          <Route path="/demo-optimistic" component={withLazyLoading(() => import('@/pages/demo-optimistic'), "Optimistic UI Demo")} />
          <Route path="/emotional-intelligence" component={withLazyLoading(() => import('@/pages/EmotionalIntelligence'), "Emotional Intelligence")} />
          <Route path="/admin/errors" component={withLazyLoading(() => import('@/pages/AdminErrors'), "Admin Errors")} />
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
  // Initialize user status synchronization
  useUserStatusSync();
  
  // Set up global error handlers
  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);
  
  const [showIntro, setShowIntro] = useState(() => {
    // Check if user has seen intro before
    return !localStorage.getItem('soul-scroll-intro-seen');
  });

  const handleContinue = () => {
    localStorage.setItem('soul-scroll-intro-seen', 'true');
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
              {showIntro ? (
                <OnboardingIntro onContinue={handleContinue} />
              ) : (
                <AppRoutes />
              )}
            </PremiumProvider>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundaryWrapper>
  );
}

export default App;
