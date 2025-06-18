import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import DreamMode from "@/components/DreamMode";

export default function Dreams() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

            <DreamMode />
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation currentPage="dreams" />
    </div>
  );
}