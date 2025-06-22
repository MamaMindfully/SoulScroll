import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/AppContext";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import DreamMode from "@/components/DreamMode";
import ErrorBoundaryWrapper from "@/components/ErrorBoundaryWrapper";
import LockedFeatureMessage from "@/components/LockedFeatureMessage";

export default function Dreams() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { hasFeatureAccess, setCurrentPage } = useAppContext();

  useEffect(() => {
    setCurrentPage('/dreams');
    console.log('Dreams page auth check:', { isLoading, isAuthenticated });
    
    if (!isLoading && !isAuthenticated) {
      console.warn('Dreams access denied - redirecting to login');
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
      console.log('Dreams page access granted');
    }
  }, [isAuthenticated, isLoading, toast, setCurrentPage]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gentle">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Check feature access
  if (!hasFeatureAccess('dreams')) {
    return (
      <ErrorBoundaryWrapper>
        <div className="h-screen flex flex-col bg-gentle">
          <AppHeader />
          <main className="flex-1 overflow-hidden px-4 py-6">
            <LockedFeatureMessage 
              message="Upgrade to Premium to unlock AI-powered dream interpretation and mystical insights."
              feature="Dream Mode"
              description="Set intentions, log dreams, and receive personalized spiritual interpretations powered by AI."
            />
          </main>
          <BottomNavigation />
        </div>
      </ErrorBoundaryWrapper>
    );
  }

  return (
    <div className="min-h-screen bg-gentle">
      {/* Header */}
      <AppHeader isOnline={true} />

      {/* Main Content */}
      <main className="pb-20 pt-16">
        <section className="px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-wisdom mb-2">🌙 Dream Realm</h1>
              <p className="text-wisdom/70">
                Explore the mystical landscape of your subconscious mind
              </p>
            </div>

            <ErrorBoundaryWrapper 
              fallbackTitle="Dream Mode Error"
              fallbackMessage="The dream interpretation feature could not load. Please try refreshing the page."
            >
              <DreamMode />
            </ErrorBoundaryWrapper>
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation currentPage="dreams" />
    </div>
  );
}