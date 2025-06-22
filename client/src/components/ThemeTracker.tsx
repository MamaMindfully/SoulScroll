import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp } from "lucide-react";
import { useAppStore } from '@/store/appStore';

interface MemoryTag {
  tag: string;
  strength: number;
  lastSeen: string;
}

const ThemeTracker: React.FC = () => {
  const [themes, setThemes] = useState<MemoryTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userId, isLoggedIn } = useAppStore();

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const userIdToUse = userId || localStorage.getItem('userId') || 'demo-user';
        const response = await fetch(`/api/user/themes?userId=${userIdToUse}`);
        
        if (response.ok) {
          const data = await response.json();
          setThemes(data.themes || []);
        }
      } catch (error) {
        console.error('Failed to fetch themes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchThemes();
  }, [userId, isLoggedIn]);

  const getThemeColor = (strength: number) => {
    if (strength >= 4) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (strength >= 3) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (strength >= 2) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getThemeIntensity = (strength: number) => {
    const percentage = Math.min((strength / 5) * 100, 100);
    return `${Math.round(percentage)}%`;
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-6">
          <div className="animate-pulse text-center text-purple-600">
            Analyzing your emotional patterns...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!themes.length) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span className="text-purple-800">Emerging Themes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-purple-600 text-sm">
            Continue journaling to discover your emotional patterns and themes.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span className="text-purple-800">Emerging Themes</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-purple-600">
            <TrendingUp className="w-4 h-4" />
            <span>{themes.length} active</span>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {themes.slice(0, 5).map((theme, index) => (
            <div key={theme.tag} className="flex items-center justify-between">
              <Badge 
                variant="outline" 
                className={`${getThemeColor(theme.strength)} font-medium`}
              >
                {theme.tag.replace('_', ' ')}
              </Badge>
              
              <div className="flex items-center space-x-2">
                <div className="w-16 h-2 bg-purple-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{ width: getThemeIntensity(theme.strength) }}
                  />
                </div>
                <span className="text-xs text-purple-600 font-medium w-8">
                  {theme.strength.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-xs text-purple-600 text-center opacity-75">
          Themes are extracted from your journal insights and guide personalized prompts
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeTracker;