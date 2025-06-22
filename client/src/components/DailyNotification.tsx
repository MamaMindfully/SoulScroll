import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Lightbulb } from "lucide-react";
import { useDailyReminder } from '@/hooks/useDailyReminder';

const DailyNotification: React.FC = () => {
  const { message, dismissReminder } = useDailyReminder();

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
          
          <div className="mt-3 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={dismissReminder}
              className="text-xs"
            >
              Reflect Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyNotification;