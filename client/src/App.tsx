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
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Timeline from "@/pages/timeline";
import Insights from "@/pages/insights";
import Settings from "@/pages/settings";
import Pricing from "@/pages/pricing";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
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
