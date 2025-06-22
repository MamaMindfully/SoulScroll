import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Brain, Heart, TrendingUp, Eye } from "lucide-react";
import { useAIJournal } from "@/hooks/useAIJournal";
import { useFeatureAccess } from "@/store/appStore";
import LockedFeatureMessage from "./LockedFeatureMessage";

interface AIJournalAnalyzerProps {
  initialText?: string;
  onAnalysisComplete?: (result: any) => void;
}

const AIJournalAnalyzer: React.FC<AIJournalAnalyzerProps> = ({
  initialText = '',
  onAnalysisComplete
}) => {
  const [journalText, setJournalText] = useState(initialText);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  const { analyzeJournalEntry, isAnalyzing, analysisError } = useAIJournal();
  const featureAccess = useFeatureAccess();

  const handleAnalyze = async () => {
    if (!journalText.trim()) return;

    try {
      const result = await analyzeJournalEntry.mutateAsync(journalText);
      setAnalysisResult(result);
      onAnalysisComplete?.(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  // Check if user has access to AI analysis features
  if (!featureAccess.progress) {
    return (
      <LockedFeatureMessage
        message="Upgrade to Premium to unlock AI-powered journal analysis and emotional insights."
        feature="AI Journal Analysis"
        description="Get personalized insights, emotion tracking, and growth recommendations powered by advanced AI."
      />
    );
  }

  const getEmotionColor = (score: number) => {
    if (score >= 7) return 'bg-green-100 text-green-800';
    if (score >= 4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getInsightDepthColor = (depth: number) => {
    if (depth >= 7) return 'bg-purple-100 text-purple-800';
    if (depth >= 4) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span>AI Journal Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste your journal entry here for AI analysis..."
            value={journalText}
            onChange={(e) => setJournalText(e.target.value)}
            className="min-h-[120px] resize-none"
          />
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {journalText.length} characters • {journalText.split(/\s+/).filter(word => word.length > 0).length} words
            </div>
            
            <Button 
              onClick={handleAnalyze}
              disabled={!journalText.trim() || isAnalyzing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Analyze Entry
                </>
              )}
            </Button>
          </div>

          {analysisError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">
                Analysis failed: {analysisError.message}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {analysisResult && (
        <div className="space-y-4">
          {/* Metrics Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Heart className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="text-2xl font-bold">{analysisResult.emotionScore}/10</div>
                  <div className="text-sm text-gray-600">Emotion Score</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Eye className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold">{analysisResult.insightDepth}/10</div>
                  <div className="text-sm text-gray-600">Insight Depth</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold">{analysisResult.wordCount}</div>
                  <div className="text-sm text-gray-600">Words</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Brain className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="text-2xl font-bold">{analysisResult.emotionLabels.length}</div>
                  <div className="text-sm text-gray-600">Emotions</div>
                </div>
              </div>

              {/* Emotion Labels */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Detected Emotions</h4>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.emotionLabels.map((emotion: string, index: number) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className={getEmotionColor(analysisResult.emotionScore)}
                    >
                      {emotion}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* AI Insight */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                <h4 className="text-sm font-medium text-purple-800 mb-2 flex items-center">
                  <Brain className="w-4 h-4 mr-2" />
                  AI Insight
                </h4>
                <p className="text-purple-700 leading-relaxed">
                  {analysisResult.insight}
                </p>
                {analysisResult.fallbackInsight && (
                  <p className="text-purple-600 text-sm mt-2 italic">
                    Fallback: {analysisResult.fallbackInsight}
                  </p>
                )}
              </div>

              {/* Analysis Timestamp */}
              <div className="text-xs text-gray-500 mt-4">
                Analyzed on {new Date(analysisResult.timestamp).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AIJournalAnalyzer;