import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, Heart, Sparkles, TrendingUp, Gift } from "lucide-react";

interface OptimisticLoadingIndicatorProps {
  loadingStates: {
    reflecting: boolean;
    scoringEmotion: boolean;
    arcReviewing: boolean;
    updatingProgress: boolean;
    checkingRewards: boolean;
  };
  message?: string;
}

const OptimisticLoadingIndicator: React.FC<OptimisticLoadingIndicatorProps> = ({
  loadingStates,
  message
}) => {
  const steps = [
    {
      key: 'reflecting',
      icon: Brain,
      text: 'Reflecting on your thoughts...',
      active: loadingStates.reflecting
    },
    {
      key: 'scoringEmotion',
      icon: Heart,
      text: 'Scoring emotional resonance...',
      active: loadingStates.scoringEmotion
    },
    {
      key: 'arcReviewing',
      icon: Sparkles,
      text: 'Arc is reviewing your entry...',
      active: loadingStates.arcReviewing
    },
    {
      key: 'updatingProgress',
      icon: TrendingUp,
      text: 'Updating your progress...',
      active: loadingStates.updatingProgress
    },
    {
      key: 'checkingRewards',
      icon: Gift,
      text: 'Checking for new rewards...',
      active: loadingStates.checkingRewards
    }
  ];

  const activeStepIndex = steps.findIndex(step => step.active);
  const completedSteps = activeStepIndex === -1 ? steps.length : activeStepIndex;
  const progress = ((completedSteps) / steps.length) * 100;

  const isActive = Object.values(loadingStates).some(state => state);

  if (!isActive) return null;

  return (
    <Card className="mb-6 border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-pink-50">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-purple-700">
                {message || 'Processing your journal entry...'}
              </p>
              <span className="text-xs text-purple-600">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress 
              value={progress} 
              className="h-2 bg-purple-100"
            />
          </div>

          {/* Step indicators */}
          <div className="space-y-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index < completedSteps;
              const isActive = step.active;
              const isPending = index > completedSteps;

              return (
                <div 
                  key={step.key}
                  className={`flex items-center space-x-3 transition-all duration-300 ${
                    isActive ? 'scale-105' : ''
                  }`}
                >
                  <div className={`
                    flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300
                    ${isCompleted ? 'bg-green-500 text-white' : ''}
                    ${isActive ? 'bg-purple-500 text-white animate-pulse' : ''}
                    ${isPending ? 'bg-gray-200 text-gray-400' : ''}
                  `}>
                    {isCompleted ? (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <Icon className="w-3 h-3" />
                    )}
                  </div>
                  
                  <span className={`text-sm transition-all duration-300 ${
                    isActive ? 'text-purple-700 font-medium' : ''
                  } ${
                    isCompleted ? 'text-green-700' : ''
                  } ${
                    isPending ? 'text-gray-500' : ''
                  }`}>
                    {step.text}
                  </span>

                  {isActive && (
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Estimated completion time */}
          <div className="text-xs text-gray-500 pt-2 border-t border-purple-200">
            Estimated completion: {activeStepIndex !== -1 ? '15-30 seconds' : 'Almost done!'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OptimisticLoadingIndicator;