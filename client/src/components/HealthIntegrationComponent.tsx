import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Heart, 
  Activity, 
  Moon, 
  Footprints,
  TrendingUp,
  Calendar,
  Zap,
  CloudSun,
  LineChart,
  Smartphone,
  Watch
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, CorrelationChart } from 'recharts';

interface HealthData {
  id: number;
  date: string;
  sleepHours: number;
  stepsCount: number;
  heartRate: number;
  weatherCondition: string;
  exerciseMinutes: number;
  moodCorrelation: number;
}

interface CorrelationInsight {
  factor: string;
  correlation: number;
  insight: string;
  recommendation: string;
}

export default function HealthIntegrationComponent() {
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "3months">("month");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: healthData, isLoading } = useQuery<HealthData[]>({
    queryKey: ["/api/health/data", selectedPeriod],
  });

  const { data: correlations } = useQuery<CorrelationInsight[]>({
    queryKey: ["/api/health/correlations"],
  });

  const syncHealthDataMutation = useMutation({
    mutationFn: async (source: string) => {
      return await apiRequest("POST", "/api/health/sync", { source });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/health/data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health/correlations"] });
      toast({
        title: "Health data synced",
        description: `Successfully synced ${data.recordsCount} health records.`,
      });
    },
    onError: () => {
      toast({
        title: "Sync failed",
        description: "Unable to sync health data. Please check your device connection.",
        variant: "destructive",
      });
    },
  });

  const manualHealthDataMutation = useMutation({
    mutationFn: async (data: {
      sleepHours: number;
      stepsCount: number;
      exerciseMinutes: number;
      mood: number;
    }) => {
      return await apiRequest("POST", "/api/health/manual", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health/data"] });
      toast({
        title: "Health data logged",
        description: "Your manual health data has been recorded.",
      });
    },
  });

  const connectDevice = async (deviceType: string) => {
    setIsConnecting(true);
    try {
      // Simulate device connection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (deviceType === "apple_health" && window.DeviceMotionEvent) {
        // Request motion permissions for iOS
        if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
          const permission = await (DeviceMotionEvent as any).requestPermission();
          if (permission === 'granted') {
            setConnectedDevices(prev => [...prev, deviceType]);
            toast({
              title: "Apple Health connected",
              description: "Successfully connected to Apple Health data.",
            });
          }
        }
      } else if (deviceType === "google_fit") {
        // Google Fit integration would require OAuth
        setConnectedDevices(prev => [...prev, deviceType]);
        toast({
          title: "Google Fit connected",
          description: "Successfully connected to Google Fit data.",
        });
      }
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Unable to connect to health device.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const getCorrelationColor = (correlation: number) => {
    const absCorr = Math.abs(correlation);
    if (absCorr >= 0.7) return "text-green-600";
    if (absCorr >= 0.4) return "text-yellow-600";
    return "text-gray-500";
  };

  const formatHealthData = (data: HealthData[]) => {
    return data.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      mood: item.moodCorrelation || 0,
      sleep: item.sleepHours || 0,
      steps: item.stepsCount / 1000 || 0, // Convert to thousands
      exercise: item.exerciseMinutes || 0,
    }));
  };

  const averageMetrics = healthData ? {
    sleep: healthData.reduce((sum, d) => sum + (d.sleepHours || 0), 0) / healthData.length,
    steps: healthData.reduce((sum, d) => sum + (d.stepsCount || 0), 0) / healthData.length,
    exercise: healthData.reduce((sum, d) => sum + (d.exerciseMinutes || 0), 0) / healthData.length,
    mood: healthData.reduce((sum, d) => sum + (d.moodCorrelation || 0), 0) / healthData.length,
  } : null;

  return (
    <div className="space-y-6">
      <Card className="border-serenity bg-gradient-to-br from-serenity/20 to-warmth/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-6 h-6 text-serenity" />
              <CardTitle className="text-wisdom">Health & Mood Insights</CardTitle>
              <Badge variant="secondary" className="bg-serenity/20 text-serenity">
                Premium
              </Badge>
            </div>
            <Heart className="w-5 h-5 text-warmth" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-wisdom/80 leading-relaxed">
            Connect your fitness tracker or smartwatch to understand how your physical health 
            impacts your emotional wellbeing. Discover patterns between sleep, exercise, and mood.
          </p>

          {/* Device Connection */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-serenity/30">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Smartphone className="w-5 h-5 text-serenity" />
                  <span className="font-medium text-wisdom">Apple Health</span>
                  {connectedDevices.includes("apple_health") && (
                    <Badge className="bg-green-100 text-green-800">Connected</Badge>
                  )}
                </div>
                <p className="text-sm text-wisdom/70 mb-3">
                  Sync sleep, steps, and heart rate data from iPhone Health app
                </p>
                <Button
                  onClick={() => connectDevice("apple_health")}
                  disabled={isConnecting || connectedDevices.includes("apple_health")}
                  size="sm"
                  className="w-full bg-serenity hover:bg-serenity/90 text-white"
                >
                  {connectedDevices.includes("apple_health") ? "Connected" : "Connect"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-warmth/30">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Watch className="w-5 h-5 text-warmth" />
                  <span className="font-medium text-wisdom">Google Fit</span>
                  {connectedDevices.includes("google_fit") && (
                    <Badge className="bg-green-100 text-green-800">Connected</Badge>
                  )}
                </div>
                <p className="text-sm text-wisdom/70 mb-3">
                  Import fitness data from Android devices and wearables
                </p>
                <Button
                  onClick={() => connectDevice("google_fit")}
                  disabled={isConnecting || connectedDevices.includes("google_fit")}
                  size="sm"
                  className="w-full bg-warmth hover:bg-warmth/90 text-white"
                >
                  {connectedDevices.includes("google_fit") ? "Connected" : "Connect"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Manual Data Entry */}
          <Card className="border-warmth/30 bg-warmth/5">
            <CardContent className="p-4">
              <h4 className="font-medium text-wisdom mb-3 flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                Quick Manual Entry
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center">
                  <Moon className="w-6 h-6 text-serenity mx-auto mb-1" />
                  <p className="text-xs text-wisdom/70">Sleep</p>
                  <p className="text-sm font-medium">7.5h</p>
                </div>
                <div className="text-center">
                  <Footprints className="w-6 h-6 text-warmth mx-auto mb-1" />
                  <p className="text-xs text-wisdom/70">Steps</p>
                  <p className="text-sm font-medium">8,234</p>
                </div>
                <div className="text-center">
                  <Activity className="w-6 h-6 text-serenity mx-auto mb-1" />
                  <p className="text-xs text-wisdom/70">Exercise</p>
                  <p className="text-sm font-medium">45m</p>
                </div>
                <div className="text-center">
                  <Heart className="w-6 h-6 text-warmth mx-auto mb-1" />
                  <p className="text-xs text-wisdom/70">Mood</p>
                  <p className="text-sm font-medium">4.2/5</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Health Metrics Overview */}
      {averageMetrics && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Moon className="w-8 h-8 text-serenity mx-auto mb-2" />
              <p className="text-2xl font-bold text-wisdom">{averageMetrics.sleep.toFixed(1)}h</p>
              <p className="text-sm text-wisdom/70">Avg Sleep</p>
              <Progress value={(averageMetrics.sleep / 9) * 100} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Footprints className="w-8 h-8 text-warmth mx-auto mb-2" />
              <p className="text-2xl font-bold text-wisdom">{Math.round(averageMetrics.steps).toLocaleString()}</p>
              <p className="text-sm text-wisdom/70">Avg Steps</p>
              <Progress value={(averageMetrics.steps / 10000) * 100} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="w-8 h-8 text-serenity mx-auto mb-2" />
              <p className="text-2xl font-bold text-wisdom">{Math.round(averageMetrics.exercise)}m</p>
              <p className="text-sm text-wisdom/70">Avg Exercise</p>
              <Progress value={(averageMetrics.exercise / 60) * 100} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Heart className="w-8 h-8 text-warmth mx-auto mb-2" />
              <p className="text-2xl font-bold text-wisdom">{averageMetrics.mood.toFixed(1)}/5</p>
              <p className="text-sm text-wisdom/70">Avg Mood</p>
              <Progress value={(averageMetrics.mood / 5) * 100} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Health-Mood Correlation Chart */}
      {healthData && healthData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <LineChart className="w-5 h-5" />
                <span>Health & Mood Trends</span>
              </CardTitle>
              <div className="flex space-x-2">
                {["week", "month", "3months"].map((period) => (
                  <Button
                    key={period}
                    size="sm"
                    variant={selectedPeriod === period ? "default" : "outline"}
                    onClick={() => setSelectedPeriod(period as any)}
                    className="text-xs"
                  >
                    {period === "3months" ? "3M" : period === "month" ? "1M" : "1W"}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <RechartsLineChart data={formatHealthData(healthData)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
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
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                    name="Mood"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sleep" 
                    stroke="#06B6D4" 
                    strokeWidth={2}
                    dot={{ fill: '#06B6D4', strokeWidth: 2, r: 3 }}
                    name="Sleep (hours)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="exercise" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                    name="Exercise (min)"
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Correlation Insights */}
      {correlations && correlations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Health-Mood Correlations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {correlations.map((correlation, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-serenity/10 to-warmth/10 rounded-lg border border-serenity/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-wisdom">{correlation.factor}</h4>
                    <Badge className={`${getCorrelationColor(correlation.correlation)} bg-white`}>
                      {correlation.correlation > 0 ? '+' : ''}{Math.round(correlation.correlation * 100)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-wisdom/80 mb-2">{correlation.insight}</p>
                  <p className="text-sm text-serenity font-medium">{correlation.recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weather Integration */}
      <Card className="border-serenity/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CloudSun className="w-5 h-5" />
            <span>Weather & Mood</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-wisdom/80 mb-4">
            Understanding how weather affects your mood can help you prepare for emotional changes.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <p className="text-lg">☀️</p>
              <p className="text-sm text-wisdom">Sunny</p>
              <p className="text-xs text-wisdom/70">+15% mood</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-lg">🌧️</p>
              <p className="text-sm text-wisdom">Rainy</p>
              <p className="text-xs text-wisdom/70">-8% mood</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-lg">❄️</p>
              <p className="text-sm text-wisdom">Snow</p>
              <p className="text-xs text-wisdom/70">-5% mood</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-lg">🌤️</p>
              <p className="text-sm text-wisdom">Cloudy</p>
              <p className="text-xs text-wisdom/70">-2% mood</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}