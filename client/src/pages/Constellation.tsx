import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import InsightGraph from '@/components/InsightGraph';
import { useAppStore } from '@/store/appStore';
import { Network, BarChart3, TrendingUp, Zap } from "lucide-react";

interface GraphData {
  nodes: any[];
  edges: any[];
}

interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  topThemes: [string, number][];
  topEmotions: [string, number][];
  connectionTypes: {
    theme: number;
    emotion: number;
    time: number;
  };
}

const Constellation: React.FC = () => {
  const [data, setData] = useState<GraphData | null>(null);
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { userId, isLoggedIn } = useAppStore();

  const fetchData = async () => {
    try {
      const userIdToUse = userId || localStorage.getItem('userId') || 'demo-user';
      
      // Fetch graph data
      const graphResponse = await fetch(`/api/insight-graph?userId=${userIdToUse}`);
      if (graphResponse.ok) {
        const graphData = await graphResponse.json();
        setData(graphData);
      }

      // Fetch statistics
      const statsResponse = await fetch(`/api/insight-graph/stats?userId=${userIdToUse}`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
      
    } catch (error) {
      console.error('Failed to fetch constellation data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId, isLoggedIn]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const hasData = data && data.nodes && data.nodes.length > 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Network className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">Insight Constellation</h1>
        </div>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Discover the hidden connections between your thoughts and emotions. 
          Each node represents an insight from your journaling journey, connected by shared themes, emotions, and timing.
        </p>
      </div>

      {/* Main Graph */}
      {hasData ? (
        <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-700">
          <CardContent className="p-6">
            <InsightGraph data={data} />
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center py-16 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <CardContent>
            <Network className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Your constellation is forming
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Continue journaling to build your insight constellation. 
              Each entry creates new nodes and connections in your personal knowledge graph.
            </p>
            <Button 
              onClick={() => window.location.href = '/journal'}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Start Journaling
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      {stats && hasData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Overview Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span>Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Insights</span>
                  <Badge variant="outline">{stats.totalNodes}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Connections</span>
                  <Badge variant="outline">{stats.totalEdges}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Density</span>
                  <Badge variant="outline">
                    {stats.totalNodes > 0 ? Math.round((stats.totalEdges / stats.totalNodes) * 100) / 100 : 0}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Themes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span>Top Themes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.topThemes.slice(0, 4).map(([theme, count], index) => (
                  <div key={theme} className="flex justify-between items-center">
                    <span className="text-sm capitalize text-gray-700">{theme}</span>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="h-2 rounded-full bg-purple-400"
                        style={{ width: `${(count / stats.topThemes[0][1]) * 40 + 10}px` }}
                      ></div>
                      <span className="text-xs text-gray-500">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Connection Types */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-emerald-600" />
                <span>Connection Types</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-0.5 bg-purple-400 rounded"></div>
                    <span className="text-sm text-gray-600">Theme</span>
                  </div>
                  <Badge variant="outline">{stats.connectionTypes.theme}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-0.5 bg-amber-400 rounded"></div>
                    <span className="text-sm text-gray-600">Emotion</span>
                  </div>
                  <Badge variant="outline">{stats.connectionTypes.emotion}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-0.5 bg-emerald-400 rounded"></div>
                    <span className="text-sm text-gray-600">Time</span>
                  </div>
                  <Badge variant="outline">{stats.connectionTypes.time}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Refresh Button */}
      {hasData && (
        <div className="flex justify-center">
          <Button 
            onClick={fetchData}
            variant="outline"
            className="text-gray-600 border-gray-300"
          >
            <Network className="w-4 h-4 mr-2" />
            Refresh Constellation
          </Button>
        </div>
      )}
    </div>
  );
};

export default Constellation;