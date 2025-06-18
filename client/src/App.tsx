import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
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
import Timeline from "@/pages/timeline";
import Insights from "@/pages/insights";
import Settings from "@/pages/settings";
import Pricing from "@/pages/pricing";

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
          <Route path="/timeline" component={Timeline} />
          <Route path="/insights" component={Insights} />
          <Route path="/settings" component={Settings} />
          <Route path="/pricing" component={Pricing} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppStoreMetadata />
        <MobileTouchOptimizations />
        <Toaster />
        <Router />
        <FloatingStartButton />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
