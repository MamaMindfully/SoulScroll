import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import CommunityFeed from "@/components/CommunityFeed";
import BottomNavigation from "@/components/BottomNavigation";

export default function Community() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const featureAccess = useFeatureAccess();

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
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Check feature access
  if (!featureAccess.community) {
    return (
      <ErrorBoundaryWrapper>
        <div className="h-screen flex flex-col bg-gentle">
          <AppHeader />
          <main className="flex-1 overflow-hidden px-4 py-6">
            <LockedFeatureMessage 
              message="Upgrade to Premium to access the Community features and connect with other mindful journalers."
              feature="Community Feed"
              description="Share reflections, send hearts, and find support in our mindful community."
            />
          </main>
          <BottomNavigation />
        </div>
      </ErrorBoundaryWrapper>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <ErrorBoundaryWrapper 
          fallbackTitle="Community Feed Error"
          fallbackMessage="The community feed could not load. Please try refreshing the page."
        >
          <CommunityFeed />
        </ErrorBoundaryWrapper>
      </main>
      
      <BottomNavigation currentPage="community" />
    </div>
  );
}