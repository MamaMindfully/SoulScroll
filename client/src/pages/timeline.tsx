import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Heart, MessageCircle, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface JournalEntry {
  id: number;
  content: string;
  wordCount: number;
  emotionalTone?: {
    rating: number;
    keywords: string[];
  };
  aiResponse?: string;
  createdAt: string;
}

export default function Timeline() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const { data: entries, isLoading: entriesLoading, error } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal/entries"],
    enabled: isAuthenticated,
  });

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

  // Handle API errors
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="app-container bg-white flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full emotion-gradient"></div>
          <p className="text-wisdom">Loading your timeline...</p>
        </div>
      </div>
    );
  }

  const getMoodColor = (rating?: number) => {
    if (!rating) return "bg-gray-100";
    if (rating >= 4) return "bg-green-100 text-green-700";
    if (rating >= 3) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  const getMoodEmoji = (rating?: number) => {
    if (!rating) return "😐";
    if (rating >= 4) return "😊";
    if (rating >= 3) return "😌";
    return "😔";
  };

  return (
    <div className="app-container bg-white">
      {/* Status Bar */}
      <div className="status-bar px-4 py-2 text-white text-sm flex justify-between items-center">
        <span className="font-medium">9:41 AM</span>
        <div className="flex items-center space-x-1 text-xs">
          <span>••••</span>
          <span>📶</span>
          <span>📶</span>
          <span>🔋</span>
        </div>
      </div>

      {/* App Header */}
      <AppHeader isOnline={navigator.onLine} />

      {/* Main Content */}
      <main className="main-content">
        <section className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-wisdom flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary" />
                Your Journey
              </h2>
              <p className="text-sm text-wisdom/70 mt-1">
                {entries?.length || 0} entries • Your story unfolds here
              </p>
            </div>
            <div className="w-10 h-10 rounded-full luma-gradient flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>

          {entriesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gentle rounded mb-2"></div>
                    <div className="h-3 bg-gentle rounded w-3/4 mb-4"></div>
                    <div className="h-20 bg-gentle rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : entries && entries.length > 0 ? (
            <div className="space-y-4">
              {entries.map((entry, index) => (
                <Card key={entry.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardContent className="p-5">
                    {/* Entry Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-wisdom">
                          {format(new Date(entry.createdAt), "MMM d, yyyy")}
                        </span>
                        <span className="text-xs text-wisdom/50">
                          {format(new Date(entry.createdAt), "h:mm a")}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {entry.emotionalTone && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMoodColor(entry.emotionalTone.rating)}`}>
                            {getMoodEmoji(entry.emotionalTone.rating)} {entry.emotionalTone.rating}/5
                          </span>
                        )}
                        <span className="text-xs text-wisdom/50">{entry.wordCount} words</span>
                      </div>
                    </div>

                    {/* Entry Content */}
                    <div className="mb-4">
                      <p className="text-wisdom/80 text-sm leading-relaxed line-clamp-3">
                        {entry.content}
                      </p>
                    </div>

                    {/* Keywords */}
                    {entry.emotionalTone?.keywords && entry.emotionalTone.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {entry.emotionalTone.keywords.slice(0, 3).map((keyword, idx) => (
                          <span key={idx} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* AI Response */}
                    {entry.aiResponse && (
                      <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg p-3 border border-primary/10">
                        <div className="flex items-start space-x-2">
                          <div className="w-6 h-6 rounded-full emotion-gradient flex items-center justify-center flex-shrink-0">
                            <Heart className="w-3 h-3 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-wisdom/70 font-medium mb-1">Luma's reflection</p>
                            <p className="text-sm text-wisdom/80 leading-relaxed line-clamp-2">
                              {entry.aiResponse}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Entry Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gentle mt-3">
                      <button className="flex items-center space-x-1 text-wisdom/60 hover:text-primary text-xs">
                        <MessageCircle className="w-4 h-4" />
                        <span>Reflect</span>
                      </button>
                      <button className="text-xs text-wisdom/50 hover:text-wisdom">
                        View full entry
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gentle flex items-center justify-center">
                <Calendar className="w-8 h-8 text-wisdom/50" />
              </div>
              <h3 className="text-lg font-medium text-wisdom mb-2">Your story begins here</h3>
              <p className="text-sm text-wisdom/70 leading-relaxed mb-6">
                Start journaling to see your emotional journey unfold over time.
              </p>
              <button 
                onClick={() => window.location.href = "/"}
                className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium"
              >
                Write your first entry
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation currentPage="timeline" />
    </div>
  );
}
