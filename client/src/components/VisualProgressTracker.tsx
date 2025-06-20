import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Star, 
  Target, 
  Calendar, 
  TrendingUp, 
  Flame,
  Heart,
  BookOpen,
  Sparkles,
  Award
} from "lucide-react";
import { getJournalStats } from '../utils/journalHistoryUtils';
import { getUnlockables } from '../utils/unlockablesEngine';

interface ProgressData {
  currentStreak: number;
  longestStreak: number;
  totalEntries: number;
  totalWords: number;
  averageWords: number;
  averageMood: number;
  level: number;
  xp: number;
  nextLevelXp: number;
  weeklyGoal: number;
  weeklyProgress: number;
}

const VisualProgressTracker: React.FC = () => {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = () => {
    try {
      const stats = getJournalStats();
      const unlockables = getUnlockables();
      
      // Calculate XP and level based on journal activity
      const baseXp = stats.totalEntries * 10 + Math.floor(stats.totalWords / 10);
      const streakBonus = stats.currentStreak * 5;
      const totalXp = baseXp + streakBonus;
      
      const level = Math.floor(totalXp / 100) + 1;
      const currentLevelXp = totalXp % 100;
      const nextLevelXp = 100;
      
      // Calculate weekly progress (last 7 days)
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weeklyEntries = stats.recentEntries?.filter(entry => 
        new Date(entry.timestamp) >= weekAgo
      ).length || 0;
      
      const weeklyGoal = 5; // Target 5 entries per week
      const weeklyProgress = Math.min((weeklyEntries / weeklyGoal) * 100, 100);

      setProgressData({
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        totalEntries: stats.totalEntries,
        totalWords: stats.totalWords,
        averageWords: stats.averageWords,
        averageMood: stats.averageMood,
        level,
        xp: currentLevelXp,
        nextLevelXp,
        weeklyGoal,
        weeklyProgress
      });

      setAchievements(unlockables.filter(item => item.isUnlocked));
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-600 bg-purple-100';
    if (streak >= 14) return 'text-blue-600 bg-blue-100';
    if (streak >= 7) return 'text-green-600 bg-green-100';
    if (streak >= 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getLevelBadgeColor = (level: number) => {
    if (level >= 20) return 'bg-gradient-to-r from-purple-500 to-pink-500';
    if (level >= 15) return 'bg-gradient-to-r from-blue-500 to-indigo-500';
    if (level >= 10) return 'bg-gradient-to-r from-green-500 to-emerald-500';
    if (level >= 5) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    return 'bg-gradient-to-r from-gray-500 to-gray-600';
  };

  if (isLoading) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progressData) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-6 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Start journaling to track your progress</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Level and XP */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-purple-600" />
              <span className="text-purple-800">Journaling Level</span>
            </div>
            <Badge className={`${getLevelBadgeColor(progressData.level)} text-white px-3 py-1`}>
              Level {progressData.level}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-purple-600">XP Progress</span>
              <span className="text-purple-600 font-medium">
                {progressData.xp}/{progressData.nextLevelXp} XP
              </span>
            </div>
            <Progress 
              value={(progressData.xp / progressData.nextLevelXp) * 100} 
              className="h-3"
            />
            <p className="text-xs text-purple-600 text-center">
              {progressData.nextLevelXp - progressData.xp} XP to next level
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Goal */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-green-600" />
            <span className="text-green-800">Weekly Goal</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-600">Journal Entries</span>
              <span className="text-green-600 font-medium">
                {Math.floor((progressData.weeklyProgress / 100) * progressData.weeklyGoal)}/{progressData.weeklyGoal}
              </span>
            </div>
            <Progress 
              value={progressData.weeklyProgress} 
              className="h-3"
            />
            <div className="flex items-center justify-center">
              {progressData.weeklyProgress >= 100 ? (
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  <Star className="w-3 h-3 mr-1" />
                  Goal Achieved!
                </Badge>
              ) : (
                <span className="text-xs text-green-600">
                  {progressData.weeklyGoal - Math.floor((progressData.weeklyProgress / 100) * progressData.weeklyGoal)} more entries to reach your goal
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Current Streak */}
        <Card className={`border-orange-200 ${progressData.currentStreak > 0 ? 'bg-gradient-to-br from-orange-50 to-red-50' : 'bg-gray-50'}`}>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Flame className={`w-6 h-6 ${progressData.currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {progressData.currentStreak}
            </div>
            <div className="text-xs text-orange-600">Day Streak</div>
            {progressData.currentStreak >= 3 && (
              <Badge className={`mt-1 text-xs ${getStreakColor(progressData.currentStreak)}`}>
                {progressData.currentStreak >= 30 ? 'Legendary!' :
                 progressData.currentStreak >= 14 ? 'Amazing!' :
                 progressData.currentStreak >= 7 ? 'Great!' : 'Good!'}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Total Entries */}
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <BookOpen className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {progressData.totalEntries}
            </div>
            <div className="text-xs text-blue-600">Total Entries</div>
          </CardContent>
        </Card>

        {/* Words Written */}
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-6 h-6 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {progressData.totalWords > 1000 ? 
                `${(progressData.totalWords / 1000).toFixed(1)}k` : 
                progressData.totalWords
              }
            </div>
            <div className="text-xs text-purple-600">Words Written</div>
          </CardContent>
        </Card>

        {/* Average Mood */}
        <Card className="border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Heart className="w-6 h-6 text-pink-500" />
            </div>
            <div className="text-2xl font-bold text-pink-600">
              {progressData.averageMood > 0 ? progressData.averageMood.toFixed(1) : '—'}
            </div>
            <div className="text-xs text-pink-600">Avg Mood</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Achievements */}
      {achievements.length > 0 && (
        <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800">Recent Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {achievements.slice(0, 3).map((achievement, index) => (
                <div 
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-white/70 rounded-lg border border-yellow-200"
                >
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="font-medium text-yellow-800 text-sm">
                      {achievement.title}
                    </div>
                    <div className="text-xs text-yellow-600">
                      {achievement.description}
                    </div>
                  </div>
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                </div>
              ))}
            </div>
            
            {achievements.length > 3 && (
              <div className="text-center mt-3">
                <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                  +{achievements.length - 3} more achievements
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Milestone Preview */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardContent className="p-4">
          <div className="text-center">
            <Calendar className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
            <h3 className="font-medium text-indigo-800 mb-1">Next Milestone</h3>
            <p className="text-sm text-indigo-600">
              {progressData.totalEntries < 10 ? 
                `Write ${10 - progressData.totalEntries} more entries to reach "Consistent Writer"` :
              progressData.totalEntries < 50 ?
                `Write ${50 - progressData.totalEntries} more entries to reach "Dedicated Journaler"` :
              progressData.currentStreak < 7 ?
                `Maintain your streak for ${7 - progressData.currentStreak} more days` :
                'Keep up the amazing work!'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VisualProgressTracker;