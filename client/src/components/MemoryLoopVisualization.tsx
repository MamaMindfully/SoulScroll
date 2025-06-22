import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Clock, Layers, TrendingUp, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { useUserStatus } from '@/hooks/useUserStatus';

interface MemoryEntry {
  id: string;
  emotion: string;
  intensity: number;
  themes: string[];
  memoryTags: string[];
  arcComment: string;
  timestamp: Date;
  decayFactor: number;
}

interface MemoryLoopVisualizationProps {
  entries?: MemoryEntry[];
}

const MemoryLoopVisualization: React.FC<MemoryLoopVisualizationProps> = ({ entries = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { userStatus, emergentThemes } = useUserStatus();

  // Mock memory entries for demonstration
  const mockEntries: MemoryEntry[] = [
    {
      id: 'entry_283',
      emotion: 'grief',
      intensity: 82,
      themes: ['letting go', 'change'],
      memoryTags: ['transition', 'release'],
      arcComment: 'You\'re learning to surrender gracefully.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      decayFactor: 0.9
    },
    {
      id: 'entry_281',
      emotion: 'hope',
      intensity: 65,
      themes: ['growth', 'possibility'],
      memoryTags: ['optimism', 'future'],
      arcComment: 'Your resilience shines through uncertainty.',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      decayFactor: 0.7
    },
    {
      id: 'entry_275',
      emotion: 'gratitude',
      intensity: 78,
      themes: ['appreciation', 'mindfulness'],
      memoryTags: ['presence', 'abundance'],
      arcComment: 'Noticing beauty in simple moments.',
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      decayFactor: 0.5
    }
  ];

  const memoryEntries = entries.length > 0 ? entries : mockEntries;

  // Calculate resonance patterns
  const emotionClusters = memoryEntries.reduce((clusters, entry) => {
    const key = entry.emotion;
    if (!clusters[key]) {
      clusters[key] = { count: 0, avgIntensity: 0, entries: [] };
    }
    clusters[key].entries.push(entry);
    clusters[key].count++;
    return clusters;
  }, {} as Record<string, { count: number; avgIntensity: number; entries: MemoryEntry[] }>);

  // Calculate average intensity for each emotion
  Object.keys(emotionClusters).forEach(emotion => {
    const cluster = emotionClusters[emotion];
    cluster.avgIntensity = cluster.entries.reduce((sum, entry) => sum + entry.intensity, 0) / cluster.count;
  });

  // Get narrative threads (connected themes)
  const narrativeThreads = memoryEntries
    .flatMap(entry => entry.themes)
    .reduce((threads, theme) => {
      threads[theme] = (threads[theme] || 0) + 1;
      return threads;
    }, {} as Record<string, number>);

  const topThreads = Object.entries(narrativeThreads)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 80) return 'bg-red-100 text-red-800 border-red-200';
    if (intensity >= 60) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (intensity >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getDecayOpacity = (decayFactor: number) => {
    return Math.max(0.3, decayFactor);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span>Memory Loop</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          Narrative patterns and emotional themes from your journaling journey
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Emergent Themes Overview */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">Emergent Themes</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {emergentThemes.length > 0 ? (
              emergentThemes.map((theme, index) => (
                <Badge key={index} variant="secondary" className="bg-green-50 text-green-700">
                  {theme}
                </Badge>
              ))
            ) : (
              topThreads.map(([theme, count]) => (
                <Badge key={theme} variant="secondary" className="bg-green-50 text-green-700">
                  {theme} ({count})
                </Badge>
              ))
            )}
          </div>
        </div>

        {/* Emotion Resonance Clusters */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">Emotional Resonance</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(emotionClusters).map(([emotion, cluster]) => (
              <div key={emotion} className={`p-2 rounded border ${getIntensityColor(cluster.avgIntensity)}`}>
                <div className="text-xs font-medium">{emotion}</div>
                <div className="text-xs opacity-75">
                  {cluster.count} entries • Avg: {Math.round(cluster.avgIntensity)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {isExpanded && (
          <>
            {/* Memory Timeline */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">Memory Timeline</span>
              </div>
              <div className="space-y-3">
                {memoryEntries.map((entry) => (
                  <div 
                    key={entry.id}
                    className="border rounded-lg p-3 bg-gray-50"
                    style={{ opacity: getDecayOpacity(entry.decayFactor) }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge className={getIntensityColor(entry.intensity)}>
                          {entry.emotion}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {entry.intensity}% intensity
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {entry.timestamp.toLocaleDateString()}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700 italic mb-2">
                      "{entry.arcComment}"
                    </p>
                    
                    <div className="flex flex-wrap gap-1">
                      {entry.themes.map((theme, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {theme}
                        </Badge>
                      ))}
                      {entry.memoryTags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Insight Generation */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2 mb-2">
                <Eye className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Pattern Recognition</span>
              </div>
              <p className="text-sm text-purple-700">
                Your memory loop reveals a journey of emotional growth. The interplay between 
                grief and hope suggests you're processing significant life changes with remarkable resilience.
                Your gratitude practices appear to anchor you during transitions.
              </p>
            </div>
          </>
        )}

        {/* Memory Stats */}
        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {userStatus?.memory?.totalPatterns || memoryEntries.length}
            </div>
            <div className="text-xs text-gray-600">Total Patterns</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {Object.keys(emotionClusters).length}
            </div>
            <div className="text-xs text-gray-600">Emotion Types</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {topThreads.length}
            </div>
            <div className="text-xs text-gray-600">Active Themes</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MemoryLoopVisualization;