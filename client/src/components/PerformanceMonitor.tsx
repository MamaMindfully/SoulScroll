import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Zap, Clock, TrendingUp } from "lucide-react";
import { performanceMonitor } from "@/utils/performance";

const PerformanceMonitor: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV === 'development') {
      setIsVisible(true);
    }
  });

  const refreshStats = () => {
    const currentStats = performanceMonitor.getStats();
    setStats(currentStats);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!stats ? (
        <Button
          onClick={refreshStats}
          variant="outline"
          size="sm"
          className="bg-white shadow-lg"
        >
          <Activity className="w-4 h-4 mr-2" />
          Performance
        </Button>
      ) : (
        <Card className="w-80 shadow-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center">
                <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                Performance Monitor
              </CardTitle>
              <Button
                onClick={() => setStats(null)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1 text-blue-500" />
                  <span className="font-medium">Total Operations</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {stats.totalMeasurements}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                  <span className="font-medium">Average Time</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {formatDuration(stats.averageDuration)}
                </Badge>
              </div>
            </div>

            {stats.slowestOperation && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-red-600">Slowest Operation:</span>
                <div className="text-xs bg-red-50 p-2 rounded">
                  <div className="font-mono">{stats.slowestOperation.name}</div>
                  <div className="text-red-600">{formatDuration(stats.slowestOperation.duration)}</div>
                </div>
              </div>
            )}

            {stats.fastestOperation && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-green-600">Fastest Operation:</span>
                <div className="text-xs bg-green-50 p-2 rounded">
                  <div className="font-mono">{stats.fastestOperation.name}</div>
                  <div className="text-green-600">{formatDuration(stats.fastestOperation.duration)}</div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <span className="text-xs font-medium">Recent Operations:</span>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {stats.recentMeasurements.map((measurement: any, index: number) => (
                  <div key={index} className="text-xs flex justify-between bg-gray-50 p-1 rounded">
                    <span className="font-mono truncate">{measurement.name}</span>
                    <span className={`${measurement.duration > 1000 ? 'text-red-600' : 'text-gray-600'}`}>
                      {formatDuration(measurement.duration)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={refreshStats}
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
              >
                Refresh
              </Button>
              <Button
                onClick={() => {
                  performanceMonitor.cleanup();
                  refreshStats();
                }}
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerformanceMonitor;