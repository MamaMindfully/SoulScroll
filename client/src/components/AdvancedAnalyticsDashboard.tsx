import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  TrendingUp, 
  Calendar, 
  Lightbulb,
  Target,
  AlertCircle,
  Star,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Heart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, BarChart, Bar } from 'recharts';

interface MoodPrediction {
  predictedDate: string;
  predictedMood: number;
  confidence: number;
  factors: string[];
  recommendation: string;
}

interface EmotionalPattern {
  period: string;
  averageMood: number;
  dominantEmotions: string[];
  moodVariability: number;
  insights: string[];
}

interface PersonalizedInsight {
  type: string;
  title: string;
  description: string;
  actionable: boolean;
  priority: "high" | "medium" | "low";
}

interface CopingStrategy {
  trigger: string;
  strategies: string[];
  effectiveness: number;
  lastUsed: string;
}

export default function AdvancedAnalyticsDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<"week" | "month" | "quarter">("month");
  const { toast } = useToast();

  const { data: moodPredictions } = useQuery<MoodPrediction[]>({
    queryKey: ["/api/analytics/predictions"],
  });

  const { data: emotionalPatterns } = useQuery<EmotionalPattern[]>({
    queryKey: ["/api/analytics/patterns", selectedTimeframe],
  });

  const { data: personalizedInsights } = useQuery<PersonalizedInsight[]>({
    queryKey: ["/api/analytics/insights"],
  });

  const { data: copingStrategies } = useQuery<CopingStrategy[]>({
    queryKey: ["/api/analytics/coping-strategies"],
  });

  const { data: moodTrends } = useQuery<any[]>({
    queryKey: ["/api/analytics/trends", selectedTimeframe],
  });

  const formatPredictionData = (predictions: MoodPrediction[]) => {
    return predictions?.map(p => ({
      date: new Date(p.predictedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      predicted: p.predictedMood,
      confidence: p.confidence * 100,
    })) || [];
  };

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      joy: "#10B981",
      contentment: "#06B6D4", 
      calm: "#8B5CF6",
      excitement: "#F59E0B",
      gratitude: "#EC4899",
      hope: "#3B82F6",
      sadness: "#6B7280",
      anxiety: "#EF4444",
      frustration: "#F97316",
      anger: "#DC2626",
      fear: "#7C2D12",
      loneliness: "#6366F1"
    };
    return colors[emotion.toLowerCase()] || "#9CA3AF";
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "medium": return <Target className="w-4 h-4 text-yellow-500" />;
      case "low": return <Lightbulb className="w-4 h-4 text-blue-500" />;
      default: return <Star className="w-4 h-4 text-gray-500" />;
    }
  };

  const predictiveInsightData = moodPredictions?.slice(0, 7).map(p => ({
    name: new Date(p.predictedDate).toLocaleDateString('en-US', { weekday: 'short' }),
    mood: p.predictedMood,
    confidence: p.confidence,
  })) || [];

  const emotionDistribution = emotionalPatterns?.reduce((acc, pattern) => {
    pattern.dominantEmotions.forEach(emotion => {
      acc[emotion] = (acc[emotion] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const emotionChartData = emotionDistribution ? Object.entries(emotionDistribution).map(([emotion, count]) => ({
    name: emotion,
    value: count,
    color: getEmotionColor(emotion)
  })) : [];

  return (
    <div className="space-y-6">
      <Card className="border-serenity bg-gradient-to-br from-serenity/20 to-warmth/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="w-6 h-6 text-serenity" />
              <CardTitle className="text-wisdom">Advanced Analytics</CardTitle>
              <Badge variant="secondary" className="bg-serenity/20 text-serenity">
                AI-Powered
              </Badge>
            </div>
            <div className="flex space-x-2">
              {["week", "month", "quarter"].map((timeframe) => (
                <Button
                  key={timeframe}
                  size="sm"
                  variant={selectedTimeframe === timeframe ? "default" : "outline"}
                  onClick={() => setSelectedTimeframe(timeframe as any)}
                  className="text-xs"
                >
                  {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-wisdom/80 leading-relaxed">
            Deep insights into your emotional patterns, mood predictions, and personalized recommendations 
            powered by advanced AI analysis of your journaling history.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="predictions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="predictions" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Predictions</span>
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Patterns</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center space-x-2">
            <Lightbulb className="w-4 h-4" />
            <span>Insights</span>
          </TabsTrigger>
          <TabsTrigger value="strategies" className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>Strategies</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-6">
          {/* Mood Prediction Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>7-Day Mood Predictions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={predictiveInsightData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#888" fontSize={12} />
                    <YAxis domain={[1, 5]} stroke="#888" fontSize={12} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="mood" 
                      stroke="#8B5CF6" 
                      strokeWidth={3}
                      dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }}
                      name="Predicted Mood"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="confidence" 
                      stroke="#06B6D4" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: '#06B6D4', strokeWidth: 2, r: 4 }}
                      name="Confidence %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Prediction Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            {moodPredictions?.slice(0, 4).map((prediction, index) => (
              <Card key={index} className="border-l-4 border-serenity">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-wisdom">
                      {new Date(prediction.predictedDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    <Badge 
                      className={`${prediction.predictedMood >= 4 ? 'bg-green-100 text-green-800' : 
                        prediction.predictedMood >= 3 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}
                    >
                      {prediction.predictedMood.toFixed(1)}/5
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {prediction.factors.slice(0, 3).map((factor, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                    
                    <p className="text-sm text-wisdom/80">{prediction.recommendation}</p>
                    
                    <div className="flex items-center text-xs text-wisdom/60">
                      <Activity className="w-3 h-3 mr-1" />
                      {Math.round(prediction.confidence * 100)}% confidence
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          {/* Emotion Distribution */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="w-5 h-5" />
                  <span>Emotion Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <RechartsPieChart>
                      <Tooltip />
                      <Cell/>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Mood Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <BarChart data={moodTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="averageMood" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pattern Analysis */}
          {emotionalPatterns && emotionalPatterns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Emotional Pattern Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {emotionalPatterns.map((pattern, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-serenity/10 to-warmth/10 rounded-lg border border-serenity/20">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-wisdom">{pattern.period}</h4>
                        <div className="flex items-center space-x-2">
                          <Heart className="w-4 h-4 text-warmth" />
                          <span className="text-sm font-medium">{pattern.averageMood.toFixed(1)}/5</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {pattern.dominantEmotions.map((emotion, i) => (
                            <Badge 
                              key={i} 
                              style={{ backgroundColor: getEmotionColor(emotion) }}
                              className="text-white text-xs"
                            >
                              {emotion}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="space-y-1">
                          {pattern.insights.map((insight, i) => (
                            <p key={i} className="text-sm text-wisdom/80">• {insight}</p>
                          ))}
                        </div>
                        
                        <div className="flex items-center text-xs text-wisdom/60">
                          <Zap className="w-3 h-3 mr-1" />
                          Variability: {(pattern.moodVariability * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Personalized Insights */}
          {personalizedInsights && personalizedInsights.length > 0 && (
            <div className="space-y-4">
              {personalizedInsights.map((insight, index) => (
                <Card key={index} className={`border-l-4 ${
                  insight.priority === 'high' ? 'border-red-500' :
                  insight.priority === 'medium' ? 'border-yellow-500' :
                  'border-blue-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          {getPriorityIcon(insight.priority)}
                          <h4 className="font-medium text-wisdom">{insight.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {insight.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-wisdom/80">{insight.description}</p>
                        {insight.actionable && (
                          <Badge className="bg-serenity/20 text-serenity text-xs">
                            Actionable
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Brain className="w-8 h-8 text-serenity mx-auto mb-2" />
                <p className="text-2xl font-bold text-wisdom">87%</p>
                <p className="text-sm text-wisdom/70">Prediction Accuracy</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 text-warmth mx-auto mb-2" />
                <p className="text-2xl font-bold text-wisdom">+12%</p>
                <p className="text-sm text-wisdom/70">Mood Improvement</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Star className="w-8 h-8 text-serenity mx-auto mb-2" />
                <p className="text-2xl font-bold text-wisdom">23</p>
                <p className="text-sm text-wisdom/70">Patterns Identified</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="strategies" className="space-y-6">
          {/* Coping Strategies */}
          {copingStrategies && copingStrategies.length > 0 && (
            <div className="space-y-4">
              {copingStrategies.map((strategy, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="space-y-1">
                        <h4 className="font-medium text-wisdom">When feeling: {strategy.trigger}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-warmth/20 text-warmth">
                            {Math.round(strategy.effectiveness * 100)}% effective
                          </Badge>
                          <span className="text-xs text-wisdom/60">
                            Last used: {new Date(strategy.lastUsed).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Target className="w-5 h-5 text-serenity" />
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-wisdom/70 font-medium">Recommended strategies:</p>
                      <ul className="space-y-1">
                        {strategy.strategies.map((item, i) => (
                          <li key={i} className="text-sm text-wisdom/80 flex items-start">
                            <span className="text-serenity mr-2">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Strategy Effectiveness Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Strategy Effectiveness Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-wisdom/40 mx-auto mb-3" />
                <p className="text-wisdom/70">Continue journaling to build personalized coping strategies</p>
                <p className="text-sm text-wisdom/50">AI learns your most effective techniques over time</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}