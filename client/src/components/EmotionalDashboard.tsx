import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PrivacyAnalyticsEngine, type JournalEntry, type PrivacyAnalytics } from '@/utils/privacyAnalytics';
import { apiRequest } from '@/lib/queryClient';
import { TrendingUp, TrendingDown, Minus, Shield, Eye, EyeOff } from 'lucide-react';

interface EmotionalDashboardProps {
  journalEntries: JournalEntry[];
  isPremium?: boolean;
}

const EmotionalDashboard: React.FC<EmotionalDashboardProps> = ({ 
  journalEntries = [], 
  isPremium = false 
}) => {
  const [privacyMode, setPrivacyMode] = useState(true);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

  // Generate privacy-first analytics on device
  const privacyAnalytics = useMemo(() => {
    if (journalEntries.length === 0) return null;
    return PrivacyAnalyticsEngine.generatePrivacyAnalytics(journalEntries);
  }, [journalEntries]);

  // Fetch server-side analytics for premium users (when not in privacy mode)
  const { data: serverAnalytics, isLoading } = useQuery({
    queryKey: ['mood-trend', timeframe, privacyMode],
    queryFn: async () => {
      if (privacyMode || !isPremium) return null;
      
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      const response = await apiRequest('GET', `/api/analytics/mood-trend?days=${days}`);
      return response.ok ? await response.json() : null;
    },
    enabled: !privacyMode && isPremium
  });

  // Submit privacy-safe aggregated data when privacy mode is off
  useEffect(() => {
    if (!privacyMode && privacyAnalytics && isPremium) {
      const submitAggregatedData = async () => {
        try {
          const aggregatedData = {
            weeklyAverage: privacyAnalytics.summary.avgMoodScore,
            monthlyTrend: privacyAnalytics.summary.growthTrend,
            streakCount: privacyAnalytics.streakData.current,
            entryFrequency: privacyAnalytics.summary.totalEntries / 30, // entries per day
            volatilityScore: privacyAnalytics.summary.moodStability
          };

          await apiRequest('POST', '/api/analytics/submit-insights', {
            body: JSON.stringify({ aggregatedData }),
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.warn('Failed to submit aggregated insights:', error);
        }
      };

      submitAggregatedData();
    }
  }, [privacyMode, privacyAnalytics, isPremium]);

  const displayAnalytics = privacyMode ? privacyAnalytics : serverAnalytics;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatOutliers = (outliers: string[] | any[]) => {
    if (Array.isArray(outliers) && outliers.length > 0) {
      if (typeof outliers[0] === 'string') {
        return outliers.map((date, idx) => ({ date, id: idx }));
      }
      return outliers;
    }
    return [];
  };

  if (!displayAnalytics && journalEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Emotional Dashboard</CardTitle>
          <CardDescription>
            Start journaling to see your emotional patterns and insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No journal entries yet. Write your first entry to begin tracking your emotional journey.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Privacy and Settings Controls */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Emotional Analytics
            </CardTitle>
            <CardDescription>
              {privacyMode ? 'Processing data locally for privacy' : 'Enhanced analytics with server insights'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={privacyMode ? "default" : "outline"}
              size="sm"
              onClick={() => setPrivacyMode(!privacyMode)}
              className="flex items-center gap-2"
            >
              {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {privacyMode ? 'Local Only' : 'Enhanced'}
            </Button>
            {!privacyMode && (
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as any)}
                className="px-3 py-1 border rounded-md bg-background"
              >
                <option value="7d">7 days</option>
                <option value="30d">30 days</option>
                <option value="90d">90 days</option>
              </select>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      {privacyMode && privacyAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {privacyAnalytics.summary.avgMoodScore}
              </div>
              <p className="text-xs text-muted-foreground">Average Mood</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold flex items-center gap-2">
                {privacyAnalytics.streakData.current}
                <Badge variant={privacyAnalytics.streakData.type === 'positive' ? 'default' : 'secondary'}>
                  {privacyAnalytics.streakData.type}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Current Streak</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold flex items-center gap-2">
                {privacyAnalytics.summary.totalEntries}
                {getTrendIcon(privacyAnalytics.summary.growthTrend)}
              </div>
              <p className="text-xs text-muted-foreground">Total Entries</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {(privacyAnalytics.summary.moodStability * 100).toFixed(0)}%
              </div>
              <p className="text-xs text-muted-foreground">Mood Stability</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">Mood Trends</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mood Trend Analysis</CardTitle>
              <CardDescription>
                {privacyMode ? 'Local 7-day rolling average' : 'Server-enhanced trend analysis'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {privacyMode && privacyAnalytics ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={privacyAnalytics.rollingAverages}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[1, 10]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="avg" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                    />
                    {privacyAnalytics.outlierDates.map((date, idx) => {
                      const point = privacyAnalytics.rollingAverages.find(p => p.date === date);
                      return point ? (
                        <ReferenceDot 
                          key={idx} 
                          x={point.date} 
                          y={point.avg} 
                          r={6} 
                          fill="red" 
                          stroke="white"
                          strokeWidth={2}
                        />
                      ) : null;
                    })}
                  </LineChart>
                </ResponsiveContainer>
              ) : serverAnalytics && !privacyMode ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={serverAnalytics.moodTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[1, 10]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="rollingAverage" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#82ca9d" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                    />
                    {formatOutliers(serverAnalytics.outliers).map((outlier: any, idx: number) => (
                      <ReferenceDot 
                        key={idx} 
                        x={outlier.date} 
                        y={outlier.score} 
                        r={6} 
                        fill={outlier.severity === 'high' ? 'red' : 'orange'} 
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  {isLoading ? 'Loading analytics...' : 'No data available'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          {privacyMode && privacyAnalytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Patterns</CardTitle>
                  <CardDescription>Your journaling habits by day</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Best Day:</span>
                      <span className="text-sm">{privacyAnalytics.patterns.bestDayOfWeek}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Challenging Day:</span>
                      <span className="text-sm">{privacyAnalytics.patterns.worstDayOfWeek}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Best Time:</span>
                      <span className="text-sm">{privacyAnalytics.patterns.bestTimeOfDay}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Writing Insights</CardTitle>
                  <CardDescription>Your journaling productivity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Productive Length:</span>
                      <span className="text-sm">{privacyAnalytics.patterns.mostProductiveWordCount} words</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Longest Streak:</span>
                      <span className="text-sm">{privacyAnalytics.streakData.longest} days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Insights</CardTitle>
              <CardDescription>
                AI-generated insights based on your journaling patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {privacyMode && privacyAnalytics ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <h4 className="font-medium mb-2">Growth Trend</h4>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(privacyAnalytics.summary.growthTrend)}
                      <span className="capitalize">{privacyAnalytics.summary.growthTrend}</span>
                    </div>
                  </div>
                  
                  {privacyAnalytics.outlierDates.length > 0 && (
                    <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                      <h4 className="font-medium mb-2">Emotional Highlights</h4>
                      <p className="text-sm text-muted-foreground">
                        You had {privacyAnalytics.outlierDates.length} emotionally significant days recently. 
                        These moments of intensity often lead to personal growth.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Insights available in privacy mode or with enhanced analytics
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmotionalDashboard;