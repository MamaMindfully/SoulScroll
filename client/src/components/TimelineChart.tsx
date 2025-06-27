import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

interface TimelineEntry {
  date: string;
  mood: string;
  wordCount: number;
  content: string;
}

const TimelineChart: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  const { data: timelineData, isLoading } = useQuery({
    queryKey: ['/api/timeline'],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <CardContent className="p-6 text-center">
          <div className="animate-pulse">
            <TrendingUp className="w-8 h-8 mx-auto text-purple-400 mb-2" />
            <p className="text-purple-600">Loading your emotional journey...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!timelineData || timelineData.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-purple-700">
            <TrendingUp className="w-5 h-5" />
            <span>Emotional Timeline</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-purple-600 text-center">
            Start journaling to see your emotional patterns over time
          </p>
        </CardContent>
      </Card>
    );
  }

  // Convert mood to numeric value for charting
  const moodToValue = (mood: string): number => {
    const moodMap: { [key: string]: number } = {
      'happy': 5,
      'grateful': 4,
      'peaceful': 4,
      'excited': 4,
      'hopeful': 3,
      'contemplative': 3,
      'curious': 3,
      'confused': 2,
      'anxious': 1,
      'sad': 1,
      'angry': 1
    };
    return moodMap[mood] || 3;
  };

  // Prepare data for chart
  const chartData = timelineData.map((entry: TimelineEntry, index: number) => ({
    index,
    date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    mood: moodToValue(entry.mood),
    moodLabel: entry.mood,
    wordCount: entry.wordCount,
    content: entry.content
  })).reverse(); // Show chronological order

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-purple-200 rounded-lg shadow-lg">
          <p className="font-medium text-purple-800">{data.date}</p>
          <p className="text-sm text-purple-600">Mood: {data.moodLabel}</p>
          <p className="text-sm text-purple-600">Words: {data.wordCount}</p>
          <p className="text-xs text-gray-600 mt-1 max-w-xs">{data.content}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-purple-700">
          <TrendingUp className="w-5 h-5" />
          <span>Emotional Timeline</span>
        </CardTitle>
        <p className="text-sm text-purple-600">
          Your emotional journey over the last {chartData.length} entries
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis 
                dataKey="date" 
                stroke="#6b46c1"
                fontSize={12}
                tick={{ fill: '#6b46c1' }}
              />
              <YAxis 
                domain={[0, 6]}
                ticks={[1, 2, 3, 4, 5]}
                tickFormatter={(value) => {
                  const labels = ['', 'Low', 'Mixed', 'Neutral', 'Positive', 'High'];
                  return labels[value] || '';
                }}
                stroke="#6b46c1"
                fontSize={12}
                tick={{ fill: '#6b46c1' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="mood" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#6b46c1', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 flex justify-between text-xs text-purple-600">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>Track patterns over time</span>
          </div>
          <span>Higher values = more positive emotions</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimelineChart;