import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface LoadingStateProps {
  type?: 'card' | 'list' | 'text' | 'full';
  count?: number;
}

const LoadingState: React.FC<LoadingStateProps> = ({ type = 'card', count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <Card className="card-mobile">
            <CardHeader>
              <div className="loading-skeleton h-4 w-3/4 rounded mb-2"></div>
              <div className="loading-skeleton h-3 w-1/2 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="loading-skeleton h-3 w-full rounded"></div>
                <div className="loading-skeleton h-3 w-5/6 rounded"></div>
                <div className="loading-skeleton h-3 w-4/5 rounded"></div>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'list':
        return (
          <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                <div className="loading-skeleton w-10 h-10 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="loading-skeleton h-3 w-3/4 rounded"></div>
                  <div className="loading-skeleton h-2 w-1/2 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'text':
        return (
          <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="loading-skeleton h-3 w-full rounded"></div>
            ))}
          </div>
        );
      
      case 'full':
        return (
          <div className="viewport-height flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="loading-skeleton w-16 h-16 rounded-full mx-auto"></div>
              <div className="loading-skeleton h-4 w-32 rounded mx-auto"></div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="animate-pulse">
      {renderSkeleton()}
    </div>
  );
};

export default LoadingState;