import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Brain, Sparkles, LoaderCircle, Eye, ArrowRight, MessageSquare } from "lucide-react";
import { usePremium } from '@/context/PremiumContext';
import { apiRequest } from '@/lib/queryClient';

interface TapToGoDeeperProps {
  originalPrompt: string;
  userEntry: string;
  onDeepInsight?: (insight: string) => void;
  className?: string;
}

interface ConversationThread {
  userInput: string;
  aiResponse: string;
  level: number;
  timestamp: Date;
}

const TapToGoDeeper: React.FC<TapToGoDeeperProps> = ({
  originalPrompt,
  userEntry,
  onDeepInsight,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [conversationThread, setConversationThread] = useState<ConversationThread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [userResponse, setUserResponse] = useState('');
  const [showUserInput, setShowUserInput] = useState(false);
  const { isPremium } = usePremium();
  const componentRef = useRef<HTMLDivElement>(null);
  const userInputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll component into view when expanded
  useEffect(() => {
    if (isExpanded && componentRef.current) {
      componentRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [isExpanded]);

  // Focus user input when it becomes visible
  useEffect(() => {
    if (showUserInput && userInputRef.current) {
      userInputRef.current.focus();
    }
  }, [showUserInput]);

  const getDeeperInsight = async (userInput: string, threadHistory: ConversationThread[], level: number) => {
    try {
      // Build context from conversation thread
      const threadContext = threadHistory.map((thread, index) => 
        `Round ${index + 1}:\nUser: ${thread.userInput}\nAI: ${thread.aiResponse}`
      ).join('\n\n');

      const contextualPrompt = threadHistory.length > 0 
        ? `Original entry: "${userEntry}"\n\nConversation so far:\n${threadContext}\n\nUser's latest response: "${userInput}"`
        : `Original entry: "${userEntry}"\nUser wants to explore: "${userInput}"`;

      const response = await apiRequest('POST', '/api/deeper-thread', {
        prompt: contextualPrompt,
        level: level,
        isPremium: isPremium,
        originalPrompt: originalPrompt
      });

      const data = await response.json();
      return data.deeperReflection || "Your thoughts hold layers of wisdom waiting to be explored. What resonates with you from this reflection?";
    } catch (error) {
      console.error('Error getting deeper insight:', error);
      return "There's something profound waiting to be discovered here. What aspect of this feels most significant to you right now?";
    }
  };

  const handleGoDeeper = async () => {
    if (!isPremium && currentLevel >= 1) {
      // Free users get 1 level, premium gets unlimited
      return;
    }

    if (currentLevel >= 5) {
      return; // Max depth reached
    }

    setIsExpanded(true);
    setShowUserInput(true);
  };

  const handleUserSubmit = async () => {
    if (!userResponse.trim()) return;

    setIsLoading(true);
    setShowUserInput(false);

    try {
      const insight = await getDeeperInsight(userResponse, conversationThread, currentLevel);
      
      const newThread: ConversationThread = {
        userInput: userResponse,
        aiResponse: insight,
        level: currentLevel,
        timestamp: new Date()
      };

      setConversationThread(prev => [...prev, newThread]);
      setCurrentLevel(prev => prev + 1);
      setUserResponse('');
      
      if (onDeepInsight) {
        onDeepInsight(insight);
      }

      // After AI responds, show input for next round (if not at max)
      if (currentLevel < 4) {
        setTimeout(() => setShowUserInput(true), 1000);
      }
    } catch (error) {
      console.error('Error in handleUserSubmit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={componentRef} className={`mt-4 ${className}`}>
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <Button
            onClick={handleGoDeeper}
            disabled={isLoading || currentLevel >= 5 || (!isPremium && currentLevel >= 1)}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
          >
            {isLoading ? (
              <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Eye className="w-4 h-4 mr-2" />
            )}
            {currentLevel === 0 ? "Tap to Go Deeper" : `Continue Exploration (Level ${currentLevel + 1})`}
            {!isPremium && currentLevel >= 1 && (
              <Badge className="ml-2 bg-amber-500">Premium</Badge>
            )}
          </Button>

          {isExpanded && (
            <div className="mt-4 space-y-4">
              {/* Conversation Thread */}
              {conversationThread.map((thread, index) => (
                <div key={index} className="space-y-3">
                  {/* User Input */}
                  <div className="p-3 bg-slate-100 rounded-lg border-l-4 border-slate-400">
                    <div className="flex items-center space-x-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-slate-600" />
                      <span className="text-sm font-medium text-slate-700">Your Response</span>
                    </div>
                    <p className="text-sm text-slate-700">
                      {thread.userInput}
                    </p>
                  </div>

                  {/* AI Response */}
                  <div className="p-4 bg-white/80 rounded-lg border border-purple-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Brain className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">Level {thread.level + 1} Insight</span>
                      <Badge variant="outline" className="text-xs">
                        {thread.level === 0 ? 'Surface' : 
                         thread.level === 1 ? 'Deeper' : 
                         thread.level === 2 ? 'Core' : 
                         thread.level === 3 ? 'Soul' : 'Transcendent'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed italic">
                      {thread.aiResponse}
                    </p>
                  </div>
                </div>
              ))}

              {/* User Input Area */}
              {showUserInput && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Your Turn</span>
                  </div>
                  <Textarea
                    ref={userInputRef}
                    placeholder="What resonates with you? What would you like to explore further?"
                    value={userResponse}
                    onChange={(e) => setUserResponse(e.target.value)}
                    className="min-h-[80px] border-blue-200 focus:border-blue-400"
                  />
                  <div className="flex space-x-2 mt-3">
                    <Button
                      onClick={handleUserSubmit}
                      disabled={!userResponse.trim() || isLoading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isLoading ? (
                        <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      Explore Further
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowUserInput(false);
                        setUserResponse('');
                      }}
                    >
                      Skip
                    </Button>
                  </div>
                </div>
              )}

              {/* Continue Button (when not showing input) */}
              {!showUserInput && currentLevel < 5 && !isLoading && conversationThread.length > 0 && (
                <Button
                  onClick={() => setShowUserInput(true)}
                  variant="outline"
                  className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Continue This Thread
                </Button>
              )}

              {/* Max depth reached */}
              {currentLevel >= 5 && (
                <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-amber-200 text-center">
                  <Sparkles className="w-6 h-6 mx-auto text-amber-600 mb-2" />
                  <p className="text-sm text-amber-800 font-medium">
                    You've reached the deepest level of exploration. Take a moment to integrate these insights.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TapToGoDeeper;