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
import { ErrorBoundary } from "@/components/ErrorBoundary";
import FloatingStartButton from "@/components/FloatingStartButton";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import Fallback404 from "@/components/Fallback404";
import { useUserStatusSync } from "@/hooks/useUserStatusSync";
import MobileTouchOptimizations from "@/components/MobileTouchOptimizations";
import { AppStoreMetadata } from "@/components/AppStoreOptimization";
import { fetchSoulScrollReply } from './utils/gptAPI';
import { prompts } from './utils/promptTemplates';
import { saveReflection, incrementReflectionCount } from './utils/storage';
import OnboardingFlow from './components/OnboardingFlow';
import MorningFlow from './components/MorningFlow';
import EveningFlow from './components/EveningFlow';
import ProgressDashboard from './components/ProgressDashboard';
import CommunityFeed from './components/CommunityFeed';
import { useUserProfile } from './hooks/useUserProfile';
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
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
          <Route path="/ask-arc" component={withLazyLoading(LazyAskArc, "Ask Arc")} />
          <Route path="/arc-archive" component={withLazyLoading(LazyArcArchive, "Arc Archive")} />
          <Route path="/premium" component={withLazyLoading(() => import('@/pages/premium'), "Premium")} />
          <Route path="/premium-success" component={withLazyLoading(() => import('@/pages/premium-success'), "Premium Success")} />
          <Route path="/demo-optimistic" component={withLazyLoading(() => import('@/pages/demo-optimistic'), "Optimistic UI Demo")} />
        </>
      )}
      {/* 404 Fallback Route - Must be last */}
      <Route path="*" component={Fallback404} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider>
            <PremiumProvider>
              <AppStoreMetadata />
              <MobileTouchOptimizations />
              <div className="app-container">
                <NavigationBar />
                <Router />
                <Toaster />
                <FloatingStartButton />
                <PerformanceMonitor />
              </div>
            </PremiumProvider>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
