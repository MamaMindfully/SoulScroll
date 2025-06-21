import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { PremiumProvider } from "@/context/PremiumContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import FloatingStartButton from "@/components/FloatingStartButton";
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
  withLazyLoading 
} from "@/components/LazyComponents";
import ExportManager from "@/components/ExportManager";
import AskArc from "@/components/AskArc";

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
          <Route path="/progress" component={() => <ProgressDashboard />} />
          <Route path="/community" component={Community} />
          <Route path="/dreams" component={withLazyLoading(LazyDreams, "Dreams")} />
          <Route path="/mantras" component={withLazyLoading(LazyMantras, "Mantras")} />
          <Route path="/mama-mindfully" component={MamaMindfully} />
          <Route path="/settings/privacy" component={SettingsPrivacy} />
          <Route path="/timeline" component={withLazyLoading(LazyTimeline, "Timeline")} />
          <Route path="/insights" component={withLazyLoading(LazyInsights, "Insights")} />
          <Route path="/settings" component={withLazyLoading(LazySettings, "Settings")} />
          <Route path="/pricing" component={withLazyLoading(LazyPricing, "Pricing")} />
          <Route path="/feed" component={withLazyLoading(LazyFeed, "Feed")} />
          <Route path="/export" component={ExportManager} />
          <Route path="/ask-arc" component={AskArc} />
        </>
      )}
      <Route component={NotFound} />
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
                <Router />
                <Toaster />
                <FloatingStartButton />
              </div>
            </PremiumProvider>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
