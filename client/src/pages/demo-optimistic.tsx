import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useOptimisticJournal } from '@/hooks/useOptimisticJournal';
import { useUserStatus } from '@/hooks/useUserStatus';
import OptimisticLoadingIndicator from '@/components/OptimisticLoadingIndicator';
import MemoryLoopVisualization from '@/components/MemoryLoopVisualization';
import InnerEcho from '@/components/InnerEcho';
import DailyPromptCard from '@/components/DailyPromptCard';
import ThemeTracker from '@/components/ThemeTracker';
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, Gift, Bell, BookOpen } from "lucide-react";

const DemoOptimisticUI: React.FC = () => {
  const [journalText, setJournalText] = useState('');
  const {
    optimisticEntries,
    loadingStates,
    isProcessing,
    loadingMessage,
    handleJournalSubmit,
    retryEntry,
    removeOptimisticEntry,
    isSubmitting
  } = useOptimisticJournal();

  const {
    userStatus,
    hasUnreadContent,
    notificationBadgeCount,
    subscriptionStatusMessage,
    streakMessage,
    currentStreak,
    unreadInsights,
    emergentThemes
  } = useUserStatus();

  const handleSubmit = async () => {
    if (!journalText.trim()) return;
    
    await handleJournalSubmit(journalText);
    setJournalText(''); // Clear input after submission
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header with status */}
      <div className="flex flex-col items-center justify-center text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome back</h1>
        <InnerEcho />
        
        {hasUnreadContent && (
          <div className="flex items-center space-x-2 mt-4">
            <Bell className="w-4 h-4 text-purple-600" />
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              {notificationBadgeCount} new
            </Badge>
          </div>
        )}
        
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800">Optimistic UI Demo</h2>
          <p className="text-gray-600">Experience instant feedback with background processing</p>
        </div>
      </div>

      {/* Daily Prompt */}
      <DailyPromptCard />

      {/* Theme Tracker */}
      <ThemeTracker />

      {/* Chapter Generation Hint */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <h3 className="text-lg font-semibold text-indigo-800">Life Chapters</h3>
          </div>
          <p className="text-indigo-700 mb-4">
            Continue journaling to unlock poetic autobiographical summaries of your emotional growth journey.
          </p>
          <div className="flex gap-3 justify-center">
            <Button 
              variant="outline" 
              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              onClick={() => window.location.href = '/chapters'}
            >
              View Chapters
            </Button>
            <Button 
              variant="outline" 
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
              onClick={() => window.location.href = '/ask-arc'}
            >
              Ask Arc
            </Button>
            <Button 
              variant="outline" 
              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              onClick={() => window.location.href = '/constellation'}
            >
              View Constellation
            </Button>
            <Button 
              variant="outline" 
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
              onClick={() => window.location.href = '/constellations'}
            >
              Monthly Reflections
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Status Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span>Live Status Dashboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{currentStreak}</div>
              <div className="text-sm text-blue-800">Day Streak</div>
              <div className="text-xs text-blue-600 mt-1">{streakMessage}</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{unreadInsights}</div>
              <div className="text-sm text-purple-800">Unread Insights</div>
              <div className="text-xs text-purple-600 mt-1">{subscriptionStatusMessage}</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{emergentThemes.length}</div>
              <div className="text-sm text-green-800">Active Themes</div>
              <div className="text-xs text-green-600 mt-1">
                {emergentThemes.slice(0, 2).join(', ') || 'Discovering patterns...'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journal Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle>Write Your Journal Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="What's on your mind today? Share your thoughts, feelings, or experiences..."
            value={journalText}
            onChange={(e) => setJournalText(e.target.value)}
            className="min-h-[120px]"
            disabled={isSubmitting}
          />
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {journalText.split(/\s+/).filter(word => word.length > 0).length} words
            </div>
            
            <Button 
              onClick={handleSubmit}
              disabled={!journalText.trim() || isSubmitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Entry'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Optimistic Loading Indicator */}
      <OptimisticLoadingIndicator 
        loadingStates={loadingStates}
        message={loadingMessage}
      />

      {/* Optimistic Entries Display */}
      {optimisticEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>Recent Entries</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {optimisticEntries.map((entry) => (
              <div key={entry.localId} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <Badge 
                    variant={entry.status === 'synced' ? 'default' : 
                            entry.status === 'error' ? 'destructive' : 'secondary'}
                  >
                    {entry.status === 'pending' ? 'Processing' : 
                     entry.status === 'synced' ? 'Synced' : 'Error'}
                  </Badge>
                  
                  <div className="text-xs text-gray-500">
                    {entry.createdAt.toLocaleTimeString()}
                  </div>
                </div>
                
                <p className="text-sm text-gray-700 mb-2">
                  {entry.content.length > 150 ? 
                    `${entry.content.substring(0, 150)}...` : 
                    entry.content
                  }
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {entry.wordCount} words
                  </span>
                  
                  {entry.status === 'error' && (
                    <div className="space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => retryEntry(entry.localId)}
                      >
                        Retry
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => removeOptimisticEntry(entry.localId)}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Memory Loop Visualization */}
      <MemoryLoopVisualization />

      {/* Background Processing Info */}
      <Card className="border-l-4 border-l-green-500">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Gift className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Background Processing Active
            </span>
          </div>
          <p className="text-sm text-green-700">
            Your entries are being processed in the background for AI analysis, 
            emotion scoring, progress tracking, and reward checking. Results will 
            appear automatically when ready.
          </p>
        </CardContent>
      </Card>

      {/* Demo Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 space-y-2">
          <p><strong>Optimistic UI:</strong> Entries appear instantly before server confirmation</p>
          <p><strong>Progressive Loading:</strong> Visual feedback shows each processing step</p>
          <p><strong>Background Processing:</strong> AI analysis happens without blocking the UI</p>
          <p><strong>Real-time Sync:</strong> Status updates automatically every minute</p>
          <p><strong>Memory Loop:</strong> Emotional patterns and themes emerge over time</p>
          <p><strong>Error Handling:</strong> Failed operations can be retried or removed</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemoOptimisticUI;