import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, TrendingUp, Heart, BookOpen, Target, Award } from "lucide-react";

interface UserStats {
  totalEntries: number;
  currentStreak: number;
  longestStreak: number;
  averageMood: number;
}

export default function Insights() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const { data: stats, isLoading: statsLoading, error } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
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
          <p className="text-wisdom">Loading your insights...</p>
        </div>
      </div>
    );
  }

  const getMoodDescription = (rating: number) => {
    if (rating >= 4) return { text: "Positive", color: "text-green-600", bg: "bg-green-100" };
    if (rating >= 3) return { text: "Balanced", color: "text-yellow-600", bg: "bg-yellow-100" };
    if (rating >= 2) return { text: "Contemplative", color: "text-orange-600", bg: "bg-orange-100" };
    return { text: "Reflective", color: "text-blue-600", bg: "bg-blue-100" };
  };

  const moodInfo = stats ? getMoodDescription(stats.averageMood) : null;

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
                <Brain className="w-5 h-5 mr-2 text-primary" />
                Your Insights
              </h2>
              <p className="text-sm text-wisdom/70 mt-1">
                Understanding your emotional patterns
              </p>
            </div>
            <div className="w-10 h-10 rounded-full emotion-gradient flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>

          {statsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-16 bg-gentle rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="animate-fade-in">
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-wisdom mb-1">{stats.totalEntries}</div>
                    <div className="text-xs text-wisdom/70">Total Entries</div>
                  </CardContent>
                </Card>

                <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-accent/10 flex items-center justify-center">
                      <Target className="w-5 h-5 text-accent" />
                    </div>
                    <div className="text-2xl font-bold text-wisdom mb-1">{stats.currentStreak}</div>
                    <div className="text-xs text-wisdom/70">Current Streak</div>
                  </CardContent>
                </Card>
              </div>

              {/* Emotional Overview */}
              <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-wisdom flex items-center">
                      <Heart className="w-4 h-4 mr-2 text-accent" />
                      Emotional Landscape
                    </h3>
                    {moodInfo && (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${moodInfo.color} ${moodInfo.bg}`}>
                        {moodInfo.text}
                      </span>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-wisdom/70">Average Mood</span>
                      <span className="text-sm font-medium text-wisdom">{stats.averageMood.toFixed(1)}/5</span>
                    </div>
                    <div className="w-full bg-gentle rounded-full h-2">
                      <div 
                        className="h-2 rounded-full luma-gradient transition-all duration-300"
                        style={{ width: `${(stats.averageMood / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <p className="text-xs text-wisdom/70 leading-relaxed">
                    Your emotional journey shows thoughtful reflection and growth. 
                    Each entry contributes to a deeper understanding of your inner world.
                  </p>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-wisdom mb-4 flex items-center">
                    <Award className="w-4 h-4 mr-2 text-primary" />
                    Milestones
                  </h3>
                  
                  <div className="space-y-3">
                    {stats.totalEntries >= 1 && (
                      <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-green-600 text-sm">✓</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-wisdom">First Steps</div>
                          <div className="text-xs text-wisdom/70">You started your journaling journey</div>
                        </div>
                      </div>
                    )}

                    {stats.currentStreak >= 3 && (
                      <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <span className="text-orange-600 text-sm">🔥</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-wisdom">Building Momentum</div>
                          <div className="text-xs text-wisdom/70">3+ day writing streak achieved</div>
                        </div>
                      </div>
                    )}

                    {stats.totalEntries >= 10 && (
                      <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-purple-600 text-sm">📖</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-wisdom">Dedicated Writer</div>
                          <div className="text-xs text-wisdom/70">10+ thoughtful entries completed</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Growth Insights */}
              <Card className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-wisdom mb-3 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-secondary" />
                    Growth Patterns
                  </h3>
                  
                  <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg p-4 border border-primary/10">
                    <p className="text-sm text-wisdom/80 leading-relaxed">
                      {stats.totalEntries > 5 
                        ? "Your consistent journaling is creating a beautiful tapestry of self-discovery. Keep exploring your inner landscape—each entry adds depth to your understanding."
                        : "You're beginning to build a meaningful practice of self-reflection. Each entry is a step toward deeper self-awareness and emotional growth."
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gentle flex items-center justify-center">
                <Brain className="w-8 h-8 text-wisdom/50" />
              </div>
              <h3 className="text-lg font-medium text-wisdom mb-2">No insights yet</h3>
              <p className="text-sm text-wisdom/70 leading-relaxed mb-6">
                Start journaling to unlock personalized insights about your emotional patterns.
              </p>
              <button 
                onClick={() => window.location.href = "/"}
                className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium"
              >
                Begin journaling
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation currentPage="insights" />
    </div>
  );
}
