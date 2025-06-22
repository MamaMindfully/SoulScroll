import React from 'react';
import EmotionalDashboard from '@/components/EmotionalDashboard';
import BehaviorInsights from '@/components/BehaviorInsights';
import AdaptiveJournalPrompt from '@/components/AdaptiveJournalPrompt';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Clock, Compass, TrendingUp } from "lucide-react";

export default function EmotionalIntelligence() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
            Emotional Intelligence Center
          </h1>
          <p className="text-gray-300 text-lg">
            Discover patterns, insights, and wisdom from your journaling journey
          </p>
        </div>

        {/* Feature Overview Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-black/40 border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-400">
                <Brain className="w-5 h-5" />
                Emotion Pulse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm">
                Visualize your emotional journey over time
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-blue-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-400">
                <Compass className="w-5 h-5" />
                Inner Compass
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm">
                AI-powered daily prompts for deeper reflection
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-indigo-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-400">
                <Clock className="w-5 h-5" />
                Memory Loop
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm">
                Insights on past entries showing growth
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-emerald-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-400">
                <TrendingUp className="w-5 h-5" />
                Personalized
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm">
                Learns your patterns and adapts to you
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Adaptive Journal Prompt */}
        <AdaptiveJournalPrompt />

        {/* Main Dashboard */}
        <EmotionalDashboard />

        {/* Behavior Insights */}
        <BehaviorInsights />

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Your experience becomes more personalized as the system learns your preferences and patterns
          </p>
        </div>
      </div>
    </div>
  );
}