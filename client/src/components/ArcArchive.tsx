import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Calendar, Heart, Sparkles, Filter, TrendingUp } from 'lucide-react';
import { summarizeArchive, getThemeStats, getMoodPattern, getRecentMemories } from '@/engines/arcMemory';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

interface ArcArchiveProps {
  className?: string;
}

const ArcArchive: React.FC<ArcArchiveProps> = ({ className = '' }) => {
  const { isAuthenticated } = useAuth();
  const [viewMode, setViewMode] = useState<'recent' | 'themes' | 'moods' | 'all'>('recent');
  
  const { data: entries, isLoading } = useQuery({
    queryKey: ['/api/journal/entries'],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <Card className={`bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 ${className}`}>
        <CardContent className="p-6 text-center">
          <div className="animate-pulse">
            <Brain className="w-8 h-8 mx-auto text-indigo-400 mb-2" />
            <p className="text-indigo-600">Arc is organizing your memories...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <Card className={`bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-indigo-700">
            <Brain className="w-5 h-5" />
            <span>Arc Memory Archive</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-indigo-600 text-center">
            Start journaling to build your memory archive with Arc
          </p>
        </CardContent>
      </Card>
    );
  }

  const archive = summarizeArchive(entries);
  const themeStats = getThemeStats(entries);
  const moodPattern = getMoodPattern(entries);
  const recentMemories = getRecentMemories(entries, 7);

  const getThemeColor = (theme: string): string => {
    const colors: { [key: string]: string } = {
      'Gratitude': 'bg-green-100 text-green-800',
      'Processing': 'bg-orange-100 text-orange-800',
      'Connection': 'bg-pink-100 text-pink-800',
      'Purpose': 'bg-blue-100 text-blue-800',
      'Aspiration': 'bg-purple-100 text-purple-800',
      'Growth': 'bg-emerald-100 text-emerald-800',
      'Serenity': 'bg-indigo-100 text-indigo-800',
      'Reflection': 'bg-gray-100 text-gray-800'
    };
    return colors[theme] || colors['Reflection'];
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'recent':
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-indigo-700 mb-3">Last 7 Days</h3>
            {recentMemories.slice(0, 5).map((memory, index) => (
              <div key={index} className="border-b border-indigo-100 pb-3 last:border-b-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-indigo-800">{memory.date}</span>
                  <Badge variant="outline" className={getThemeColor(memory.theme)}>
                    {memory.theme}
                  </Badge>
                </div>
                <p className="text-sm text-indigo-700 italic mb-1">"{memory.quote}"</p>
                <div className="flex items-center justify-between text-xs text-indigo-600">
                  <span>Mood: {memory.mood}</span>
                  <span>{memory.wordCount} words</span>
                </div>
                {memory.insight && (
                  <p className="text-xs text-indigo-500 mt-1 pl-3 border-l-2 border-indigo-200">
                    {memory.insight}
                  </p>
                )}
              </div>
            ))}
          </div>
        );

      case 'themes':
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-indigo-700 mb-3">Reflection Themes</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(themeStats)
                .sort(([,a], [,b]) => b - a)
                .map(([theme, count]) => (
                  <div key={theme} className="text-center p-3 bg-white/70 rounded-lg border border-indigo-100">
                    <div className="text-lg font-bold text-indigo-800">{count}</div>
                    <div className="text-xs text-indigo-600">{theme}</div>
                  </div>
                ))}
            </div>
          </div>
        );

      case 'moods':
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-indigo-700 mb-3">Emotional Patterns</h3>
            <div className="space-y-2">
              {Object.entries(moodPattern)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 6)
                .map(([mood, count]) => (
                  <div key={mood} className="flex items-center justify-between p-2 bg-white/70 rounded border border-indigo-100">
                    <span className="text-sm text-indigo-800">{mood}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-indigo-100 rounded-full h-2">
                        <div 
                          className="bg-indigo-500 h-2 rounded-full"
                          style={{ width: `${(count / Math.max(...Object.values(moodPattern))) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-indigo-600">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        );

      case 'all':
        return (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <h3 className="text-sm font-semibold text-indigo-700 mb-3">Complete Archive</h3>
            {archive.slice(0, 20).map((memory, index) => (
              <div key={index} className="border-b border-indigo-100 pb-2 last:border-b-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-indigo-800">{memory.date}</span>
                  <Badge variant="outline" className={`${getThemeColor(memory.theme)} text-xs`}>
                    {memory.theme}
                  </Badge>
                </div>
                <p className="text-xs text-indigo-700 italic">"{memory.quote}"</p>
                <p className="text-xs text-indigo-500">{memory.mood}</p>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={`bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-indigo-700">
          <Brain className="w-5 h-5" />
          <span>Arc Memory Archive</span>
        </CardTitle>
        <p className="text-sm text-indigo-600">
          Your journaling patterns and insights, organized by Arc
        </p>
        
        {/* View Mode Selector */}
        <div className="flex space-x-2 mt-3">
          <Button
            size="sm"
            variant={viewMode === 'recent' ? 'default' : 'outline'}
            onClick={() => setViewMode('recent')}
            className="text-xs"
          >
            <Calendar className="w-3 h-3 mr-1" />
            Recent
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'themes' ? 'default' : 'outline'}
            onClick={() => setViewMode('themes')}
            className="text-xs"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Themes
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'moods' ? 'default' : 'outline'}
            onClick={() => setViewMode('moods')}
            className="text-xs"
          >
            <Heart className="w-3 h-3 mr-1" />
            Moods
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'all' ? 'default' : 'outline'}
            onClick={() => setViewMode('all')}
            className="text-xs"
          >
            <Filter className="w-3 h-3 mr-1" />
            All
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {renderContent()}
        
        <div className="mt-4 pt-3 border-t border-indigo-200 text-center">
          <div className="flex items-center justify-center space-x-4 text-xs text-indigo-600">
            <span>{entries.length} total entries</span>
            <span>•</span>
            <span>{Object.keys(themeStats).length} themes explored</span>
            <span>•</span>
            <span>{Object.keys(moodPattern).length} emotional states</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ArcArchive;