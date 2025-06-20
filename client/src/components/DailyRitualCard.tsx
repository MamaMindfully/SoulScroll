import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sun, 
  Moon, 
  Sparkles, 
  RefreshCw, 
  Clock, 
  Heart,
  Calendar,
  TrendingUp
} from "lucide-react";
import { 
  getRitual, 
  getTimeAwareRitual, 
  getPersonalizedRitual,
  getRitualWithTracking,
  getRitualStats 
} from '../utils/dailyRitualEngine';

interface DailyRitualCardProps {
  type?: 'morning' | 'evening' | 'auto';
  category?: 'general' | 'wellness' | 'growth' | 'spiritual';
  onRitualComplete?: (ritual: string) => void;
  userProfile?: any;
}

const DailyRitualCard: React.FC<DailyRitualCardProps> = ({
  type = 'auto',
  category = 'general',
  onRitualComplete,
  userProfile = {}
}) => {
  const [currentRitual, setCurrentRitual] = useState<string>('');
  const [ritualType, setRitualType] = useState<'morning' | 'evening'>('morning');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<any>({});
  const [hasCompletedToday, setHasCompletedToday] = useState(false);

  useEffect(() => {
    loadRitual();
    loadStats();
    checkTodayCompletion();
  }, [type, category, userProfile]);

  const loadRitual = () => {
    let ritual = '';
    let detectedType: 'morning' | 'evening' = 'morning';

    if (type === 'auto') {
      ritual = getPersonalizedRitual(userProfile);
      detectedType = getCurrentTimeType();
    } else {
      detectedType = type;
      ritual = getRitualWithTracking(type);
    }

    setCurrentRitual(ritual);
    setRitualType(detectedType);
  };

  const loadStats = () => {
    const ritualStats = getRitualStats();
    setStats(ritualStats);
  };

  const checkTodayCompletion = () => {
    try {
      const today = new Date().toDateString();
      const completedRituals = JSON.parse(localStorage.getItem('soulscroll-completed-rituals') || '[]');
      setHasCompletedToday(completedRituals.includes(today));
    } catch (error) {
      console.error('Error checking ritual completion:', error);
    }
  };

  const getCurrentTimeType = (): 'morning' | 'evening' => {
    const hour = new Date().getHours();
    return hour >= 5 && hour < 18 ? 'morning' : 'evening';
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      loadRitual();
      setIsRefreshing(false);
    }, 500);
  };

  const handleComplete = () => {
    try {
      const today = new Date().toDateString();
      const completedRituals = JSON.parse(localStorage.getItem('soulscroll-completed-rituals') || '[]');
      
      if (!completedRituals.includes(today)) {
        completedRituals.push(today);
        localStorage.setItem('soulscroll-completed-rituals', JSON.stringify(completedRituals));
        setHasCompletedToday(true);
        loadStats(); // Refresh stats
      }

      if (onRitualComplete) {
        onRitualComplete(currentRitual);
      }
    } catch (error) {
      console.error('Error completing ritual:', error);
    }
  };

  const getRitualIcon = () => {
    return ritualType === 'morning' ? Sun : Moon;
  };

  const getRitualTimeLabel = () => {
    return ritualType === 'morning' ? 'Morning Ritual' : 'Evening Ritual';
  };

  const getRitualGradient = () => {
    return ritualType === 'morning' 
      ? 'from-orange-50 to-yellow-50 border-orange-200'
      : 'from-indigo-50 to-purple-50 border-indigo-200';
  };

  const getIconColor = () => {
    return ritualType === 'morning' ? 'text-orange-500' : 'text-indigo-500';
  };

  const RitualIcon = getRitualIcon();

  return (
    <div className="space-y-4">
      {/* Main Ritual Card */}
      <Card className={`bg-gradient-to-br ${getRitualGradient()}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <RitualIcon className={`w-5 h-5 ${getIconColor()}`} />
              <span className={ritualType === 'morning' ? 'text-orange-800' : 'text-indigo-800'}>
                {getRitualTimeLabel()}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {hasCompletedToday && (
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              )}
              <Button
                onClick={handleRefresh}
                variant="ghost"
                size="sm"
                disabled={isRefreshing}
                className={`${getIconColor()} hover:bg-white/50`}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Ritual Prompt */}
            <div className="p-4 bg-white/70 rounded-lg border border-white/50">
              <p className="text-gray-800 leading-relaxed text-center italic">
                {currentRitual}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              {!hasCompletedToday && (
                <Button
                  onClick={handleComplete}
                  className={`flex-1 ${
                    ritualType === 'morning'
                      ? 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600'
                  } text-white`}
                  style={{ minHeight: '44px' }}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  <span style={{ fontSize: 'clamp(0.9rem, 2.2vw, 1rem)' }}>
                    Complete Ritual
                  </span>
                </Button>
              )}
              
              <Button
                onClick={() => {
                  // Navigate to journaling with this prompt
                  const textarea = document.querySelector('textarea');
                  if (textarea) {
                    textarea.value = currentRitual + '\n\n';
                    textarea.focus();
                  }
                }}
                variant="outline"
                className={`${
                  hasCompletedToday ? 'flex-1' : ''
                } border-gray-300 hover:bg-white/70`}
                style={{ minHeight: '44px' }}
              >
                Journal with This
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ritual Stats */}
      {stats.totalDays > 0 && (
        <Card className="border-gray-200 bg-white/50">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">{stats.currentStreak}</div>
                <div className="text-xs text-blue-600">Day Streak</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">{stats.totalDays}</div>
                <div className="text-xs text-green-600">Total Days</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">
                  {stats.morningRituals + stats.eveningRituals}
                </div>
                <div className="text-xs text-purple-600">Rituals</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Rituals */}
      {stats.recentRituals && stats.recentRituals.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-sm">
              <Clock className="w-4 h-4 text-gray-600" />
              <span>Recent Rituals</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentRituals.slice(0, 3).map((ritual: any, index: number) => (
                <div 
                  key={index}
                  className="p-2 bg-gray-50 rounded border text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-xs">
                      {ritual.type === 'morning' ? '🌞' : '🌙'} {ritual.type}
                    </Badge>
                    <span className="text-gray-500">
                      {new Date(ritual.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700 line-clamp-1">
                    {ritual.ritual}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DailyRitualCard;