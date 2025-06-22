import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import CommunityFeed from "@/components/CommunityFeed";
import BottomNavigation from "@/components/BottomNavigation";

export default function Community() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { hasFeatureAccess, setCurrentPage } = useAppContext();

  // Enhanced authentication and feature access validation
  useEffect(() => {
    setCurrentPage('/community');
    console.log('Community page auth check:', { isLoading, isAuthenticated });
    
    if (!isLoading && !isAuthenticated) {
      console.warn('Community access denied - redirecting to login');
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
    
    if (isAuthenticated) {
      console.log('Community page access granted');
    }
  }, [isAuthenticated, isLoading, toast, setCurrentPage]);

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