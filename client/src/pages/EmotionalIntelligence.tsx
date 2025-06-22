import React from 'react';
import EmotionalDashboard from '@/components/EmotionalDashboard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Clock, Compass } from "lucide-react";

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
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-black/40 border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-400">
                <Brain className="w-5 h-5" />
                Emotion Pulse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm">
                Visualize your emotional journey over time with interactive timeline charts
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
                Daily personalized prompts that guide you toward deeper self-reflection
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
                Reflective insights on journal entries from 30 days ago, showing your growth
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <EmotionalDashboard />

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Your emotional intelligence grows through consistent journaling and self-reflection
          </p>
        </div>
      </div>
    </div>
  );
}