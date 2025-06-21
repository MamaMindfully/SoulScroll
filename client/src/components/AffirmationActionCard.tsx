import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Target, CheckCircle, RefreshCw, Sparkles, ArrowRight } from "lucide-react";
import { 
  getActionFromAffirmation, 
  generateDailyAffirmationAction, 
  trackActionCompletion,
  getWeeklyActionProgress 
} from "@/utils/affirmationActionMapper";
import { usePremium } from "@/context/PremiumContext";

interface AffirmationAction {
  affirmation: string;
  action: string;
  timestamp: string;
  source?: string;
}

interface ActionProgress {
  completed_this_week: number;
  total_actions: number;
  completion_rate: number;
  streak_days: number;
  favorite_action_type: string;
}

export default function AffirmationActionCard() {
  const [affirmationAction, setAffirmationAction] = useState<AffirmationAction | null>(null);
  const [customAffirmation, setCustomAffirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionCompleted, setActionCompleted] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [progress, setProgress] = useState<ActionProgress | null>(null);
  const { isPremium } = usePremium();

  useEffect(() => {
    loadDailyAction();
    loadProgress();
  }, []);

  const loadDailyAction = async () => {
    try {
      setLoading(true);
      const dailyAction = await generateDailyAffirmationAction();
      setAffirmationAction(dailyAction);
    } catch (error) {
      console.error('Error loading daily action:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    try {
      const weeklyProgress = await getWeeklyActionProgress();
      setProgress(weeklyProgress);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const handleCustomAffirmation = async () => {
    if (!customAffirmation.trim()) return;

    try {
      setLoading(true);
      const action = await getActionFromAffirmation(customAffirmation);
      
      setAffirmationAction({
        affirmation: customAffirmation,
        action: action,
        timestamp: new Date().toISOString(),
        source: 'custom'
      });
      
      setCustomAffirmation('');
      setShowCustomInput(false);
      setActionCompleted(false);
    } catch (error) {
      console.error('Error generating custom action:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActionComplete = async () => {
    if (!affirmationAction) return;

    try {
      await trackActionCompletion(affirmationAction.action, true);
      setActionCompleted(true);
      loadProgress(); // Refresh progress
    } catch (error) {
      console.error('Error tracking action completion:', error);
    }
  };

  const handleRefreshAction = async () => {
    if (!affirmationAction) return;

    try {
      setLoading(true);
      const newAction = await getActionFromAffirmation(affirmationAction.affirmation);
      
      setAffirmationAction({
        ...affirmationAction,
        action: newAction,
        timestamp: new Date().toISOString()
      });
      
      setActionCompleted(false);
    } catch (error) {
      console.error('Error refreshing action:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !affirmationAction) {
    return (
      <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-pink-400 border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Overview */}
      {progress && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {progress.completed_this_week}
                </div>
                <div className="text-xs text-blue-500">This Week</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(progress.completion_rate * 100)}%
                </div>
                <div className="text-xs text-green-500">Success Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {progress.streak_days}
                </div>
                <div className="text-xs text-purple-500">Day Streak</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600 capitalize">
                  {progress.favorite_action_type}
                </div>
                <div className="text-xs text-orange-500">Favorite Type</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Affirmation Action Card */}
      <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-pink-800 flex items-center space-x-2">
              <Heart className="w-5 h-5" />
              <span>Soul-Task of the Day</span>
            </CardTitle>
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowCustomInput(!showCustomInput)}
                variant="outline"
                size="sm"
                className="border-pink-300 text-pink-700 hover:bg-pink-50"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Custom
              </Button>
              {affirmationAction && (
                <Button
                  onClick={handleRefreshAction}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  className="border-pink-300 text-pink-700 hover:bg-pink-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Custom Affirmation Input */}
          {showCustomInput && (
            <div className="space-y-3 p-4 bg-pink-100 rounded-lg border border-pink-200">
              <label className="text-sm font-medium text-pink-800">
                Create your own affirmation:
              </label>
              <Textarea
                placeholder="I am..."
                value={customAffirmation}
                onChange={(e) => setCustomAffirmation(e.target.value)}
                className="min-h-[60px] border-pink-200 focus:border-pink-400"
              />
              <div className="flex space-x-2">
                <Button
                  onClick={handleCustomAffirmation}
                  disabled={!customAffirmation.trim() || loading}
                  className="bg-pink-500 hover:bg-pink-600 text-white"
                  size="sm"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-1" />
                  )}
                  Generate Action
                </Button>
                <Button
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomAffirmation('');
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Affirmation & Action Display */}
          {affirmationAction && (
            <div className="space-y-4">
              {/* Affirmation */}
              <div className="p-4 bg-pink-100 rounded-lg border border-pink-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className="w-4 h-4 text-pink-600" />
                  <span className="text-sm font-medium text-pink-800">Today's Affirmation</span>
                  {affirmationAction.source === 'custom' && (
                    <Badge variant="outline" className="border-pink-300 text-pink-700 text-xs">
                      Custom
                    </Badge>
                  )}
                </div>
                <p className="text-pink-800 font-medium italic text-lg leading-relaxed">
                  "{affirmationAction.affirmation}"
                </p>
              </div>

              {/* Action */}
              <div className="p-4 bg-gradient-to-r from-rose-100 to-pink-100 rounded-lg border border-rose-200">
                <div className="flex items-start space-x-3">
                  <Target className="w-5 h-5 text-rose-600 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-medium text-rose-800 mb-2">Your Mission</h4>
                    <p className="text-rose-700 leading-relaxed">
                      {affirmationAction.action}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {!actionCompleted ? (
                <Button
                  onClick={handleActionComplete}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Complete
                </Button>
              ) : (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                  <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">Soul-task completed!</p>
                  <p className="text-green-600 text-sm">
                    You're building beautiful momentum
                  </p>
                </div>
              )}
            </div>
          )}

          {/* First Time Usage */}
          {!affirmationAction && !loading && (
            <div className="text-center py-6">
              <Heart className="w-12 h-12 text-pink-400 mx-auto mb-3" />
              <h3 className="font-medium text-pink-800 mb-2">
                Transform Affirmations into Action
              </h3>
              <p className="text-pink-600 text-sm mb-4">
                Turn your positive intentions into concrete daily practices
              </p>
              <Button
                onClick={loadDailyAction}
                className="bg-pink-500 hover:bg-pink-600 text-white"
              >
                Get Today's Soul-Task
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}