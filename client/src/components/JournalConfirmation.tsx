import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Heart, Sparkles, BookOpen, ArrowRight } from "lucide-react";

interface JournalConfirmationProps {
  wordCount: number;
  emotionalTone?: string;
  hasAiFeedback: boolean;
  onViewHistory: () => void;
  onNewEntry: () => void;
  onViewFeedback?: () => void;
}

const JournalConfirmation: React.FC<JournalConfirmationProps> = ({
  wordCount,
  emotionalTone,
  hasAiFeedback,
  onViewHistory,
  onNewEntry,
  onViewFeedback
}) => {
  const encouragements = [
    "Your reflection has been tenderly saved",
    "Your thoughts are safely captured",
    "Your wisdom has been preserved",
    "Your journey moment is recorded",
    "Your authentic voice is honored"
  ];

  const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

  return (
    <div className="space-y-6">
      {/* Main Confirmation */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto animate-pulse" />
          </div>
          <CardTitle className="text-green-800 text-xl">
            ✨ Reflection Saved
          </CardTitle>
          <p className="text-green-600 text-sm">
            {randomEncouragement}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-3 bg-white/70 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">{wordCount}</div>
              <div className="text-xs text-green-600">Words Written</div>
            </div>
            
            <div className="text-center p-3 bg-white/70 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {emotionalTone ? '✓' : '○'}
              </div>
              <div className="text-xs text-green-600">
                {emotionalTone ? 'Tone Analyzed' : 'Processing'}
              </div>
            </div>
          </div>

          {emotionalTone && (
            <div className="text-center mb-4">
              <Badge variant="outline" className="border-green-300 text-green-700">
                Emotional Tone: {emotionalTone}
              </Badge>
            </div>
          )}

          <div className="space-y-3">
            {hasAiFeedback && onViewFeedback && (
              <Button 
                onClick={onViewFeedback}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                View AI Insights
              </Button>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={onViewHistory}
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                View History
              </Button>
              
              <Button 
                onClick={onNewEntry}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white"
              >
                <Heart className="w-4 h-4 mr-2" />
                New Entry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journey Progress */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Heart className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-sm font-medium text-blue-800">
                  Your Journaling Journey
                </div>
                <div className="text-xs text-blue-600">
                  Every entry deepens your self-understanding
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-blue-400" />
          </div>
        </CardContent>
      </Card>

      {/* Daily Wisdom */}
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
        <CardContent className="p-4">
          <div className="text-center">
            <Sparkles className="w-6 h-6 text-amber-600 mx-auto mb-2" />
            <p className="text-sm text-amber-800 italic">
              "The act of writing is the act of discovering what you believe." 
            </p>
            <p className="text-xs text-amber-600 mt-1">
              — David Hare
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JournalConfirmation;