import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTreeStage, getTreeStageInfo, getTreeMessages } from '@/engines/treeProgressEngine';
import { Sparkles, Target } from 'lucide-react';

interface TreeProgressProps {
  streak: number;
  className?: string;
}

const TreeProgress: React.FC<TreeProgressProps> = ({ streak, className = '' }) => {
  const [treeImg, setTreeImg] = useState<string>('');
  const [stageInfo, setStageInfo] = useState<any>(null);
  const [currentMessage, setCurrentMessage] = useState<string>('');

  useEffect(() => {
    setTreeImg(getTreeStage(streak));
    setStageInfo(getTreeStageInfo(streak));
    
    const messages = getTreeMessages(streak);
    setCurrentMessage(messages[Math.floor(Math.random() * messages.length)]);
  }, [streak]);

  const getProgressToNext = () => {
    if (!stageInfo?.nextMilestone) return null;
    
    const progress = (streak / stageInfo.nextMilestone) * 100;
    return Math.min(progress, 100);
  };

  const getDaysToNext = () => {
    if (!stageInfo?.nextMilestone) return null;
    return stageInfo.nextMilestone - streak;
  };

  return (
    <div className={`w-full flex justify-center ${className}`}>
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 w-full max-w-md">
        <CardContent className="p-6 text-center">
          {/* Header */}
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-green-700">Your Soul Tree</h3>
            <Sparkles className="w-5 h-5 text-green-600 ml-2" />
          </div>
          
          {/* Tree Image */}
          <div className="relative mb-4">
            <img 
              src={treeImg} 
              alt="Tree Progress" 
              className="w-full max-w-[200px] mx-auto drop-shadow-lg" 
            />
            {stageInfo && (
              <Badge 
                variant="outline" 
                className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-white border-green-300 text-green-700"
              >
                Stage {stageInfo.stage}
              </Badge>
            )}
          </div>
          
          {/* Streak Info */}
          <div className="space-y-2 mb-4">
            <div className="text-2xl font-bold text-green-800">
              {streak} Day{streak !== 1 ? 's' : ''}
            </div>
            <div className="text-sm text-green-600 font-medium">
              {stageInfo?.title}
            </div>
          </div>
          
          {/* Progress to Next Stage */}
          {stageInfo?.nextMilestone && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-green-600 mb-1">
                <span>Progress to next stage</span>
                <span>{getDaysToNext()} days to go</span>
              </div>
              <div className="w-full bg-green-100 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getProgressToNext()}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-center mt-2 text-xs text-green-600">
                <Target className="w-3 h-3 mr-1" />
                Next milestone: {stageInfo.nextMilestone} days
              </div>
            </div>
          )}
          
          {/* Description */}
          <p className="text-sm text-green-700 mb-3 leading-relaxed">
            {stageInfo?.description}
          </p>
          
          {/* Inspirational Message */}
          <div className="bg-white/70 rounded-lg p-3 border border-green-200">
            <p className="text-sm text-green-800 italic">
              "{currentMessage}"
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TreeProgress;