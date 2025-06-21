import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Heart, Sparkles, Target } from "lucide-react";
import EmotionalResonanceCard from '@/components/EmotionalResonanceCard';
import WeeklyPortalCard from '@/components/WeeklyPortalCard';
import AffirmationActionCard from '@/components/AffirmationActionCard';

export default function InsightsPage() {
  return (
    <div className="container-mobile space-y-6 touch-spacing">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-wisdom flex items-center justify-center space-x-2">
          <Brain className="w-6 h-6 text-primary" />
          <span>Soul Insights</span>
        </h1>
        <p className="text-wisdom/70 text-sm">
          Discover patterns, unlock wisdom, and track your emotional journey
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="space-y-6">
        {/* Emotional Resonance */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-wisdom">Emotional Patterns</h2>
            <Badge variant="outline" className="text-xs">
              AI Powered
            </Badge>
          </div>
          <EmotionalResonanceCard />
        </div>

        {/* Weekly Portal */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-wisdom">Weekly Rituals</h2>
            <Badge variant="outline" className="text-xs">
              Progress Tracking
            </Badge>
          </div>
          <WeeklyPortalCard />
        </div>

        {/* Affirmation Actions */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-pink-600" />
            <h2 className="text-lg font-semibold text-wisdom">Soul Tasks</h2>
            <Badge variant="outline" className="text-xs">
              Daily Actions
            </Badge>
          </div>
          <AffirmationActionCard />
        </div>
      </div>

      {/* Coming Soon Features */}
      <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-700 text-lg">Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-white/60 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-1">Dream Patterns</h4>
              <p className="text-sm text-gray-600">
                Track recurring themes in your dreams and subconscious patterns
              </p>
            </div>
            <div className="p-3 bg-white/60 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-1">Relationship Insights</h4>
              <p className="text-sm text-gray-600">
                Discover how your relationships influence your emotional well-being
              </p>
            </div>
            <div className="p-3 bg-white/60 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-1">Growth Timeline</h4>
              <p className="text-sm text-gray-600">
                Visualize your personal development journey over time
              </p>
            </div>
            <div className="p-3 bg-white/60 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-1">Seasonal Patterns</h4>
              <p className="text-sm text-gray-600">
                See how seasons and weather affect your mood and energy
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}