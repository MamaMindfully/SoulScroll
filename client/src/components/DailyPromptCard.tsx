import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Sunrise } from "lucide-react";
import { useAppStore } from '@/store/appStore';

const DailyPromptCard: React.FC = () => {
  const [prompt, setPrompt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { userId, isLoggedIn } = useAppStore();

  const fetchDailyPrompt = async () => {
    setIsLoading(true);
    
    try {
      const userIdToUse = userId || localStorage.getItem('userId') || 'demo-user';
      const response = await fetch(`/api/daily-prompt?userId=${userIdToUse}`);
      const data = await response.json();
      
      if (data.dailyMessage) {
        setPrompt(data.dailyMessage);
      }
    } catch (error) {
      console.error('Failed to fetch daily prompt:', error);
      setPrompt("What intention would you like to set for today?");
    } finally {
      setIsLoading(false);
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
            <Sunrise className="w-5 h-5 text-amber-600" />
            <span className="text-amber-800">Daily Reflection</span>
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
          <blockquote className="text-amber-800 italic text-center leading-relaxed">
            "{prompt}"
          </blockquote>
        ) : (
          <div className="text-center text-amber-600">
            <div className="animate-pulse">Loading your daily reflection...</div>
          </div>
        )}
        
        <div className="mt-4 text-xs text-amber-600 text-center opacity-75">
          A thoughtful prompt to guide your journaling today
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyPromptCard;