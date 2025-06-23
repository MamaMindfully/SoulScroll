import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Lightbulb } from "lucide-react";
import { useDailyReminder } from '@/hooks/useDailyReminder';
import { useAppStore } from '@/store/appStore';

const DailyNotification: React.FC = () => {
  const { message, dismissReminder } = useDailyReminder();
  const [feedbackSent, setFeedbackSent] = React.useState(false);
  const { userId } = useAppStore();

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
      if (feedback === 'liked') {
        setTimeout(() => dismissReminder(), 3000); // Auto-dismiss after 3 seconds if liked
      } else {
        dismissReminder(); // Dismiss immediately if skipped
      }
    } catch (error) {
      console.error('Failed to send feedback:', error);
      dismissReminder(); // Dismiss on error to prevent stuck notification
    }
  };

  if (!message) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <Card className="bg-white shadow-lg border-l-4 border-l-purple-500 max-w-xs">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-4 h-4 text-purple-600" />
              <p className="text-sm font-medium text-purple-700">Daily Prompt</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissReminder}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          
          <p className="text-sm text-gray-800 italic leading-relaxed">
            "{message}"
          </p>
          
          {!feedbackSent ? (
            <div className="mt-3 flex justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendFeedback('liked')}
                className="text-xs text-green-600 border-green-200 hover:bg-green-50"
              >
                Love it
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendFeedback('skipped')}
                className="text-xs text-gray-500 border-gray-200 hover:bg-gray-50"
              >
                Skip
              </Button>
            </div>
          ) : (
            <div className="mt-3 text-center text-green-600 text-xs">
              Thanks! This helps us personalize your experience.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyNotification;