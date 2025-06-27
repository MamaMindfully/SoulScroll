import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Heart, BarChart3 } from "lucide-react";
import { apiRequest } from '@/lib/queryClient';
import { useFeatureAccess } from '@/store/appStore';
import LockedFeatureMessage from './LockedFeatureMessage';

interface EmotionData {
  date: string;
  emotion: string;
  intensity: number;
}

interface EmotionSummary {
  totalEntries: number;
  averageIntensity: number;
  mostCommonEmotion: string;
  dateRange: {
    start: string;
    end: string;
  };
}

const EmotionChart: React.FC = () => {
  const [emotionData, setEmotionData] = useState<EmotionData[]>([]);
  const [summary, setSummary] = useState<EmotionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const featureAccess = useFeatureAccess();

  const fetchEmotionHistory = async (days: number) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('GET', `/api/emotion-history?days=${days}`);
      if (response.ok) {
        const data = await response.json();
        setEmotionData(data.emotions);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch emotion history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (featureAccess.progress) {
      fetchEmotionHistory(selectedPeriod);
    }
  }, [selectedPeriod, featureAccess.progress]);

  if (!featureAccess.progress) {
    return (
      <LockedFeatureMessage
        message="Upgrade to Premium to unlock emotion tracking and visualization."
        feature="Emotion Chart"
        description="Track your emotional journey over time with beautiful charts and insights."
      />
    );
  }

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      joy: '#10B981',
      happiness: '#10B981',
      contentment: '#059669',
      calm: '#06B6D4',
      peaceful: '#0891B2',
      excitement: '#F59E0B',
      anxiety: '#EF4444',
      sadness: '#6366F1',
      anger: '#DC2626',
      frustration: '#F97316',
      neutral: '#6B7280',
      concern: '#8B5CF6'
    };
    return colors[emotion.toLowerCase()] || '#6B7280';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{formatDate(label)}</p>
          <div className="flex items-center space-x-2 mt-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: getEmotionColor(data.emotion) }}
            />
            <span className="text-sm text-gray-600">{data.emotion}</span>
          </div>
          <p className="text-sm text-gray-700">Intensity: {data.intensity}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <span>Emotion Tracking</span>
            </CardTitle>
            
            <div className="flex space-x-2">
              {[7, 30, 90].map((days) => (
                <Button
                  key={days}
                  variant={selectedPeriod === days ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(days)}
                >
                  {days}d
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
            </div>
          ) : emotionData.length > 0 ? (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={emotionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    stroke="#666"
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    stroke="#666"
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="intensity" 
                    stroke="#8B5CF6" 
                    strokeWidth={3}
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#8B5CF6' }}
                  />
                </LineChart>
              </ResponsiveContainer>

              {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Calendar className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{summary.totalEntries}</div>
                    <div className="text-sm text-gray-600">Entries</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {Math.round(summary.averageIntensity)}%
                    </div>
                    <div className="text-sm text-gray-600">Avg Intensity</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Heart className="w-4 h-4 text-red-500" />
                    </div>
                    <Badge 
                      variant="secondary"
                      style={{ 
                        backgroundColor: `${getEmotionColor(summary.mostCommonEmotion)}20`,
                        color: getEmotionColor(summary.mostCommonEmotion)
                      }}
                    >
                      {summary.mostCommonEmotion}
                    </Badge>
                    <div className="text-sm text-gray-600 mt-1">Most Common</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Calendar className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {selectedPeriod}
                    </div>
                    <div className="text-sm text-gray-600">Days</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No emotion data yet</h3>
              <p className="text-gray-600">
                Start journaling and analyzing your entries to see your emotional patterns over time.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmotionChart;