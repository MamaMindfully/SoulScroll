import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Heart, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Activity, 
  BarChart3,
  Zap
} from "lucide-react";
import { 
  getEmotionalTrends, 
  analyzeEmotionalPattern, 
  generateEmotionalInsight,
  getEmotionLabel,
  trackEmotionalMilestones
} from "@/utils/emotionalResonance";

interface EmotionalPattern {
  average_intensity: number;
  highest_intensity: number;
  lowest_intensity: number;
  volatility: number;
  trend_direction: string;
  emotional_range: number;
  total_entries: number;
}

interface EmotionalTrend {
  date: string;
  emotion_score: number;
  word_count: number;
}

export default function EmotionalResonanceCard() {
  const [pattern, setPattern] = useState<EmotionalPattern | null>(null);
  const [trends, setTrends] = useState<EmotionalTrend[]>([]);
  const [insight, setInsight] = useState<string>('');
  const [milestones, setMilestones] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState(30);

  useEffect(() => {
    loadEmotionalData();
  }, [selectedTimeframe]);

  const loadEmotionalData = async () => {
    try {
      setLoading(true);
      
      const [trendsData, milestonesData] = await Promise.all([
        getEmotionalTrends('user', selectedTimeframe),
        trackEmotionalMilestones('user')
      ]);

      if (trendsData && trendsData.length > 0) {
        setTrends(trendsData);
        
        // Analyze pattern
        const analysisPattern = await analyzeEmotionalPattern(
          trendsData.map(trend => ({
            createdAt: trend.date,
            emotion_score: trend.emotion_score,
            content: `Entry with ${trend.word_count} words`
          }))
        );

        if (analysisPattern) {
          setPattern(analysisPattern);
          
          // Generate insight
          const generatedInsight = await generateEmotionalInsight(analysisPattern);
          setInsight(generatedInsight);
        }
      }

      setMilestones(milestonesData);
    } catch (error) {
      console.error('Error loading emotional data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'stable': return <Minus className="w-4 h-4 text-blue-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'increasing': return 'text-green-600';
      case 'decreasing': return 'text-red-600';
      case 'stable': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 8) return 'bg-red-100 text-red-800 border-red-200';
    if (intensity >= 6) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (intensity >= 4) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pattern || trends.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-purple-800 flex items-center space-x-2">
            <Heart className="w-5 h-5" />
            <span>Emotional Resonance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <Activity className="w-12 h-12 text-purple-300 mx-auto mb-3" />
          <p className="text-purple-600 text-sm">
            Start journaling to track your emotional patterns
          </p>
        </CardContent>
      </Card>
    );
  }

  const emotionLabel = getEmotionLabel(pattern.average_intensity);

  return (
    <div className="space-y-4">
      {/* Main Emotional Pattern Card */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-purple-800 flex items-center space-x-2">
              <Heart className="w-5 h-5" />
              <span>Emotional Resonance</span>
            </CardTitle>
            <div className="flex space-x-2">
              {[7, 14, 30].map(days => (
                <Button
                  key={days}
                  onClick={() => setSelectedTimeframe(days)}
                  variant={selectedTimeframe === days ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                >
                  {days}d
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Average Intensity */}
          <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full bg-${emotionLabel.color}-400`} />
              <span className="text-sm font-medium text-purple-700">
                Average Intensity
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getIntensityColor(pattern.average_intensity)}>
                {emotionLabel.label}
              </Badge>
              <span className="text-sm font-bold text-purple-800">
                {pattern.average_intensity}/10
              </span>
            </div>
          </div>

          {/* Trend Direction */}
          <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
            <div className="flex items-center space-x-3">
              {getTrendIcon(pattern.trend_direction)}
              <span className="text-sm font-medium text-purple-700">
                Emotional Trend
              </span>
            </div>
            <span className={`text-sm font-medium ${getTrendColor(pattern.trend_direction)}`}>
              {pattern.trend_direction.charAt(0).toUpperCase() + pattern.trend_direction.slice(1)}
            </span>
          </div>

          {/* Emotional Range */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-purple-700">
                Emotional Range
              </span>
              <span className="text-sm text-purple-600">
                {pattern.lowest_intensity} - {pattern.highest_intensity}
              </span>
            </div>
            <Progress 
              value={(pattern.emotional_range / 9) * 100} 
              className="h-2 bg-purple-100"
            />
            <div className="text-xs text-purple-600 text-center">
              Exploring {pattern.emotional_range}/9 intensity levels
            </div>
          </div>

          {/* Volatility */}
          <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
            <div className="flex items-center space-x-3">
              <Zap className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-purple-700">
                Emotional Volatility
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-12 h-2 bg-purple-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(pattern.volatility / 3 * 100, 100)}%` }}
                />
              </div>
              <span className="text-sm font-medium text-purple-800">
                {pattern.volatility.toFixed(1)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insight Card */}
      {insight && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Emotional Insight</h4>
                <p className="text-blue-700 text-sm leading-relaxed">
                  {insight}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestones Card */}
      {milestones && (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-800 text-lg">Emotional Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {milestones.total_entries_with_scores || 0}
                </div>
                <div className="text-xs text-green-500">Scored Entries</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {milestones.highest_intensity_reached || 0}
                </div>
                <div className="text-xs text-green-500">Peak Intensity</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {milestones.emotional_range_explored || 0}
                </div>
                <div className="text-xs text-green-500">Range Explored</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {milestones.days_tracking_emotions || 0}
                </div>
                <div className="text-xs text-green-500">Days Tracking</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}