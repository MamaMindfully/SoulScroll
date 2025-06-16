import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Link, BarChart3 } from "lucide-react";

interface EmotionalInsight {
  id: number;
  period: string;
  moodData: Array<{
    date: string;
    rating: number;
    keywords: string[];
  }>;
  topKeywords: string[];
  insights: string;
  generatedAt: string;
}

interface UserStats {
  averageMood: number;
}

export default function EmotionalDashboard() {
  const { data: insights, isLoading: insightsLoading } = useQuery<EmotionalInsight[]>({
    queryKey: ["/api/insights/emotional"],
    select: (data) => data?.filter(insight => insight.period === 'weekly').slice(0, 1),
  });

  const { data: stats } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
  });

  const weeklyInsight = insights?.[0];

  if (insightsLoading) {
    return (
      <section className="p-6">
        <Card className="animate-pulse">
          <CardContent className="p-5">
            <div className="h-4 bg-gentle rounded mb-4"></div>
            <div className="h-20 bg-gentle rounded mb-6"></div>
            <div className="h-4 bg-gentle rounded mb-3"></div>
            <div className="flex space-x-2">
              <div className="h-6 bg-gentle rounded w-16"></div>
              <div className="h-6 bg-gentle rounded w-20"></div>
              <div className="h-6 bg-gentle rounded w-18"></div>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  // Generate mock mood data for visualization if no insights available
  const mockMoodData = [
    { rating: 3.2 }, { rating: 2.8 }, { rating: 3.5 }, 
    { rating: 4.1 }, { rating: 3.8 }, { rating: 4.2 }, { rating: 3.9 }
  ];

  const moodData = weeklyInsight?.moodData || mockMoodData.map((mood, index) => ({
    date: new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toISOString(),
    rating: mood.rating,
    keywords: []
  }));

  const topKeywords = weeklyInsight?.topKeywords || [];
  const averageMood = stats?.averageMood || 0;

  const getTrendStatus = () => {
    if (moodData.length < 2) return { text: "Building data", color: "text-wisdom/60" };
    
    const recent = moodData.slice(-3).reduce((sum, data) => sum + data.rating, 0) / 3;
    const earlier = moodData.slice(0, 3).reduce((sum, data) => sum + data.rating, 0) / 3;
    
    if (recent > earlier + 0.2) return { text: "Upward trend", color: "text-green-600" };
    if (recent < earlier - 0.2) return { text: "Reflective period", color: "text-blue-600" };
    return { text: "Steady pattern", color: "text-wisdom/70" };
  };

  const trendStatus = getTrendStatus();

  return (
    <section className="p-6">
      <Card className="bg-white rounded-2xl shadow-lg animate-fade-in">
        <CardContent className="p-5">
          <h3 className="font-semibold text-wisdom mb-4 flex items-center">
            <BarChart3 className="w-4 h-4 text-primary mr-2" />
            Your Emotional Journey
          </h3>
          
          {/* Mood Trend Visualization */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-wisdom/70">This Week's Pattern</span>
              <span className={`text-xs px-2 py-1 bg-green-100 rounded-full font-medium ${trendStatus.color}`}>
                {trendStatus.text}
              </span>
            </div>
            
            {/* Mood Chart */}
            <div className="h-20 bg-gentle rounded-lg flex items-end justify-between px-2 py-2 mb-2">
              {moodData.map((data, index) => {
                const height = Math.max(10, (data.rating / 5) * 100);
                const colors = ['bg-primary', 'bg-secondary', 'bg-accent'];
                const colorClass = colors[index % colors.length];
                
                return (
                  <div
                    key={index}
                    className={`w-6 ${colorClass} rounded-t transition-all duration-300 hover:opacity-80`}
                    style={{ height: `${height}%` }}
                    title={`Day ${index + 1}: ${data.rating.toFixed(1)}/5`}
                  ></div>
                );
              })}
            </div>
            
            {/* Day Labels */}
            <div className="flex justify-between text-xs text-wisdom/50">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
          </div>

          {/* Emotional Keywords */}
          {topKeywords.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-wisdom mb-3">Frequent Themes</h4>
              <div className="flex flex-wrap gap-2">
                {topKeywords.slice(0, 4).map((keyword, index) => {
                  const colors = [
                    'bg-primary/10 text-primary',
                    'bg-accent/10 text-accent',
                    'bg-secondary/10 text-secondary',
                    'bg-green-100 text-green-700'
                  ];
                  return (
                    <span 
                      key={index}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${colors[index % colors.length]}`}
                    >
                      {keyword}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Memory Connection */}
          <div className="bg-gentle/50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Link className="w-4 h-4 text-wisdom/60 mr-2" />
              <span className="text-sm font-medium text-wisdom">Insight</span>
            </div>
            <p className="text-xs text-wisdom/70 leading-relaxed">
              {weeklyInsight?.insights || 
               averageMood > 0 
                 ? `Your emotional journey this week shows a thoughtful exploration of your inner world. With an average mood of ${averageMood.toFixed(1)}/5, you're building meaningful self-awareness through consistent reflection.`
                 : "Start journaling to discover patterns in your emotional landscape. Each entry helps Luma understand your unique journey better."
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
