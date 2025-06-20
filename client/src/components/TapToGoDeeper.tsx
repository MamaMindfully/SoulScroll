import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Brain, Sparkles, LoaderCircle, Eye } from "lucide-react";
import { isPremiumUser } from '../utils/SubscriptionEngine';

interface TapToGoDeeperProps {
  originalPrompt: string;
  userEntry: string;
  onDeepInsight?: (insight: string) => void;
}

const TapToGoDeeper: React.FC<TapToGoDeeperProps> = ({
  originalPrompt,
  userEntry,
  onDeepInsight
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [deeperInsights, setDeeperInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(0);
  const isPremium = isPremiumUser();

  const getDeeperPrompt = async (entry: string, basePrompt: string, level: number = 0) => {
    try {
      const response = await fetch('/api/deeper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          entry: entry, 
          basePrompt: basePrompt,
          level: level,
          previousInsights: deeperInsights
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get deeper insight');
      }

      const data = await response.json();
      return data.deeperReflection || "No further insights found at this time.";
    } catch (error) {
      console.error('Error getting deeper prompt:', error);
      return "Your thoughts hold layers of wisdom waiting to be explored. What does your heart want to say about this?";
    }
  };

  const handleGoDeeper = async () => {
    if (!isPremium) {
      return;
    }

    setIsLoading(true);
    
    try {
      const newInsight = await getDeeperPrompt(userEntry, originalPrompt, currentLevel);
      const updatedInsights = [...deeperInsights, newInsight];
      
      setDeeperInsights(updatedInsights);
      setCurrentLevel(currentLevel + 1);
      setIsExpanded(true);
      
      if (onDeepInsight) {
        onDeepInsight(newInsight);
      }
    } catch (error) {
      console.error('Error in handleGoDeeper:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (currentLevel === 0) return "Go Deeper";
    if (currentLevel === 1) return "Explore Further";
    if (currentLevel === 2) return "Dive Deeper";
    return "Continue Exploring";
  };

  const getInsightTitle = (level: number) => {
    const titles = [
      "🔍 Deeper Reflection",
      "💡 Further Insight", 
      "🌊 Profound Understanding",
      "✨ Soul-Level Wisdom",
      "🌟 Transcendent Clarity"
    ];
    return titles[level] || "🌟 Deep Wisdom";
  };

  if (!isPremium) {
    return (
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 mt-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="w-5 h-5 text-indigo-500" />
              <div>
                <div className="font-medium text-indigo-800 text-sm">
                  Go Deeper
                </div>
                <div className="text-xs text-indigo-600">
                  Unlock progressive AI insights
                </div>
              </div>
            </div>
            <div className="text-center">
              <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 mb-2">
                Premium
              </Badge>
              <Button 
                size="sm" 
                variant="outline"
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              >
                Upgrade
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {/* Main Go Deeper Button */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardContent className="p-4">
          <Button
            onClick={handleGoDeeper}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600"
            style={{ minHeight: '44px' }}
          >
            {isLoading ? (
              <>
                <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                <span style={{ fontSize: 'clamp(0.9rem, 2.2vw, 1rem)' }}>
                  Reflecting deeper...
                </span>
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                <span style={{ fontSize: 'clamp(0.9rem, 2.2vw, 1rem)' }}>
                  {getButtonText()}
                </span>
                <ChevronDown className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
          
          {currentLevel > 0 && (
            <div className="flex items-center justify-center mt-2 space-x-2">
              <Eye className="w-3 h-3 text-indigo-500" />
              <span className="text-xs text-indigo-600">
                Depth Level: {currentLevel}
              </span>
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(currentLevel, 5) }).map((_, i) => (
                  <div 
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deeper Insights */}
      {isExpanded && deeperInsights.length > 0 && (
        <div className="space-y-3">
          {deeperInsights.map((insight, index) => (
            <Card 
              key={index}
              className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 animate-in slide-in-from-bottom duration-500"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-purple-800 text-sm">
                        {getInsightTitle(index)}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className="border-purple-300 text-purple-700 text-xs"
                      >
                        Level {index + 1}
                      </Badge>
                    </div>
                    <p className="text-gray-800 text-sm leading-relaxed italic">
                      {insight}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Continue Prompt */}
      {deeperInsights.length > 0 && currentLevel < 5 && (
        <Card className="border-gray-200 bg-gradient-to-br from-gray-50 to-blue-50">
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Ready to explore even deeper layers of understanding?
              </p>
              <Button
                onClick={handleGoDeeper}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              >
                {isLoading ? (
                  <LoaderCircle className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Brain className="w-3 h-3 mr-1" />
                )}
                {getButtonText()}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Maximum Depth Reached */}
      {currentLevel >= 5 && (
        <Card className="border-gold-200 bg-gradient-to-br from-yellow-50 to-amber-50">
          <CardContent className="p-4">
            <div className="text-center">
              <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <h4 className="font-medium text-amber-800 mb-1">
                🌟 Maximum Depth Reached
              </h4>
              <p className="text-sm text-amber-700">
                You've journeyed through the deepest layers of reflection. 
                Take time to integrate these profound insights.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TapToGoDeeper;