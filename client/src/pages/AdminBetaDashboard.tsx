import React, { useEffect, useState } from 'react';
import { Users, Brain, Heart, TrendingUp, Calendar, Clock, BarChart3, Activity } from 'lucide-react';
import AdminTokenGuard from '@/components/AdminTokenGuard';

interface UsageStats {
  users: number;
  reflections: number;
  insights: number;
  journalEntries: number;
  premiumUsers: number;
  totalEmotionTrends: number;
}

interface EmotionData {
  avgScore: number;
  scores: number[];
  dominantEmotions: Record<string, number>;
}

interface RecentActivity {
  date: string;
  users: number;
  entries: number;
  insights: number;
}

export default function AdminBetaDashboard() {
  const [usage, setUsage] = useState<UsageStats>({
    users: 0,
    reflections: 0,
    insights: 0,
    journalEntries: 0,
    premiumUsers: 0,
    totalEmotionTrends: 0
  });

  const [emotionData, setEmotionData] = useState<EmotionData>({
    avgScore: 0,
    scores: [],
    dominantEmotions: {}
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all dashboard data in parallel
      const [usageResponse, emotionResponse, activityResponse] = await Promise.all([
        fetch('/api/admin/usage-stats', { credentials: 'include' }),
        fetch('/api/admin/emotion-analytics', { credentials: 'include' }),
        fetch('/api/admin/recent-activity', { credentials: 'include' })
      ]);

      if (!usageResponse.ok || !emotionResponse.ok || !activityResponse.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const [usageData, emotionAnalytics, activityData] = await Promise.all([
        usageResponse.json(),
        emotionResponse.json(),
        activityResponse.json()
      ]);

      setUsage(usageData);
      setEmotionData(emotionAnalytics);
      setRecentActivity(activityData);

    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading && usage.users === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading beta analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminTokenGuard>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-2 rounded-full">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Beta Analytics Dashboard
              </h1>
              <p className="text-gray-400">Real-time insights into SoulScroll beta performance</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Auto-refresh: 30s</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-6 h-6 text-blue-400" />
              <span className="text-xs text-gray-400">Total</span>
            </div>
            <p className="text-3xl font-bold text-white">{usage.users.toLocaleString()}</p>
            <p className="text-sm text-gray-400">Active Users</p>
          </div>

          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <Heart className="w-6 h-6 text-red-400" />
              <span className="text-xs text-gray-400">Saved</span>
            </div>
            <p className="text-3xl font-bold text-white">{usage.reflections.toLocaleString()}</p>
            <p className="text-sm text-gray-400">Reflections</p>
          </div>

          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <Brain className="w-6 h-6 text-purple-400" />
              <span className="text-xs text-gray-400">Generated</span>
            </div>
            <p className="text-3xl font-bold text-white">{usage.insights.toLocaleString()}</p>
            <p className="text-sm text-gray-400">AI Insights</p>
          </div>

          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-6 h-6 text-green-400" />
              <span className="text-xs text-gray-400">Premium</span>
            </div>
            <p className="text-3xl font-bold text-white">{usage.premiumUsers.toLocaleString()}</p>
            <p className="text-sm text-gray-400">Subscribers</p>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-gray-900/30 to-black/30 p-6 rounded-xl border border-gray-800">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              Journal Entries
            </h3>
            <p className="text-2xl font-bold text-white mb-1">{usage.journalEntries.toLocaleString()}</p>
            <p className="text-sm text-gray-400">Total entries created</p>
          </div>

          <div className="bg-gradient-to-br from-gray-900/30 to-black/30 p-6 rounded-xl border border-gray-800">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-400" />
              Emotion Tracking
            </h3>
            <p className="text-2xl font-bold text-white mb-1">{emotionData.avgScore.toFixed(1)}</p>
            <p className="text-sm text-gray-400">Average emotion score</p>
          </div>

          <div className="bg-gradient-to-br from-gray-900/30 to-black/30 p-6 rounded-xl border border-gray-800">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Engagement Rate
            </h3>
            <p className="text-2xl font-bold text-white mb-1">
              {usage.users > 0 ? ((usage.insights / usage.users) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-sm text-gray-400">Insights per user</p>
          </div>
        </div>

        {/* Emotion Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-gray-900/30 to-black/30 p-6 rounded-xl border border-gray-800">
            <h3 className="text-lg font-semibold mb-4">Dominant Emotions</h3>
            <div className="space-y-3">
              {Object.entries(emotionData.dominantEmotions)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([emotion, count]) => (
                  <div key={emotion} className="flex items-center justify-between">
                    <span className="text-gray-300 capitalize">{emotion}</span>
                    <div className="flex items-center gap-2">
                      <div className="bg-gray-700 h-2 w-20 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full"
                          style={{ 
                            width: `${(count / Math.max(...Object.values(emotionData.dominantEmotions))) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-400">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900/30 to-black/30 p-6 rounded-xl border border-gray-800">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.slice(0, 7).map((activity, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{activity.date}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-blue-400">{activity.users} users</span>
                    <span className="text-green-400">{activity.entries} entries</span>
                    <span className="text-purple-400">{activity.insights} insights</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-gradient-to-br from-gray-900/30 to-black/30 p-6 rounded-xl border border-gray-800">
          <h3 className="text-lg font-semibold mb-4">System Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-gray-400">Database</p>
              <p className="text-xs text-green-400">Online</p>
            </div>
            <div className="text-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-gray-400">AI Services</p>
              <p className="text-xs text-green-400">Operational</p>
            </div>
            <div className="text-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-gray-400">Analytics</p>
              <p className="text-xs text-green-400">Active</p>
            </div>
            <div className="text-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-gray-400">Cache</p>
              <p className="text-xs text-green-400">Healthy</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
    </AdminTokenGuard>
  );
}