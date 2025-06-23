import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Gift, Star, Sparkles, Trophy, Target } from "lucide-react";
import { getWeeklyPortalStatus, checkRewardUnlock, generateWeeklyTheme } from "@/utils/weeklyPortalEngine";
import { usePremium } from "@/context/PremiumContext";

interface WeeklyTheme {
  title: string;
  description: string;
  color: string;
  affirmation: string;
}

interface PortalStatus {
  weekId: string;
  completed_days: number;
  week_progress: number;
  reward_claimed: boolean;
  is_week_complete: boolean;
  days_remaining_in_week: number;
  streak_status: {
    status: string;
    message: string;
  };
}

export default function WeeklyPortalCard() {
  const [portalStatus, setPortalStatus] = useState<PortalStatus | null>(null);
  const [weeklyTheme, setWeeklyTheme] = useState<WeeklyTheme | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [rewardMessage, setRewardMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { isPremium } = usePremium();

  useEffect(() => {
    loadPortalData();
  });

  const loadPortalData = async () => {
    try {
      const [status, theme] = await Promise.all([
        getWeeklyPortalStatus('user'),
        generateWeeklyTheme()
      ]);
      
      setPortalStatus(status);
      setWeeklyTheme(theme);
    } catch (error) {
      console.error('Error loading portal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckReward = async () => {
    try {
      const result = await checkRewardUnlock('user');
      if (result.unlocked) {
        setShowReward(true);
        setRewardMessage(result.reward || result.message);
        // Reload status to reflect claimed reward
        loadPortalData();
      }
    } catch (error) {
      console.error('Error checking reward:', error);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!portalStatus || !weeklyTheme) {
    return null;
  }

  const progressPercentage = (portalStatus.completed_days / 7) * 100;
  const canClaimReward = portalStatus.completed_days >= 5 && !portalStatus.reward_claimed;

  return (
    <div className="space-y-4">
      {/* Weekly Theme Card */}
      <Card className={`bg-gradient-to-br from-${weeklyTheme.color}-50 to-${weeklyTheme.color}-100 border-${weeklyTheme.color}-200`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className={`text-${weeklyTheme.color}-800 flex items-center space-x-2`}>
              <Sparkles className="w-5 h-5" />
              <span>This Week's Theme</span>
            </CardTitle>
            <Badge variant="outline" className={`border-${weeklyTheme.color}-300 text-${weeklyTheme.color}-700`}>
              {portalStatus.weekId}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <h3 className={`text-xl font-bold text-${weeklyTheme.color}-900`}>
              {weeklyTheme.title}
            </h3>
            <p className={`text-${weeklyTheme.color}-700 text-sm leading-relaxed`}>
              {weeklyTheme.description}
            </p>
            <div className={`p-3 bg-${weeklyTheme.color}-100 rounded-lg border border-${weeklyTheme.color}-200`}>
              <p className={`text-${weeklyTheme.color}-800 text-sm italic font-medium`}>
                "{weeklyTheme.affirmation}"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portal Progress Card */}
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-indigo-800 flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Weekly Ritual Portal</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-indigo-700">
                Progress: {portalStatus.completed_days}/7 days
              </span>
              <span className="text-sm text-indigo-600">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-3 bg-indigo-100"
            />
          </div>

          {/* Streak Status */}
          <div className="flex items-center space-x-2">
            <Star className={`w-4 h-4 ${
              portalStatus.streak_status.status === 'perfect' ? 'text-yellow-500' :
              portalStatus.streak_status.status === 'strong' ? 'text-green-500' :
              portalStatus.streak_status.status === 'building' ? 'text-blue-500' :
              'text-gray-400'
            }`} />
            <span className="text-sm text-indigo-700">
              {portalStatus.streak_status.message}
            </span>
          </div>

          {/* Days Visualization */}
          <div className="flex space-x-2">
            {Array.from({ length: 7 }).map((_, index) => {
              const isCompleted = index < portalStatus.completed_days;
              const isToday = index === new Date().getDay();
              
              return (
                <div
                  key={index}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isToday 
                        ? 'bg-indigo-200 text-indigo-700 border-2 border-indigo-400'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
              );
            })}
          </div>

          {/* Reward Section */}
          {canClaimReward && (
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Gift className="w-6 h-6 text-amber-600" />
                  <div>
                    <h4 className="font-medium text-amber-800">Reward Ready!</h4>
                    <p className="text-sm text-amber-600">You've unlocked this week's mystery reward</p>
                  </div>
                </div>
                <Button
                  onClick={handleCheckReward}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                  size="sm"
                >
                  Claim
                </Button>
              </div>
            </div>
          )}

          {portalStatus.reward_claimed && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
              <Trophy className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-sm text-green-700 font-medium">Weekly reward claimed!</p>
            </div>
          )}

          {/* Time Remaining */}
          {portalStatus.days_remaining_in_week > 0 && (
            <div className="text-center">
              <p className="text-xs text-indigo-600">
                {portalStatus.days_remaining_in_week} day{portalStatus.days_remaining_in_week !== 1 ? 's' : ''} remaining this week
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reward Modal */}
      {showReward && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full bg-gradient-to-br from-yellow-50 to-amber-50 border-amber-200">
            <CardContent className="p-6 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                  <Gift className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-amber-800">
                  Weekly Reward Unlocked!
                </h3>
                <p className="text-amber-700">
                  {rewardMessage}
                </p>
                <Button
                  onClick={() => setShowReward(false)}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  Awesome!
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}