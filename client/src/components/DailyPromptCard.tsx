import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Sunrise, Heart, MessageCircle, ThumbsUp, X } from "lucide-react";
import { useAppStore } from '@/store/appStore';

interface PromptData {
  type: 'affirmation' | 'reflection';
  message: string;
}

const DailyPromptCard: React.FC = () => {
  const [prompt, setPrompt] = useState<PromptData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const { userId, isLoggedIn } = useAppStore();

  const fetchDailyPrompt = async () => {
    setIsLoading(true);
    
    try {
      const userIdToUse = userId || localStorage.getItem('userId') || 'demo-user';
      const response = await fetch(`/api/daily-prompt?userId=${userIdToUse}`);
      const data = await response.json();
      
      if (data.type && data.message) {
        setPrompt({ type: data.type, message: data.message });
        setFeedbackSent(false);
      }
    } catch (error) {
      console.error('Failed to fetch daily prompt:', error);
      setPrompt({ 
        type: "reflection", 
        message: "What intention would you like to set for today?" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendFeedback = async (feedback: 'liked' | 'skipped') => {
    try {
      const userIdToUse = userId || localStorage.getItem('userId') || 'demo-user';
      await fetch('/api/daily-prompt/feedback', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userIdToUse, feedback })
      });
      
      setFeedbackSent(true);
    } catch (error) {
      console.error('Failed to send feedback:', error);
    }
  };

  useEffect(() => {
    fetchDailyPrompt();
  }, [userId, isLoggedIn]);

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {prompt?.type === 'affirmation' ? (
              <Heart className="w-5 h-5 text-amber-600" />
            ) : (
              <MessageCircle className="w-5 h-5 text-amber-600" />
            )}
            <span className="text-amber-800">
              {prompt?.type === 'affirmation' ? 'Daily Affirmation' : 'Daily Reflection'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchDailyPrompt}
            disabled={isLoading}
            className="text-amber-600 hover:text-amber-700"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {prompt ? (
          <>
            <blockquote className="text-amber-800 italic text-center leading-relaxed mb-4">
              "{prompt.message}"
            </blockquote>
            
            {!feedbackSent && (
              <div className="flex justify-center space-x-3 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sendFeedback('liked')}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  Love it
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sendFeedback('skipped')}
                  className="text-gray-500 border-gray-200 hover:bg-gray-50"
                >
                  <X className="w-4 h-4 mr-1" />
                  Skip
                </Button>
              </div>
            )}
            
            {feedbackSent && (
              <div className="text-center text-green-600 text-sm mb-3">
                Thanks for your feedback! This helps us personalize your experience.
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-amber-600">
            <div className="animate-pulse">Loading your daily reflection...</div>
          </div>
        )}
        
        <div className="text-xs text-amber-600 text-center opacity-75">
          A thoughtful prompt to guide your journaling today
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyPromptCard;