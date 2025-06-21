import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, ThumbsDown, Brain, Check, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ReflectionFeedbackProps {
  reflectionText: string;
  onAskForAnother?: () => void;
  className?: string;
}

const ReflectionFeedback: React.FC<ReflectionFeedbackProps> = ({
  reflectionText,
  onAskForAnother,
  className = ''
}) => {
  const [feedbackGiven, setFeedbackGiven] = useState<'saved' | 'dismissed' | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveReflectionMutation = useMutation({
    mutationFn: async (action: 'save' | 'dismiss') => {
      const response = await apiRequest('POST', '/api/reflections/save', {
        reflectionText,
        action,
        archived: action === 'save',
        dismissed: action === 'dismiss'
      });
      return response.json();
    },
    onSuccess: (data, action) => {
      setFeedbackGiven(action === 'save' ? 'saved' : 'dismissed');
      toast({
        title: action === 'save' ? "Reflection Saved" : "Feedback Noted",
        description: action === 'save' 
          ? "Added to your personal archive for future reference"
          : "We'll use this to improve your experience",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/reflections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reflections/saved'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save feedback. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    saveReflectionMutation.mutate('save');
  };

  const handleDismiss = () => {
    saveReflectionMutation.mutate('dismiss');
  };

  const handleAskAnother = () => {
    if (onAskForAnother) {
      onAskForAnother();
    }
  };

  if (feedbackGiven) {
    return (
      <Card className={`bg-green-50 border-green-200 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-green-700">
            <Check className="w-4 h-4" />
            <span className="text-sm">
              {feedbackGiven === 'saved' ? 'Reflection saved to your archive' : 'Thank you for your feedback'}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-slate-50 border-slate-200 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600 mb-3">How was this reflection?</p>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={saveReflectionMutation.isPending}
              className="flex items-center space-x-1 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
            >
              {saveReflectionMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Heart className="w-4 h-4" />
              )}
              <span>Save</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              disabled={saveReflectionMutation.isPending}
              className="flex items-center space-x-1 hover:bg-gray-50"
            >
              <ThumbsDown className="w-4 h-4" />
              <span>Dismiss</span>
            </Button>
            
            {onAskForAnother && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAskAnother}
                disabled={saveReflectionMutation.isPending}
                className="flex items-center space-x-1 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
              >
                <Brain className="w-4 h-4" />
                <span>Ask Again</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReflectionFeedback;